/**
 * On-demand company import orchestrator.
 * Search → import → analyze → cache workflow with progress events.
 */

const { PrismaClient } = require('@prisma/client');
const { secService } = require('../sec');
const { padCik, looksLikeCik, looksLikeTicker } = require('../sec/util');
const { buildCompanyProfile, buildFromWebOnly, toSlug } = require('./profileBuilder');

const prisma = new PrismaClient();

const PROGRESS_STEPS = {
  searching_sec: 'Searching SEC...',
  resolving_company: 'Resolving company name, ticker, and CIK...',
  downloading_filings: 'Downloading filings...',
  parsing_documents: 'Parsing documents...',
  extracting_financials: 'Extracting financials...',
  building_company_profile: 'Building company profile...',
  generating_ai_insights: 'Generating AI insights...',
  saving_to_pivotvault: 'Saving to PivotVault...',
  generating_embeddings: 'Generating embeddings...',
  building_knowledge_graph: 'Building knowledge graph...',
  complete: 'Complete.',
};

const inFlight = new Map();

function normalizeDedupeKey(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return '';
  if (looksLikeCik(raw)) return padCik(raw);
  if (looksLikeTicker(raw)) return raw.toUpperCase();
  return toSlug(raw);
}

function serializeJob(job) {
  return {
    id: job.id,
    query: job.query,
    dedupeKey: job.dedupeKey,
    identifier: job.identifier,
    cik: job.cik,
    ticker: job.ticker,
    companyId: job.companyId,
    secCompanyId: job.secCompanyId,
    status: job.status,
    currentStep: job.currentStep,
    progress: job.progress || [],
    errorMessage: job.errorMessage,
    profile: job.profileSnapshot || null,
    sourcesUsed: job.sourcesUsed || [],
    retryCount: job.retryCount,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    lastRefreshedAt: job.lastRefreshedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function appendProgress(jobId, step) {
  const message = PROGRESS_STEPS[step] || step;
  const job = await prisma.companyImportJob.findUnique({ where: { id: jobId } });
  const progress = [...(Array.isArray(job?.progress) ? job.progress : []), {
    step,
    message,
    at: new Date().toISOString(),
  }];
  return prisma.companyImportJob.update({
    where: { id: jobId },
    data: {
      progress,
      currentStep: step,
      status: step === 'complete' ? 'READY' : 'PROCESSING',
    },
  });
}

async function findLocalCompany(query) {
  const q = String(query).trim();
  if (!q) return null;

  const orConditions = [
    { name: { contains: q, mode: 'insensitive' } },
    { slug: toSlug(q) },
    { secCompanies: { some: { tickers: { has: q.toUpperCase() } } } },
  ];
  if (looksLikeCik(q)) {
    orConditions.push({ secCompanies: { some: { cik: padCik(q) } } });
  }

  const byName = await prisma.company.findFirst({
    where: { OR: orConditions },
    include: {
      importJob: true,
      secCompanies: true,
      founders: { take: 5 },
      timelineEvents: { orderBy: { eventDate: 'desc' }, take: 10 },
      lessons: { take: 5 },
      aiAnalyses: true,
    },
  });

  if (!byName) return null;

  const readyJob = byName.importJob?.status === 'READY' ? byName.importJob : null;
  if (readyJob?.profileSnapshot) {
    return { source: 'cache', company: byName, job: readyJob, profile: readyJob.profileSnapshot };
  }

  if (byName.secCompanies?.length) {
    return { source: 'database', company: byName, job: byName.importJob || null };
  }

  return { source: 'database', company: byName, job: byName.importJob || null };
}

async function getOrCreateJob(query, identifier) {
  const dedupeKey = normalizeDedupeKey(identifier || query);
  if (!dedupeKey) throw new Error('Invalid company identifier');

  const existing = await prisma.companyImportJob.findUnique({ where: { dedupeKey } });
  if (existing) return existing;

  try {
    return await prisma.companyImportJob.create({
      data: {
        query: String(query).trim(),
        dedupeKey,
        identifier: identifier || query,
        status: 'NEW',
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return prisma.companyImportJob.findUnique({ where: { dedupeKey } });
    }
    throw err;
  }
}

async function runImportPipeline(jobId, query) {
  if (inFlight.has(jobId)) {
    return inFlight.get(jobId);
  }

  const promise = (async () => {
    const sourcesUsed = ['sec_edgar'];
    let job = await prisma.companyImportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), errorMessage: null },
    });

    try {
      await appendProgress(jobId, 'searching_sec');

      let resolution = null;
      let secCompany = null;

      try {
        resolution = await secService.resolve(query);
        if (resolution?.cik) {
          await appendProgress(jobId, 'resolving_company');
          const stored = await secService.syncCompany(query, {
            financials: true,
            risk: true,
            intelligence: true,
            rag: true,
            limitPerType: 5,
          });

          if (stored.resolved?.cik) {
            secCompany = await secService.getCompany(stored.resolved.cik);
            await appendProgress(jobId, 'downloading_filings');
            await appendProgress(jobId, 'parsing_documents');
            await appendProgress(jobId, 'extracting_financials');
          }
        }
      } catch (secErr) {
        sourcesUsed.push(`sec_error:${secErr.message}`);
      }

      let result;
      if (secCompany) {
        await appendProgress(jobId, 'building_company_profile');
        await appendProgress(jobId, 'generating_ai_insights');
        result = await buildCompanyProfile({ secCompany, resolution, sourcesUsed });
        await appendProgress(jobId, 'saving_to_pivotvault');
        await appendProgress(jobId, 'generating_embeddings');
        await appendProgress(jobId, 'building_knowledge_graph');
      } else {
        await appendProgress(jobId, 'building_company_profile');
        result = await buildFromWebOnly(query, sourcesUsed);
        await appendProgress(jobId, 'generating_ai_insights');
        await appendProgress(jobId, 'saving_to_pivotvault');
      }

      await appendProgress(jobId, 'complete');

      job = await prisma.companyImportJob.update({
        where: { id: jobId },
        data: {
          status: 'READY',
          companyId: result.company.id,
          secCompanyId: secCompany?.id || null,
          cik: secCompany?.cik || resolution?.cik || null,
          ticker: resolution?.tickers?.[0] || (looksLikeTicker(query) ? query.toUpperCase() : null),
          profileSnapshot: result.profile,
          sourcesUsed,
          finishedAt: new Date(),
          lastRefreshedAt: new Date(),
        },
      });

      return serializeJob(job);
    } catch (err) {
      const failed = await prisma.companyImportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          finishedAt: new Date(),
          retryCount: { increment: 1 },
        },
      });

      if (failed.retryCount < failed.maxRetries) {
        return retryImport(jobId);
      }

      throw err;
    } finally {
      inFlight.delete(jobId);
    }
  })();

  inFlight.set(jobId, promise);
  return promise;
}

