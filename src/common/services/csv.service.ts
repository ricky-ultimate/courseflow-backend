import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { CsvValidationError, BulkOperationResult } from '../dto/csv-bulk.dto';

@Injectable()
export class CsvService {
  async parseCsvFile<T extends object>(
    buffer: Buffer,
    dtoClass: new () => T,
    requiredHeaders: string[],
  ): Promise<{ data: T[]; errors: CsvValidationError[] }> {
    const results: Record<string, unknown>[] = [];
    const errors: CsvValidationError[] = [];
    let headersValidated = false;

    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          const missingHeaders = requiredHeaders.filter(
            (h) => !headers.includes(h),
          );

          if (missingHeaders.length > 0) {
            reject(
              new BadRequestException(
                `Missing required CSV headers: ${missingHeaders.join(', ')}`,
              ),
            );
            return;
          }

          headersValidated = true;
        })
        .on('data', (data: Record<string, unknown>) => {
          results.push(data);
        })
        .on('end', () => {
          if (!headersValidated && results.length === 0) {
            reject(
              new BadRequestException('CSV file is empty or has no headers'),
            );
            return;
          }
          resolve();
        })
        .on('error', (error: Error) => {
          reject(
            new BadRequestException(`CSV parsing error: ${error.message}`),
          );
        });
    });

    const validatedData = await this.processValidation(
      results,
      dtoClass,
      errors,
    );
    return { data: validatedData, errors };
  }

  private async processValidation<T extends object>(
    results: Record<string, unknown>[],
    dtoClass: new () => T,
    errors: CsvValidationError[],
  ): Promise<T[]> {
    const validatedData: T[] = [];

    for (let i = 0; i < results.length; i++) {
      const rowData = results[i];
      const rowNumber = i + 2;

      const dto = plainToInstance(dtoClass, rowData);
      const validationErrors = await validate(dto as object, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });

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

  generateCsvTemplate(
    headers: string[],
    sampleData?: Record<string, unknown>,
  ): string {
    let content = headers.join(',') + '\n';

    if (sampleData) {
      const values = headers.map((header) => {
        const value = sampleData[header];
        if (value === undefined || value === null) return '';
        const str = String(value);
        return str.includes(',') ? `"${str}"` : str;
      });
      content += values.join(',') + '\n';
    }

    return content;
  }

  createBulkResult<T>(
    created: T[],
    errors: CsvValidationError[],
    totalRows: number,
    aliasWarnings?: string[],
  ): BulkOperationResult<T> {
    return {
      success: errors.length === 0,
      created,
      errors,
      ...(aliasWarnings?.length ? { aliasWarnings } : {}),
      summary: {
        totalRows,
        successCount: created.length,
        errorCount: errors.length,
      },
    };
  }
}
