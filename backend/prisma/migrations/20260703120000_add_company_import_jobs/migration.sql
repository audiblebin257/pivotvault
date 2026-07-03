-- On-demand company import pipeline (PivotVault V2)
CREATE TYPE "CompanyCacheStatus" AS ENUM ('NEW', 'PROCESSING', 'READY', 'FAILED', 'UPDATING');

CREATE TABLE "company_import_jobs" (
    "id" UUID NOT NULL,
    "query" VARCHAR(500) NOT NULL,
    "dedupeKey" VARCHAR(120) NOT NULL,
    "identifier" VARCHAR(255),
    "cik" VARCHAR(20),
    "ticker" VARCHAR(20),
    "companyId" UUID,
    "secCompanyId" UUID,
    "status" "CompanyCacheStatus" NOT NULL DEFAULT 'NEW',
    "progress" JSONB NOT NULL DEFAULT '[]',
    "currentStep" VARCHAR(100),
    "errorMessage" TEXT,
    "profileSnapshot" JSONB,
    "sourcesUsed" JSONB NOT NULL DEFAULT '[]',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMPTZ,
    "finishedAt" TIMESTAMPTZ,
    "lastRefreshedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "company_import_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_import_jobs_dedupeKey_key" ON "company_import_jobs"("dedupeKey");
CREATE UNIQUE INDEX "company_import_jobs_companyId_key" ON "company_import_jobs"("companyId");
CREATE INDEX "company_import_jobs_status_idx" ON "company_import_jobs"("status");
CREATE INDEX "company_import_jobs_cik_idx" ON "company_import_jobs"("cik");
CREATE INDEX "company_import_jobs_query_idx" ON "company_import_jobs"("query");

ALTER TABLE "company_import_jobs" ADD CONSTRAINT "company_import_jobs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "company_import_jobs" ADD CONSTRAINT "company_import_jobs_secCompanyId_fkey"
    FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