async function retryImport(jobId) {
  const job = await prisma.companyImportJob.findUnique({ where: { id: jobId } });
  if (!job || job.retryCount >= job.maxRetries) {
    throw new Error(job?.errorMessage || 'Import failed after retries');
  }
  return runImportPipeline(jobId, job.query);
}

async function search(query) {
  const q = String(query || '').trim();
  if (!q) return { found: false, error: 'Query required' };

  const local = await findLocalCompany(q);
  if (local?.source === 'cache') {
    return {
      found: true,
      cached: true,
      status: 'READY',
      companyId: local.company.id,
      slug: local.company.slug,
      profile: local.profile,
      job: serializeJob(local.job),
    };
  }

  if (local?.source === 'database') {
    return {
      found: true,
      cached: true,
      status: 'READY',
      companyId: local.company.id,
      slug: local.company.slug,
      name: local.company.name,
      profile: local.job?.profileSnapshot || {
        company: {
          id: local.company.id,
          name: local.company.name,
          slug: local.company.slug,
          status: local.company.status,
          industry: local.company.industry,
          summary: local.company.summary,
        },
        cachedAt: local.company.updatedAt,
      },
      job: local.job ? serializeJob(local.job) : null,
    };
  }

  const job = await getOrCreateJob(q, q);

  if (job.status === 'READY' && job.profileSnapshot) {
    return {
      found: true,
      cached: true,
      status: 'READY',
      companyId: job.companyId,
      profile: job.profileSnapshot,
      job: serializeJob(job),
    };
  }

  if (job.status === 'PROCESSING' || job.status === 'UPDATING') {
    return {
      found: false,
      status: job.status,
      processing: true,
      job: serializeJob(job),
    };
  }

  if (job.status === 'FAILED' && job.retryCount >= job.maxRetries) {
    return {
      found: false,
      status: 'FAILED',
      job: serializeJob(job),
      error: job.errorMessage,
    };
  }

  const completed = await runImportPipeline(job.id, q);
  return {
    found: true,
    cached: false,
    status: 'READY',
    companyId: completed.companyId,
    profile: completed.profile,
    job: completed,
  };
}

