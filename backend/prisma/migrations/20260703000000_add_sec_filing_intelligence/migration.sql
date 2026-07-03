-- ==============================================
-- SEC Filing Intelligence Migration
-- Adds source-backed filing extracts, citations, and PivotVault health insights.
-- ==============================================

CREATE TABLE "sec_filing_extracts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "secFilingId" UUID NOT NULL,
    "fieldType" VARCHAR(100) NOT NULL,
    "fieldKey" VARCHAR(100) NOT NULL DEFAULT 'default',
    "value" TEXT NOT NULL,
    "valueNumeric" DECIMAL(30,10),
    "unit" VARCHAR(50),
    "confidence" DECIMAL(3,2) NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "citationText" TEXT,
    "pageNumber" VARCHAR(20),
    "sectionKey" VARCHAR(100),
    "extractedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_filing_extracts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_filing_extracts_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_extracts_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_extracts_secFilingId_fieldType_fieldKey_key" UNIQUE ("secFilingId", "fieldType", "fieldKey")
);

CREATE INDEX "sec_filing_extracts_secCompanyId_idx" ON "sec_filing_extracts"("secCompanyId");
CREATE INDEX "sec_filing_extracts_secFilingId_idx" ON "sec_filing_extracts"("secFilingId");
CREATE INDEX "sec_filing_extracts_fieldType_idx" ON "sec_filing_extracts"("fieldType");

CREATE TABLE "sec_filing_intelligence" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "secFilingId" UUID,
    "executiveSummary" TEXT NOT NULL,
    "financialHealthScore" INTEGER,
    "businessHealthScore" INTEGER,
    "operationalRiskScore" INTEGER,
    "marketRiskScore" INTEGER,
    "leadershipRiskScore" INTEGER,
    "fundingRiskScore" INTEGER,
    "overallHealthScore" INTEGER,
    "scoreReasoning" JSONB,
    "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sec_filing_intelligence_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_filing_intelligence_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_intelligence_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "sec_filing_intelligence_secCompanyId_idx" ON "sec_filing_intelligence"("secCompanyId");
CREATE INDEX "sec_filing_intelligence_secFilingId_idx" ON "sec_filing_intelligence"("secFilingId");

CREATE TABLE "sec_filing_citations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secFilingExtractId" UUID,
    "secFilingId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "pageNumber" VARCHAR(20),
    "sectionKey" VARCHAR(100),
    "confidence" DECIMAL(3,2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sec_filing_citations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_filing_citations_secFilingExtractId_fkey" FOREIGN KEY ("secFilingExtractId") REFERENCES "sec_filing_extracts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_citations_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sec_filing_citations_secFilingId_idx" ON "sec_filing_citations"("secFilingId");
CREATE INDEX "sec_filing_citations_secFilingExtractId_idx" ON "sec_filing_citations"("secFilingExtractId");
