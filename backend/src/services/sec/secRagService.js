/**
 * SEC RAG service
 * -----------------------------------------------------------------------------
 * Turns SEC filing sections into pgvector-backed searchable evidence. Answers
 * are extractive and evidence-first: no matching filing chunks means no answer.
 */

const { PrismaClient, Prisma } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sharedParser, ITEM_PATTERNS } = require('./filingParser');

const prisma = new PrismaClient();

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSIONS = 768;
const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_CHUNK_OVERLAP = 180;
const MIN_EVIDENCE_SIMILARITY = 0.36;

const SECTION_TITLES = {
  business: 'Item 1. Business',
  riskFactors: 'Item 1A. Risk Factors',
  unresolvedComments: 'Item 1B. Unresolved Staff Comments',
  properties: 'Item 2. Properties',
  legal: 'Item 3. Legal Proceedings',
  mdna: "Item 7. Management's Discussion and Analysis",
  marketRisks: 'Item 7A. Market Risk',
  financialStatements: 'Item 8. Financial Statements',
};

const QUERY_SECTION_HINTS = [
  { re: /\b(risk|risks|disclos|liquidity|debt|capital|market|competition|legal|lawsuit)\b/i, sectionKeys: ['riskFactors'] },
  { re: /\b(financial|revenue|cash|loss|income|expense|burn|liquidity|debt|funding)\b/i, sectionKeys: ['mdna', 'financialStatements', 'riskFactors'] },
  { re: /\b(business|strategy|growth|product|customer|operation|challenge)\b/i, sectionKeys: ['business', 'mdna'] },
  { re: /\b(legal|proceeding|lawsuit|litigation)\b/i, sectionKeys: ['legal', 'riskFactors'] },
];

