/**
 * Builds PivotVault Company records from SEC data, filing intelligence, and AI extraction.
 */

const { PrismaClient } = require('@prisma/client');
const KnowledgeExtractor = require('../extraction/KnowledgeExtractor');
const { searchWeb, researchStartup } = require('../searchService');
const graphService = require('../graph');
const { secService } = require('../sec');
const { padCik, looksLikeTicker } = require('../sec/util');

const prisma = new PrismaClient();

function toSlug(name) {
  return String(name || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200) || 'company';
}

async function ensureIndustry(name) {
  if (!name) return null;
  const slug = toSlug(name);
  return prisma.industry.upsert({
    where: { slug },
    update: {},
    create: { name, slug, description: `${name} sector` },
  });
}

function buildSecContext(secCompany, intelligenceRows, financials, risks) {
  const parts = [`Company: ${secCompany.name}`, `CIK: ${secCompany.cik}`, `Tickers: ${(secCompany.tickers || []).join(', ')}`];

  for (const intel of intelligenceRows.slice(0, 3)) {
    if (intel?.insights?.executiveSummary) {
      parts.push(`Executive summary: ${intel.insights.executiveSummary}`);
    }
    for (const [key, field] of Object.entries(intel?.fields || {})) {
      if (field?.value) parts.push(`${key}: ${field.value}`);
    }
  }

  for (const f of financials.slice(0, 12)) {
    if (f.metricValue != null) {
      parts.push(`Financial ${f.metricKey} (${f.fiscalYear || 'N/A'}): ${f.metricValue}`);
    }
  }

  for (const r of risks.slice(0, 5)) {
    parts.push(`Risk (${r.riskCategory || 'general'}): ${(r.title || r.content || '').slice(0, 300)}`);
  }

  return parts.join('\n');
}

async function fetchWebEnrichmentContext(companyName) {
  if (!companyName) return '';
  // researchStartup runs multiple targeted queries (failure history, shutdown
  // news, founder interviews/lessons) so private/failed-startup nuance that
  // never appears in SEC filings is captured for the AI extractor.
  const sources = await researchStartup(companyName);
  if (!sources.length) return '';
  return sources
    .map((s) => `${s.title} (${s.publisher}${s.date ? `, ${s.date}` : ''})\n${s.summary || ''}`)
    .join('\n---\n');
}

async function persistExtractedRelations(companyId, extracted) {
  if (extracted.founders?.length) {
    for (const founder of extracted.founders) {
      const existing = await prisma.founder.findFirst({
        where: { companyId, name: founder.name },
      });
      if (!existing) {
        await prisma.founder.create({
          data: {
            companyId,
            name: founder.name,
            role: founder.role,
            bio: founder.bio,
            linkedinUrl: founder.linkedinUrl,
            twitterUrl: founder.twitterUrl,
            isPrimary: true,
          },
        });
      }
    }
  }

  if (extracted.timeline?.length) {
    for (const ev of extracted.timeline.slice(0, 20)) {
      const stage = ['idea', 'prototype', 'launch', 'growth', 'decline', 'shutdown', 'acquisition', 'pivot'].includes(ev.category)
        ? ev.category
        : 'growth';
      const eventDate = ev.date ? new Date(ev.date) : new Date();
      const dup = await prisma.timelineEvent.findFirst({
        where: { companyId, title: ev.title },
      });
      if (!dup) {
        await prisma.timelineEvent.create({
          data: {
            companyId,
            stage,
            eventDate,
            title: ev.title,
            description: ev.description || ev.title,
          },
        });
      }
    }
  }

  if (extracted.lessons?.length) {
    for (const lesson of extracted.lessons.slice(0, 10)) {
      const dup = await prisma.lesson.findFirst({ where: { companyId, title: lesson.title } });
      if (!dup) {
        await prisma.lesson.create({
          data: {
            companyId,
            title: lesson.title,
            content: lesson.content,
            priority: lesson.priority || 'medium',
            isKey: lesson.priority === 'high',
          },
        });
      }
    }
  }

  if (extracted.competitors?.length) {
    for (const compName of extracted.competitors.slice(0, 8)) {
      const targetSlug = toSlug(compName);
      let target = await prisma.company.findUnique({ where: { slug: targetSlug } });
      if (!target) {
        target = await prisma.company.create({
          data: {
            name: compName,
            slug: targetSlug,
            industry: 'Unknown',
            country: 'USA',
            status: 'operating',
            summary: `${compName} (competitor reference)`,
          },
        });
      }
      const exists = await prisma.companyCompetitor.findFirst({
        where: { sourceCompanyId: companyId, targetCompanyId: target.id },
      });
      if (!exists) {
        await prisma.companyCompetitor.create({
          data: { sourceCompanyId: companyId, targetCompanyId: target.id },
        });
      }
    }
  }

  if (extracted.products?.length) {
    for (const productName of extracted.products.slice(0, 10)) {
      const pSlug = toSlug(productName);
      const product = await prisma.product.upsert({
        where: { slug: pSlug },
        update: {},
        create: { name: productName, slug: pSlug },
      });
      const link = await prisma.companyProduct.findFirst({
        where: { companyId, productId: product.id },
      });
      if (!link) {
        await prisma.companyProduct.create({
          data: { companyId, productId: product.id, isPrimary: false },
        });
      }
    }
  }
}