async function importCompany(identifier) {
  const id = String(identifier || '').trim();
  if (!id) throw new Error('Identifier required');

  const local = await findLocalCompany(id);
  if (local?.job?.status === 'READY' && local.job.profileSnapshot) {
    return { cached: true, job: serializeJob(local.job), profile: local.job.profileSnapshot };
  }

  const job = await getOrCreateJob(id, id);
  if (job.status === 'READY' && job.profileSnapshot) {
    return { cached: true, job: serializeJob(job), profile: job.profileSnapshot };
  }
  if (job.status === 'PROCESSING' || inFlight.has(job.id)) {
    const result = await (inFlight.get(job.id) || runImportPipeline(job.id, job.query));
    return { cached: false, job: result, profile: result.profile };
  }

  const result = await runImportPipeline(job.id, job.query);
  return { cached: false, job: result, profile: result.profile };
}

async function getStatus(jobId) {
  const job = await prisma.companyImportJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return serializeJob(job);
}

async function refreshCompany(jobId) {
  const job = await prisma.companyImportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Import job not found');
  if (!job.cik && !job.query) throw new Error('Nothing to refresh');

  await prisma.companyImportJob.update({
    where: { id: jobId },
    data: { status: 'UPDATING', progress: [], currentStep: 'refresh', startedAt: new Date() },
  });

  const identifier = job.cik || job.ticker || job.query;
  try {
    if (job.secCompanyId || job.cik) {
      await secService.syncCompany(identifier, {
        financials: true,
        risk: true,
        intelligence: true,
        rag: true,
        limitPerType: 0,
      });
    }

    const secCompany = job.cik ? await secService.getCompany(job.cik) : null;
    let profile = job.profileSnapshot;

    if (secCompany && job.companyId) {
      const built = await buildCompanyProfile({
        secCompany,
        resolution: { name: secCompany.name, tickers: secCompany.tickers },
        sourcesUsed: ['sec_edgar', 'refresh'],
      });
      profile = built.profile;
    }

    const updated = await prisma.companyImportJob.update({
      where: { id: jobId },
      data: {
        status: 'READY',
        profileSnapshot: profile,
        lastRefreshedAt: new Date(),
        finishedAt: new Date(),
        currentStep: 'complete',
        progress: [{ step: 'complete', message: PROGRESS_STEPS.complete, at: new Date().toISOString() }],
      },
    });

    return serializeJob(updated);
  } catch (err) {
    await prisma.companyImportJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: err.message, finishedAt: new Date() },
    });
    throw err;
  }
}

async function refreshAllTracked() {
  const jobs = await prisma.companyImportJob.findMany({
    where: { status: 'READY' },
    take: 100,
    orderBy: { lastRefreshedAt: 'asc' },
  });

  const summary = { refreshed: 0, failed: 0, errors: [] };
  for (const job of jobs) {
    try {
      await refreshCompany(job.id);
      summary.refreshed += 1;
    } catch (err) {
      summary.failed += 1;
      summary.errors.push({ jobId: job.id, error: err.message });
    }
  }
  return summary;
}

module.exports = {
  search,
  importCompany,
  getStatus,
  refreshCompany,
  refreshAllTracked,
  normalizeDedupeKey,
  PROGRESS_STEPS,
};
