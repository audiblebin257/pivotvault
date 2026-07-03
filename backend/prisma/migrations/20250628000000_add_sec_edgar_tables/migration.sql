-- ==============================================
-- SEC EDGAR Integration Migration
-- Adds: sec_companies, sec_filings, sec_documents,
--       sec_financials, sec_risk_factors, sec_metadata
-- ==============================================

-- Create enum type for SEC filing forms (manual since Prisma maps enums to native PG enum)
CREATE TYPE "SecFilingType" AS ENUM ('TEN_K', 'TEN_Q', 'EIGHT_K', 'S_1', 'DEF_14A', 'TWENTY_F');

-- ==============================================
-- SEC Companies
-- ==============================================
CREATE TABLE "sec_companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cik" VARCHAR(20) NOT NULL,
    "tickers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "name" VARCHAR(255) NOT NULL,
    "businessAddress" VARCHAR(500),
    "phone" VARCHAR(50),
    "lastSynced" TIMESTAMPTZ,
    "lastModifiedDate" TIMESTAMPTZ,
    "etag" VARCHAR(200),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "companyId" UUID,

    CONSTRAINT "sec_companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_companies_cik_key" UNIQUE ("cik"),
    CONSTRAINT "sec_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "sec_companies_cik_idx" ON "sec_companies"("cik");
CREATE INDEX "sec_companies_tickers_idx" ON "sec_companies" USING GIN ("tickers");
CREATE INDEX "sec_companies_companyId_idx" ON "sec_companies"("companyId");

-- ==============================================
-- SEC Filings
-- ==============================================
CREATE TABLE "sec_filings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "accessionNumber" VARCHAR(50) NOT NULL,
    "filingType" "SecFilingType" NOT NULL,
    "filingDate" DATE,
    "reportDate" DATE,
    "fiscalYear" INTEGER,
    "fiscalPeriod" VARCHAR(20),
    "url" VARCHAR(500) NOT NULL,
    "primaryDocument" VARCHAR(255),
    "primaryDocumentType" VARCHAR(50),
    "sizeBytes" BIGINT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "etag" VARCHAR(200),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sec_filings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_filings_accessionNumber_key" UNIQUE ("accessionNumber"),
    CONSTRAINT "sec_filings_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sec_filings_secCompanyId_idx" ON "sec_filings"("secCompanyId");
CREATE INDEX "sec_filings_accessionNumber_idx" ON "sec_filings"("accessionNumber");
CREATE INDEX "sec_filings_filingType_idx" ON "sec_filings"("filingType");
CREATE INDEX "sec_filings_filingDate_idx" ON "sec_filings"("filingDate");

-- ==============================================
-- SEC Documents
-- ==============================================
CREATE TABLE "sec_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secFilingId" UUID NOT NULL,
    "sequence" INTEGER,
    "fileName" VARCHAR(255),
    "description" VARCHAR(255),
    "type" VARCHAR(100),
    "url" VARCHAR(500) NOT NULL,
    "sizeBytes" BIGINT,
    "content" TEXT,
    "contentType" VARCHAR(100),
    "etag" VARCHAR(200),
    "lastFetchedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_documents_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sec_documents_secFilingId_idx" ON "sec_documents"("secFilingId");

-- ==============================================
-- SEC Financials
-- ==============================================
CREATE TABLE "sec_financials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "secFilingId" UUID NOT NULL,
    "metricKey" VARCHAR(255) NOT NULL,
    "metricValue" DECIMAL(30,10),
    "unit" VARCHAR(100),
    "periodStart" DATE,
    "periodEnd" DATE,
    "fiscalYear" INTEGER,
    "fiscalPeriod" VARCHAR(50),
    "source" VARCHAR(100),
    "sourceConcept" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_financials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_financials_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_financials_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sec_financials_secCompanyId_idx" ON "sec_financials"("secCompanyId");
CREATE INDEX "sec_financials_secFilingId_idx" ON "sec_financials"("secFilingId");
CREATE INDEX "sec_financials_metricKey_idx" ON "sec_financials"("metricKey");
CREATE INDEX "sec_financials_fiscalYear_idx" ON "sec_financials"("fiscalYear");

-- ==============================================
-- SEC Risk Factors
-- ==============================================
CREATE TABLE "sec_risk_factors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "secFilingId" UUID NOT NULL,
    "title" VARCHAR(500),
    "content" TEXT NOT NULL,
    "riskCategory" VARCHAR(100),
    "confidence" DECIMAL(3,2),
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_risk_factors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_risk_factors_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_risk_factors_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sec_risk_factors_secCompanyId_idx" ON "sec_risk_factors"("secCompanyId");
CREATE INDEX "sec_risk_factors_secFilingId_idx" ON "sec_risk_factors"("secFilingId");
CREATE INDEX "sec_risk_factors_riskCategory_idx" ON "sec_risk_factors"("riskCategory");

-- ==============================================
-- SEC Metadata
-- ==============================================
CREATE TABLE "sec_metadata" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_metadata_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_metadata_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_metadata_secCompanyId_key_key" UNIQUE ("secCompanyId", "key")
);

CREATE INDEX "sec_metadata_key_idx" ON "sec_metadata"("key");