function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function escapeTsQueryTerm(term) {
  return term.replace(/[':*!&|()]/g, ' ').trim();
}

function stableConfidence(similarity, chunkConfidence) {
  const base = Number(chunkConfidence || 0.8);
  const semantic = Number(similarity || 0);
  return Math.max(0.1, Math.min(0.99, (base * 0.6) + (semantic * 0.4)));
}

class SecRagService {
  constructor({ parser = sharedParser, logger = console } = {}) {
    this.parser = parser;
    this.logger = logger;
    this.embeddingClient = null;
  }

  getEmbeddingClient() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required to create SEC filing embeddings');
    }
    if (!this.embeddingClient) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.embeddingClient = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    }
    return this.embeddingClient;
  }

  async embedText(text) {
    const model = this.getEmbeddingClient();
    const result = await model.embedContent(normalizeWhitespace(text).slice(0, 8000));
    const values = result?.embedding?.values;
    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(`Embedding model returned ${values?.length || 0} dimensions; expected ${EMBEDDING_DIMENSIONS}`);
    }
    return values;
  }

  vectorLiteral(values) {
    return `[${values.map((value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num.toFixed(8) : '0';
    }).join(',')}]`;
  }

  inferSectionHints(query) {
    const hints = new Set();
    for (const rule of QUERY_SECTION_HINTS) {
      if (rule.re.test(query)) {
        for (const sectionKey of rule.sectionKeys) hints.add(sectionKey);
      }
    }
    return [...hints];
  }

  chunkText(text, { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP } = {}) {
    const normalized = normalizeWhitespace(text);
    if (!normalized) return [];
    if (normalized.length <= chunkSize) return [normalized];

    const chunks = [];
    let start = 0;
    while (start < normalized.length) {
      const hardEnd = Math.min(start + chunkSize, normalized.length);
      let end = hardEnd;
      if (hardEnd < normalized.length) {
        const sentenceBreak = normalized.lastIndexOf('. ', hardEnd);
        const paragraphBreak = normalized.lastIndexOf('\n', hardEnd);
        const softEnd = Math.max(sentenceBreak, paragraphBreak);
        if (softEnd > start + Math.floor(chunkSize * 0.6)) end = softEnd + 1;
      }
      const chunk = normalized.slice(start, end).trim();
      if (chunk.length > 80) chunks.push(chunk);
      if (end >= normalized.length) break;
      start = Math.max(0, end - overlap);
    }
    return chunks;
  }

  sectionEntries(sections) {
    return Object.entries(sections)
      .filter(([, text]) => normalizeWhitespace(text).length > 100)
      .map(([sectionKey, text]) => ({
        sectionKey,
        sectionTitle: SECTION_TITLES[sectionKey] || sectionKey,
        text,
      }));
  }

  citationForChunk(chunk) {
    return chunk.length <= 500 ? chunk : `${chunk.slice(0, 497).trim()}...`;
  }

  async indexFiling(filing, options = {}) {
    if (!filing?.id) throw new Error('SEC filing is required for indexing');
    const { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_CHUNK_OVERLAP } = options;
    const parsed = await this.parser.parse(filing);
    const entries = this.sectionEntries(parsed.sections);
    if (!entries.length) {
      return { filingId: filing.id, accessionNumber: filing.accessionNumber, chunks: 0, reason: 'no sections found' };
    }

    await prisma.$executeRaw`DELETE FROM "sec_filing_chunks" WHERE "secFilingId" = ${filing.id}::uuid`;

    let chunkIndex = 0;
    for (const entry of entries) {
      const chunks = this.chunkText(entry.text, { chunkSize, overlap });
      for (const chunk of chunks) {
        const embedding = await this.embedText(`${entry.sectionTitle}\n${chunk}`);
        const vector = this.vectorLiteral(embedding);
        const metadata = {
          accessionNumber: filing.accessionNumber,
          filingType: filing.filingType,
          filingDate: filing.filingDate,
          reportDate: filing.reportDate,
          sourceUrl: filing.url,
          primaryDocument: filing.primaryDocument,
        };

        await prisma.$executeRaw`
          INSERT INTO "sec_filing_chunks" (
            "secCompanyId",
            "secFilingId",
            "chunkIndex",
            "content",
            "sectionKey",
            "sectionTitle",
            "citationText",
            "pageNumber",
            "confidence",
            "metadata",
            "embedding",
            "embeddingModel",
            "tokenCount",
            "updatedAt"
          )
          VALUES (
            ${filing.secCompanyId}::uuid,
            ${filing.id}::uuid,
            ${chunkIndex},
            ${chunk},
            ${entry.sectionKey},
            ${entry.sectionTitle},
            ${this.citationForChunk(chunk)},
            ${null},
            ${0.82},
            ${JSON.stringify(metadata)}::jsonb,
            ${vector}::vector,
            ${EMBEDDING_MODEL},
            ${Math.ceil(chunk.length / 4)},
            CURRENT_TIMESTAMP
          )
        `;
        chunkIndex++;
      }
    }

    this.logger.log?.(`[SEC:rag] filing ${filing.accessionNumber}: indexed ${chunkIndex} chunks`);
    return { filingId: filing.id, accessionNumber: filing.accessionNumber, chunks: chunkIndex };
  }

  async indexCompany(secCompanyId, { limit = 0, filingTypes = null } = {}) {
    const filings = await prisma.secFiling.findMany({
      where: {
        secCompanyId,
        ...(filingTypes?.length ? { filingType: { in: filingTypes } } : {}),
      },
      orderBy: { filingDate: 'desc' },
      ...(limit ? { take: limit } : {}),
    });

    const summary = { filings: filings.length, chunks: 0, errors: [] };
    for (const filing of filings) {
      try {
        const result = await this.indexFiling(filing);
        summary.chunks += result.chunks || 0;
      } catch (err) {
        summary.errors.push(`${filing.accessionNumber}: ${err.message}`);
      }
    }
    return summary;
  }

  async search(query, options = {}) {
    const {
      secCompanyId = null,
      sectionKeys = null,
      limit = 10,
      minSimilarity = MIN_EVIDENCE_SIMILARITY,
    } = options;
    if (!query || !query.trim()) throw new Error('SEC RAG query is required');

    const embedding = await this.embedText(query);
    const vector = this.vectorLiteral(embedding);
    const inferredSections = sectionKeys?.length ? sectionKeys : this.inferSectionHints(query);
    const queryTerms = escapeTsQueryTerm(query)
      .split(/\s+/)
      .filter((term) => term.length > 2)
      .slice(0, 8)
      .join(' | ');

    const filters = [Prisma.sql`c."embedding" IS NOT NULL`];
    if (secCompanyId) filters.push(Prisma.sql`c."secCompanyId" = ${secCompanyId}::uuid`);
    if (inferredSections.length) {
      filters.push(Prisma.sql`c."sectionKey" IN (${Prisma.join(inferredSections)})`);
    }
    const keywordRankSql = queryTerms
      ? Prisma.sql`ts_rank_cd(to_tsvector('english', c."content"), to_tsquery('english', ${queryTerms}))`
      : Prisma.sql`0`;

    const rows = await prisma.$queryRaw`
      SELECT
        c."id",
        c."secCompanyId",
        c."secFilingId",
        c."chunkIndex",
        c."content",
        c."sectionKey",
        c."sectionTitle",
        c."citationText",
        c."pageNumber",
        c."confidence",
        c."metadata",
        c."embeddingModel",
        sc."name" AS "companyName",
        sc."cik" AS "cik",
        sf."accessionNumber",
        sf."filingType",
        sf."filingDate",
        sf."reportDate",
        sf."url" AS "filingUrl",
        (1 - (c."embedding" <=> ${vector}::vector)) AS "similarity",
        ${keywordRankSql} AS "keywordRank"
      FROM "sec_filing_chunks" c
      JOIN "sec_filings" sf ON sf."id" = c."secFilingId"
      JOIN "sec_companies" sc ON sc."id" = c."secCompanyId"
      WHERE ${Prisma.join(filters, ' AND ')}
      ORDER BY (c."embedding" <=> ${vector}::vector) ASC, "keywordRank" DESC
      LIMIT ${Math.min(Number(limit) || 10, 50)}
    `;

    return rows
      .map((row) => ({
        id: row.id,
        secCompanyId: row.secCompanyId,
        secFilingId: row.secFilingId,
        companyName: row.companyName,
        cik: row.cik,
        secFiling: row.accessionNumber,
        filingType: row.filingType,
        filingDate: row.filingDate,
        reportDate: row.reportDate,
        filingUrl: row.filingUrl,
        section: row.sectionTitle || row.sectionKey,
        sectionKey: row.sectionKey,
        confidence: stableConfidence(row.similarity, row.confidence),
        similarity: Number(row.similarity),
        citation: row.citationText,
        pageNumber: row.pageNumber,
        content: row.content,
        metadata: row.metadata,
      }))
      .filter((row) => row.similarity >= minSimilarity);
  }

  async answer(query, options = {}) {
    const results = await this.search(query, {
      ...options,
      limit: options.limit || 8,
    });

    if (!results.length) {
      return {
        answer: 'No SEC filing evidence was found for this query.',
        confidence: 0,
        evidenceRequired: true,
        sources: [],
      };
    }

    const top = results.slice(0, Math.min(results.length, 5));
    const companies = [...new Set(top.map((item) => item.companyName).filter(Boolean))];
    const answer = [
      `Found SEC filing evidence for ${companies.join(', ') || 'the requested companies'}.`,
      ...top.map((item, index) => `${index + 1}. ${item.companyName} disclosed this in ${item.secFiling} (${item.filingDate ? new Date(item.filingDate).toISOString().slice(0, 10) : 'date unavailable'}), ${item.section}: ${item.citation}`),
    ].join('\n');

    return {
      answer,
      confidence: Math.round((top.reduce((sum, item) => sum + item.confidence, 0) / top.length) * 100) / 100,
      evidenceRequired: true,
      sources: top.map((item) => ({
        company: item.companyName,
        secFiling: item.secFiling,
        filingDate: item.filingDate,
        section: item.section,
        confidence: item.confidence,
        citation: item.citation,
        pageNumber: item.pageNumber,
        filingUrl: item.filingUrl,
      })),
      results,
    };
  }
}

const sharedSecRagService = new SecRagService();

module.exports = {
  SecRagService,
  sharedSecRagService,
  SECTION_TITLES,
  MIN_EVIDENCE_SIMILARITY,
};
