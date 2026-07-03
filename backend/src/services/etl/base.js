/**
 * Base class for all data source importers
 * All sources should implement this interface
 */

class BaseImporter {
  constructor({ sourceId, prisma, logger = console }) {
    this.sourceId = sourceId;
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Fetch raw data from the source
   * @returns {Promise<any>} raw data
   */
  async fetch() {
    throw new Error('fetch() must be implemented by subclass');
  }

  /**
   * Transform raw data into standardized format
   * @param {any} rawData - data from fetch()
   * @returns {Promise<Array>} transformed records
   */
  async transform(rawData) {
    throw new Error('transform() must be implemented by subclass');
  }

  /**
   * Validate a single transformed record
   * @param {Object} record - transformed record
   * @returns {Promise<{ valid: boolean, errors: Array<string>, warnings: Array<string> }>} validation result
   */
  async validate(record) {
    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Store a single validated record in the database
   * @param {Object} validatedRecord - record to store
   * @returns {Promise<Object>} stored record
   */
  async store(validatedRecord) {
    throw new Error('store() must be implemented by subclass');
  }

  /**
   * Check for duplicates of a record
   * @param {Object} record - record to check
   * @returns {Promise<{ isDuplicate: boolean, confidence: number, existingRecordId?: string }>}
   */
  async detectDuplicate(record) {
    // Default: no duplicate detection
    return { isDuplicate: false, confidence: 0 };
  }

  /**
   * Full import process
   * @returns {Promise<{ total: number, success: number, failed: number, skipped: number }>}
   */
  async run() {
    const importRecord = await this.prisma.importRecord.create({
      data: {
        sourceId: this.sourceId,
        status: 'processing',
        rawData: {},
        startedAt: new Date(),
      },
    });

    let total = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;

    try {
      const rawData = await this.fetch();

      await this.prisma.importRecord.update({
        where: { id: importRecord.id },
        data: { rawData },
      });

      const transformedRecords = await this.transform(rawData);
      total = transformedRecords.length;

      for (const record of transformedRecords) {
        try {
          const duplicateCheck = await this.detectDuplicate(record);

          if (duplicateCheck.isDuplicate) {
            skipped++;
            await this.prisma.importRecord.update({
              where: { id: importRecord.id },
              data: {
                warnings: {
                  push: {
                    message: `Skipping duplicate record, confidence: ${duplicateCheck.confidence}`,
                    record,
                  },
                },
              },
            });
            continue;
          }

          const validation = await this.validate(record);

          if (!validation.valid) {
            failed++;
            await this.prisma.importRecord.update({
              where: { id: importRecord.id },
              data: {
                errors: {
                  push: {
                    errors: validation.errors,
                    record,
                  },
                },
              },
            });
            continue;
          }

          const stored = await this.store(record);
          success++;

          await this.prisma.importRecord.update({
            where: { id: importRecord.id },
            data: {
              companyId: stored.id,
              confidence: validation.confidence || 0.9,
              warnings: validation.warnings,
            },
          });
        } catch (err) {
          failed++;
          this.logger.error('Error processing record:', err);
          await this.prisma.importRecord.update({
            where: { id: importRecord.id },
            data: {
              errors: {
                push: {
                  message: err.message,
                  stack: err.stack,
                  record,
                },
              },
            },
          });
        }
      }

      await this.prisma.importRecord.update({
        where: { id: importRecord.id },
        data: {
          status: 'success',
          finishedAt: new Date(),
        },
      });

      this.logger.info(`Import completed: total=${total}, success=${success}, failed=${failed}, skipped=${skipped}`);
      return { total, success, failed, skipped };
    } catch (err) {
      await this.prisma.importRecord.update({
        where: { id: importRecord.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errors: {
            push: { message: err.message, stack: err.stack },
          },
        },
      });
      this.logger.error('Import failed:', err);
      throw err;
    }
  }
}

module.exports = BaseImporter;
