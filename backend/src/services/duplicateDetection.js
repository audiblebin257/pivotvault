/**
 * Duplicate detection service
 * Handles detecting and merging duplicate companies
 */

class DuplicateDetectionService {
  constructor(prisma, logger = console) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Normalize company name for comparison
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
      .replace(/\s+/g, '')       // Remove spaces
      .trim();
  }

  /**
   * Generate normalized name variations
   */
  getVariations(name) {
    const normalized = this.normalizeName(name);
    const variations = [normalized];

    // Remove common suffixes
    const suffixes = ['pvtltd', 'limited', 'ltd', 'llc', 'inc', 'corp', 'incorporated', 'corporation'];
    suffixes.forEach(suffix => {
      if (normalized.endsWith(suffix)) {
        variations.push(normalized.slice(0, -suffix.length));
      }
    });

    // Remove common prefixes
    const prefixes = ['the', 'a'];
    prefixes.forEach(prefix => {
      if (normalized.startsWith(prefix)) {
        variations.push(normalized.slice(prefix.length));
      }
    });

    return variations;
  }

  /**
   * Check if a company is a duplicate
   */
  async detectDuplicate(record) {
    // Build search criteria
    const variations = this.getVariations(record.name);
    const searchTerms = variations.map(name => {
      // Search in company name or alternative names
      return {
        OR: [
          { name: { contains: record.name, mode: 'insensitive' } },
          { alternativeNames: { has: record.name } },
          { slug: { in: variations.map(v => this.toSlug(v)) } },
        ],
      };
    });

    // Check by website if available
    if (record.websiteUrl) {
      searchTerms.push({ websiteUrl: record.websiteUrl });
    }

    const potentialMatches = await this.prisma.company.findMany({
      where: { OR: searchTerms },
      include: {
        duplicates: true,
      },
    });

    for (const existing of potentialMatches) {
      const confidence = this.calculateSimilarity(record, existing);
      if (confidence >= 0.7) {
        this.logger.debug(`Potential duplicate detected: ${record.name} matches ${existing.name} (${confidence}%)`);
        return {
          isDuplicate: true,
          confidence,
          existingRecordId: existing.id,
          duplicateType: 'name_match',
        };
      }
    }

    return { isDuplicate: false, confidence: 0 };
  }

  /**
   * Calculate similarity score between two companies
   */
  calculateSimilarity(recordA, recordB) {
    let score = 0;
    const maxScore = 10;

    // Name similarity
    const normA = this.normalizeName(recordA.name);
    const normB = this.normalizeName(recordB.name);
    if (normA === normB) {
      score += 4;
    } else if (normA.includes(normB) || normB.includes(normA)) {
      score += 2;
    }

    // Website similarity
    if (recordA.websiteUrl && recordB.websiteUrl) {
      const getDomain = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (getDomain(recordA.websiteUrl) === getDomain(recordB.websiteUrl)) {
        score += 3;
      }
    }

    // Industry & country match
    if (recordA.industry && recordB.industry && recordA.industry === recordB.industry) {
      score += 1;
    }
    if (recordA.country && recordB.country && recordA.country === recordB.country) {
      score += 1;
    }

    // Founding year match
    if (recordA.foundingYear && recordB.foundingYear && recordA.foundingYear === recordB.foundingYear) {
      score += 1;
    }

    return score / maxScore;
  }

  /**
   * Convert string to slug
   */
  toSlug(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Mark two companies as duplicates
   */
  async markDuplicate(duplicateId, originalId, confidence, duplicateType) {
    const existing = await this.prisma.companyDuplicate.findFirst({
      where: { companyId: duplicateId, duplicateOfId: originalId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.companyDuplicate.create({
      data: {
        companyId: duplicateId,
        duplicateOfId: originalId,
        confidence,
        duplicateType,
      },
    });
  }
}

module.exports = DuplicateDetectionService;
