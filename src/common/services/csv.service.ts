import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { CsvValidationError, BulkOperationResult } from '../dto/csv-bulk.dto';

@Injectable()
export class CsvService {
  /**
   * Parse CSV buffer and validate rows against DTO class
   */
  async parseCsvFile<T>(
    buffer: Buffer,
    dtoClass: new () => T,
    requiredHeaders: string[],
  ): Promise<{ data: T[]; errors: CsvValidationError[] }> {
    const results: Record<string, unknown>[] = [];
    const errors: CsvValidationError[] = [];

    return new Promise<{ data: T[]; errors: CsvValidationError[] }>(
      (resolve, reject) => {
        const stream = Readable.from(buffer.toString());

        stream
          .pipe(csv())
          .on('headers', (headers: string[]) => {
            const missingHeaders = requiredHeaders.filter(
              (header) => !headers.includes(header),
            );

            if (missingHeaders.length > 0) {
              reject(
                new BadRequestException(
                  `Missing required CSV headers: ${missingHeaders.join(', ')}`,
                ),
              );
              return;
            }
          })
          .on('data', (data: Record<string, unknown>) => {
            results.push(data);
          })
          .on('end', () => {
            void this.processValidation(results, dtoClass, errors)
              .then((validatedData: T[]) => {
                resolve({ data: validatedData, errors });
              })
              .catch((error: unknown) => {
                reject(
                  error instanceof Error ? error : new Error(String(error)),
                );
              });
          })
          .on('error', (error: Error) => {
            reject(
              new BadRequestException(`CSV parsing error: ${error.message}`),
            );
          });
      },
    );
  }

  private async processValidation<T>(
    results: Record<string, unknown>[],
    dtoClass: new () => T,
    errors: CsvValidationError[],
  ): Promise<T[]> {
    const validatedData: T[] = [];

    for (let i = 0; i < results.length; i++) {
      const rowData = results[i];
      const rowNumber = i + 2;

      const dto = plainToClass(dtoClass, rowData);
      const validationErrors = await validate(dto as object);

      if (validationErrors.length > 0) {
        for (const error of validationErrors) {
          if (error.constraints) {
            for (const constraint of Object.values(error.constraints)) {
              errors.push({
                row: rowNumber,
                field: error.property,
                value: error.value as unknown,
                message: constraint,
              });
            }
          }
        }
      } else {
        validatedData.push(dto);
      }
    }

    return validatedData;
  }

  /**
   * Generate CSV template for a given DTO class
   */
  generateCsvTemplate(
    headers: string[],
    sampleData?: Record<string, unknown>,
  ): string {
    let csv = headers.join(',') + '\n';

    if (sampleData) {
      const values = headers.map((header) => {
        const value = sampleData[header];
        if (value === undefined || value === null) {
          return '';
        }
        if (
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        ) {
          return String(value);
        }
        return '';
      });
      csv += values.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Validate time format and ensure end time is after start time
   */
  validateTimeRange(startTime: string, endTime: string): boolean {
    const startParts = startTime.split(':');
    const endParts = endTime.split(':');

    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    return endMinutes > startMinutes;
  }

  /**
   * Create a standardized bulk operation result
   */
  createBulkResult<T>(
    created: T[],
    errors: CsvValidationError[],
    totalRows: number,
  ): BulkOperationResult<T> {
    return {
      success: errors.length === 0,
      created,
      errors,
      summary: {
        totalRows,
        successCount: created.length,
        errorCount: errors.length,
      },
    };
  }
}
