const { PrismaClient } = require('@prisma/client');
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { pgvector } = require('pgvector');
const prisma = new PrismaClient();

// ---------------------------
// CHUNKING & EMBEDDING SERVICE
// ---------------------------

class RAGService {
  constructor() {
    this.embeddingsModel = new GoogleGenerativeAIEmbeddings({
      model: 'text-embedding-004',
      apiKey: process.env.GEMINI_API_KEY
    });

    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
  }

  // 1. CHUNK DOCUMENTS FOR COMPANY
  async chunkCompanyDocuments(companyId) {
    // Fetch all relevant content for a company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        articles: true,
        postmortems: true,
        failureReasons: true,
        lessons: true,
        timelineEvents: true,
        metricsSnapshots: true,
        founders: true
      }
    });

    if (!company) throw new Error(`Company ${companyId} not found`);

    // Clear existing chunks
    await prisma.documentChunk.deleteMany({
      where: { companyId }
    });

    // Prepare document chunks
    const allDocuments = [];

    // 1. Company profile
    const profileContent = `Company Profile: ${company.name}
Industry: ${company.industry}
Country: ${company.country}
Founded: ${company.foundingYear || 'N/A'}
Status: ${company.status}
Summary: ${company.summary}
${company.description ? `Description: ${company.description}` : ''}
${company.founderStory ? `Founder Story: ${company.founderStory}` : ''}
${company.fundingUsd ? `Total Funding: $${(company.fundingUsd / 1e6).toFixed(1)}M` : ''}
${company.shutdownYear ? `Shutdown Year: ${company.shutdownYear}` : ''}`;

    allDocuments.push({
      content: profileContent,
      type: 'company_profile',
      sourceModel: 'Company',
      sourceId: company.id
    });

    // 2. Articles
    for (const article of company.articles) {
      if (article.content) {
        allDocuments.push({
          content: `Article Title: ${article.title}
Source: ${article.source || 'Unknown'}
Date: ${article.publishedAt.toISOString()}
${article.summary ? `Summary: ${article.summary}` : ''}
Content: ${article.content}`,
          type: 'article',
          sourceModel: 'Article',
          sourceId: article.id
        });
      }
    }

    // 3. Postmortems
    for (const postmortem of company.postmortems) {
      allDocuments.push({
        content: `Postmortem Title: ${postmortem.title}
Author: ${postmortem.author || 'Unknown'}
Content: ${postmortem.content}`,
        type: 'postmortem',
        sourceModel: 'Postmortem',
        sourceId: postmortem.id
      });
    }

    // 4. Failure Reasons
    for (const failure of company.failureReasons) {
      allDocuments.push({
        content: `Failure Reason Category: ${failure.category}
Severity: ${failure.severityScore}
Description: ${failure.description}`,
        type: 'failure_reason',
        sourceModel: 'FailureReason',
        sourceId: failure.id
      });
    }

    // 5. Lessons
    for (const lesson of company.lessons) {
      allDocuments.push({
        content: `Lesson Title: ${lesson.title}
Priority: ${lesson.priority || 'Normal'}
Key Lesson: ${lesson.isKey ? 'Yes' : 'No'}
Content: ${lesson.content}`,
        type: 'lesson',
        sourceModel: 'Lesson',
        sourceId: lesson.id
      });
    }

    // 6. Timeline Events
    for (const event of company.timelineEvents) {
      allDocuments.push({
        content: `Timeline Event: ${event.title}
Stage: ${event.stage}
Date: ${event.eventDate.toISOString()}
Description: ${event.description}`,
        type: 'timeline_event',
        sourceModel: 'TimelineEvent',
        sourceId: event.id
      });
    }

    // Chunk and embed all docs
    let chunkIndex = 0;
    for (const doc of allDocuments) {
      const chunks = await this.splitter.splitText(doc.content);

      for (const chunk of chunks) {
        let embedding = null;
        try {
          embedding = await this.embeddingsModel.embedQuery(chunk);
        } catch (err) {
          console.error(`Embedding failed for ${doc.type}:`, err.message);
        }

        // Create chunk
        await prisma.documentChunk.create({
          data: {
            companyId,
            content: chunk,
            chunkIndex,
            chunkType: doc.type,
            sourceModel: doc.sourceModel,
            sourceId: doc.sourceId,
            embedding: embedding ? `[${embedding.join(',')}]` : null,
            embeddingModel: 'text-embedding-004',
            tokenCount: Math.ceil(chunk.length / 4)
          }
        });
        chunkIndex++;
      }
    }

    return { totalChunks: chunkIndex, companyId };
  }

  // ---------------------------
  // VECTOR SEARCH
  // ---------------------------

  async hybridSearch(query, options = {}) {
    const {
      limit = 10,
      companyId = null,
      chunkTypes = null
    } = options;

    // Step 1: Embed query
    const queryEmbedding = await this.embeddingsModel.embedQuery(query);

    // Step 2: Prepare filters
    let filters = {};
    if (companyId) filters.companyId = companyId;
    if (chunkTypes && chunkTypes.length > 0) filters.chunkType = { in: chunkTypes };

    // Step 3: Fetch candidate chunks
    const allChunks = await prisma.documentChunk.findMany({
      where: { ...filters, embedding: { not: null } },
      include: { company: { select: { id: true, name: true, slug: true } } },
      take: 100
    });

    // Step 4: Calculate similarity
    const scoredChunks = allChunks.map(chunk => {
      // Parse stored embedding
      let embeddingArr = [];
      try {
        embeddingArr = JSON.parse(chunk.embedding);
      } catch (_) {}

      // Cosine similarity
      let similarity = 0;
      if (embeddingArr.length === queryEmbedding.length) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < embeddingArr.length; i++) {
          dotProduct += embeddingArr[i] * queryEmbedding[i];
          normA += embeddingArr[i] * embeddingArr[i];
          normB += queryEmbedding[i] * queryEmbedding[i];
        }
        similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      }

      return {
        ...chunk,
        similarity
      };
    });

    // Step 5: Sort and filter
    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    const topChunks = scoredChunks.slice(0, limit);

    return topChunks;
  }

  // ---------------------------
  // RAG ANSWER GENERATION
  // ---------------------------
  async generateRAGAnswer(query, options = {}) {
    const {
      companyId = null,
      limit = 5
    } = options;

    // Step 1: Retrieve relevant chunks
    const chunks = await this.hybridSearch(query, {
      companyId,
      limit: limit
    });

    // Build context
    const contextText = chunks
      .map((chunk, i) => `[Source ${i + 1}] Company: ${chunk.company?.name || 'Unknown'}\nType: ${chunk.chunkType}\nContent: ${chunk.content}\n---`)
      .join('\n');

    // Build prompt
    const systemPrompt = `You are an expert startup failure analyst working at PivotVault, a platform that curates and analyzes failed startup data. Use only the provided context to answer the user's question. If you don't know the answer, say so clearly.

When answering, include:
1. Sources: Cite which sources you used with company names and source types
2. Confidence: Estimate your confidence (1-100) in the answer
3. Related Companies: List any relevant related companies mentioned
4. Related Lessons: If applicable, list any key lessons from the context
5. Timeline References: If timeline events are relevant, mention them

Respond with valid JSON only, in this format:
{
  "answer": "Your detailed answer here",
  "confidence": 85,
  "sources": [{"company": "Startup X", "type": "article"}],
  "relatedCompanies": ["Startup A", "Startup B"],
  "relatedLessons": ["Lesson 1 title"],
  "timelineReferences": ["Timeline event details"]
}

Do NOT include any markdown or other characters outside the JSON.`;

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.2,
      maxOutputTokens: 2048
    });

    const messages = [
      ["system", systemPrompt],
      ["human", `User Question: ${query}\n\nContext:\n${contextText}`]
    ];

    const response = await model.invoke(messages);
    let answerJson = null;

    try {
      // Clean response and parse
      let text = response.content;
      text = text.replace(/```json|```/g, '').trim();
      answerJson = JSON.parse(text);
    } catch (err) {
      // Fallback
      answerJson = {
        answer: response.content,
        confidence: 50,
        sources: [],
        relatedCompanies: [],
        relatedLessons: [],
        timelineReferences: []
      };
    }

    // Attach chunks for display
    answerJson.contextChunks = chunks;

    return answerJson;
  }
}

module.exports = new RAGService();
