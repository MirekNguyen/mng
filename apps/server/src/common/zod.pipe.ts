import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => issue.message);
        throw new BadRequestException({
          errors,
          message: 'Validation failed',
        });
      }
      throw new Error("Unknown request error");
    }
  }
}