async function buildCompanyProfile({ secCompany, resolution, sourcesUsed }) {
  const [financials, risks, intelligenceRows, latestFilings] = await Promise.all([
    secService.getFinancials(secCompany.id, { limit: 100 }),
    secService.getRiskFactors(secCompany.id, { limit: 50 }),
    secService.getCompanyIntelligence(secCompany.id, { limit: 5 }),
    secService.getFilings(secCompany.id, { limit: 20 }),
  ]);

  let contextText = buildSecContext(secCompany, intelligenceRows, financials, risks);

  // Always enrich with web/news context alongside SEC data (not just as a
  // sparse-context fallback) so the postmortem captures founder lessons,
  // failure narrative, and shutdown news that SEC filings omit.
  const webContext = await fetchWebEnrichmentContext(secCompany.name || resolution?.name);
  if (webContext) {
    contextText += `\n\nWeb & news sources:\n${webContext}`;
    if (!sourcesUsed.includes('tavily_web')) sourcesUsed.push('tavily_web');
  }

  const extractor = new KnowledgeExtractor();
  let extracted = { companies: [], founders: [], timeline: [], lessons: [], competitors: [], products: [] };
  try {
    extracted = await extractor.extract(contextText, {
      title: secCompany.name,
      url: latestFilings[0]?.url,
      source: 'sec_edgar',
    });
  } catch {
    /* AI optional */
  }

  const latestIntel = intelligenceRows[0];
  const latestRev = financials.find((f) => f.metricKey === 'revenue');
  const latestCash = financials.find((f) => f.metricKey === 'cash_and_equivalents');
  const employeesField = latestIntel?.fields?.employees;
  const businessOverview = latestIntel?.fields?.business_overview?.value;
  const industryGuess =
    extracted.companies?.[0]?.industry ||
    (businessOverview?.match(/\b(SaaS|Automotive|Technology|Finance|Healthcare|Retail|E-Commerce)\b/i)?.[0]) ||
    'Public Company';

  const industry = await ensureIndustry(industryGuess);
  const name = secCompany.name || extracted.companies?.[0]?.name || resolution?.name || 'Unknown Company';
  const slugBase = toSlug(name);
  let slug = slugBase;
  const existingBySec = await prisma.company.findFirst({
    where: { secCompanies: { some: { id: secCompany.id } } },
  });
  if (existingBySec) {
    slug = existingBySec.slug;
  } else {
    let suffix = 0;
    while (await prisma.company.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${slugBase}-${suffix}`;
    }
  }

  const summary =
    latestIntel?.insights?.executiveSummary ||
    extracted.companies?.[0]?.description ||
    businessOverview?.slice(0, 500) ||
    `${name} public company profile sourced from SEC EDGAR filings.`;

  const companyData = {
    name,
    slug,
    industry: industry.name,
    industryId: industry.id,
    country: extracted.companies?.[0]?.country || 'USA',
    status: 'public',
    foundingYear: extracted.companies?.[0]?.foundingYear || null,
    summary,
    description: businessOverview || extracted.companies?.[0]?.description || summary,
    teamSize: employeesField?.valueNumeric ? Number(employeesField.valueNumeric) : null,
    fundingUsd: latestRev?.metricValue ? BigInt(Math.round(Number(latestRev.metricValue))) : null,
  };

  let company = await prisma.company.findFirst({
    where: { OR: [{ secCompanies: { some: { id: secCompany.id } } }, { slug }] },
  });

  if (company) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: companyData,
    });
  } else {
    company = await prisma.company.create({ data: companyData });
  }

  await prisma.secCompany.update({
    where: { id: secCompany.id },
    data: { companyId: company.id },
  });

  await persistExtractedRelations(company.id, extracted);

  if (latestIntel?.insights) {
    await prisma.aiAnalysis.upsert({
      where: { companyId: company.id },
      update: {
        retentionScore: 100 - (latestIntel.insights.operationalRiskScore || 50),
        monetizationScore: latestIntel.insights.financialHealthScore || 50,
        pmfScore: latestIntel.insights.businessHealthScore || 50,
        marketingScore: latestIntel.insights.marketRiskScore || 50,
        primaryCause: 'sec_filing_intelligence',
        confidence: latestIntel.insights.overallHealthScore || 75,
        recommendations: latestIntel.insights.scoreReasoning || [],
        rawLlmResponse: JSON.stringify(latestIntel.insights),
        generatedAt: new Date(),
      },
      create: {
        companyId: company.id,
        retentionScore: 100 - (latestIntel.insights.operationalRiskScore || 50),
        monetizationScore: latestIntel.insights.financialHealthScore || 50,
        pmfScore: latestIntel.insights.businessHealthScore || 50,
        marketingScore: latestIntel.insights.marketRiskScore || 50,
        primaryCause: 'sec_filing_intelligence',
        confidence: latestIntel.insights.overallHealthScore || 75,
        recommendations: latestIntel.insights.scoreReasoning || [],
        rawLlmResponse: JSON.stringify(latestIntel.insights),
      },
    });
  }

  for (const filing of latestFilings.slice(0, 10)) {
    const dup = await prisma.timelineEvent.findFirst({
      where: { companyId: company.id, title: `${filing.filingType} filing` },
    });
    if (!dup && filing.filingDate) {
      await prisma.timelineEvent.create({
        data: {
          companyId: company.id,
          stage: filing.filingType === 'EIGHT_K' ? 'growth' : 'launch',
          eventDate: filing.filingDate,
          title: `${String(filing.filingType).replace(/_/g, '-')} filing`,
          description: `SEC filing ${filing.accessionNumber}`,
        },
      });
    }
  }

  await graphService.generateEdgesForCompany(company.id);
  try {
    const ragService = require('../rag');
    await ragService.chunkCompanyDocuments(company.id);
  } catch {
    /* embeddings optional without API key or langchain */
  }

  const profile = await assembleProfileSnapshot(company.id, secCompany, intelligenceRows, financials, risks);
  return { company, profile, extracted };
}

async function assembleProfileSnapshot(companyId, secCompany, intelligenceRows, financials, risks) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      founders: true,
      lessons: true,
      timelineEvents: { orderBy: { eventDate: 'desc' }, take: 15 },
      companyProducts: { include: { product: true } },
      competitorsFrom: { include: { targetCompany: true } },
      aiAnalyses: true,
      secCompanies: true,
    },
  });

  const latestIntel = intelligenceRows[0];
  const metrics = {};
  for (const f of financials) {
    if (!metrics[f.metricKey] || (f.fiscalYear && f.fiscalYear >= (metrics[f.metricKey].fiscalYear || 0))) {
      metrics[f.metricKey] = {
        value: f.metricValue != null ? Number(f.metricValue) : null,
        fiscalYear: f.fiscalYear,
        unit: f.unit,
      };
    }
  }

  return {
    company: {
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
      industry: company.industry,
      country: company.country,
      summary: company.summary,
      description: company.description,
      teamSize: company.teamSize,
      tickers: secCompany.tickers,
      cik: secCompany.cik,
    },
    business: latestIntel?.fields?.business_overview?.value || company.description,
    revenue: metrics.revenue || null,
    cash: metrics.cash_and_equivalents || null,
    employees: latestIntel?.fields?.employees || null,
    riskFactors: risks.slice(0, 10).map((r) => ({
      category: r.riskCategory,
      title: r.title,
      excerpt: (r.content || '').slice(0, 280),
    })),
    competitors: company.competitorsFrom.map((c) => c.targetCompany.name),
    products: company.companyProducts.map((cp) => cp.product.name),
    timeline: company.timelineEvents.map((t) => ({
      date: t.eventDate,
      stage: t.stage,
      title: t.title,
      description: t.description,
    })),
    leadership: company.founders.map((f) => ({ name: f.name, role: f.role, bio: f.bio })),
    financialHealth: latestIntel?.insights
      ? {
          overall: latestIntel.insights.overallHealthScore,
          financial: latestIntel.insights.financialHealthScore,
          funding: latestIntel.insights.fundingRiskScore,
          executiveSummary: latestIntel.insights.executiveSummary,
        }
      : null,
    lessons: company.lessons.map((l) => ({ title: l.title, content: l.content, priority: l.priority })),
    importantEvents: company.timelineEvents
      .filter((t) => t.title.includes('8-K') || t.title.includes('S-1') || t.title.includes('10-K'))
      .slice(0, 8),
    metrics,
    cachedAt: new Date().toISOString(),
  };
}

async function buildFromWebOnly(query, sourcesUsed) {
  sourcesUsed.push('tavily_web');
  const webResults = await searchWeb(`${query} company profile business`, { maxResults: 8 });
  const contextText = webResults.map((r) => `${r.title}\n${r.content || r.snippet}`).join('\n---\n');
  const extractor = new KnowledgeExtractor();
  const extracted = await extractor.extract(contextText, { title: query, source: 'web' });
  const comp = extracted.companies?.[0] || { name: query, description: contextText.slice(0, 500) };
  const industry = await ensureIndustry(comp.industry || 'Unknown');
  const slug = toSlug(comp.name || query);
  const company = await prisma.company.upsert({
    where: { slug },
    update: {
      summary: comp.description || `Profile for ${comp.name}`,
      description: comp.description,
      industry: industry.name,
      industryId: industry.id,
    },
    create: {
      name: comp.name || query,
      slug,
      industry: industry.name,
      industryId: industry.id,
      country: comp.country || 'USA',
      status: comp.status || 'operating',
      foundingYear: comp.foundingYear || null,
      summary: comp.description || `${comp.name || query} company profile`,
      description: comp.description,
    },
  });
  await persistExtractedRelations(company.id, extracted);
  await graphService.generateEdgesForCompany(company.id);
  try {
    const ragService = require('../rag');
    await ragService.chunkCompanyDocuments(company.id);
  } catch {
    /* optional */
  }
  return {
    company,
    profile: {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: company.status,
        industry: company.industry,
        summary: company.summary,
      },
      source: 'web_fallback',
      cachedAt: new Date().toISOString(),
    },
    extracted,
  };
}

module.exports = {
  buildCompanyProfile,
  buildFromWebOnly,
  assembleProfileSnapshot,
  toSlug,
  padCik,
  looksLikeTicker,
};
