-- ==============================================
-- SEC RAG Search Migration
-- Adds pgvector-backed chunks for searchable SEC filing evidence.
-- ==============================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "sec_filing_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "secCompanyId" UUID NOT NULL,
    "secFilingId" UUID NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "sectionKey" VARCHAR(100),
    "sectionTitle" VARCHAR(255),
    "citationText" TEXT NOT NULL,
    "pageNumber" VARCHAR(20),
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "embedding" vector(768),
    "embeddingModel" VARCHAR(100),
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sec_filing_chunks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sec_filing_chunks_secCompanyId_fkey" FOREIGN KEY ("secCompanyId") REFERENCES "sec_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_chunks_secFilingId_fkey" FOREIGN KEY ("secFilingId") REFERENCES "sec_filings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sec_filing_chunks_secFilingId_chunkIndex_key" UNIQUE ("secFilingId", "chunkIndex")
);

CREATE INDEX "sec_filing_chunks_secCompanyId_idx" ON "sec_filing_chunks"("secCompanyId");
CREATE INDEX "sec_filing_chunks_secFilingId_idx" ON "sec_filing_chunks"("secFilingId");
CREATE INDEX "sec_filing_chunks_sectionKey_idx" ON "sec_filing_chunks"("sectionKey");
CREATE INDEX "sec_filing_chunks_metadata_gin_idx" ON "sec_filing_chunks" USING GIN ("metadata");
CREATE INDEX "sec_filing_chunks_content_tsv_idx" ON "sec_filing_chunks" USING GIN (to_tsvector('english', "content"));
CREATE INDEX "sec_filing_chunks_embedding_hnsw_idx" ON "sec_filing_chunks" USING hnsw ("embedding" vector_cosine_ops);
