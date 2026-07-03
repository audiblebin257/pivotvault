/**
 * Validation service for data
 */

class ValidationService {
  constructor(prisma, logger = console) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Validate company record
   */
  validateCompany(company) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!company.name) errors.push('Name is required');
    if (!company.slug) errors.push('Slug is required');
    if (!company.industry) errors.push('Industry is required');
    if (!company.country) errors.push('Country is required');
    if (!company.summary) errors.push('Summary is required');

    // Field validation
    if (company.name && company.name.length > 255) {
      errors.push('Name must be less than 255 characters');
    }
    if (company.websiteUrl && !this.isValidUrl(company.websiteUrl)) {
      warnings.push('Website URL appears to be invalid');
    }

    // Sanitization
    const sanitized = {
      name: company.name?.trim(),
      slug: company.slug?.trim().toLowerCase(),
      industry: company.industry?.trim(),
      country: company.country?.trim(),
      state: company.state?.trim(),
      city: company.city?.trim(),
      websiteUrl: company.websiteUrl?.trim(),
      summary: company.summary?.trim(),
      description: company.description?.trim(),
      founderStory: company.founderStory?.trim(),
    };

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized,
      confidence: errors.length === 0 ? (warnings.length === 0 ? 0.95 : 0.8) : 0,
    };
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ValidationService;
