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
        const details = error.issues.map((issue) =>
          issue.path.length
            ? `${issue.path.join('.')}: ${issue.message}`
            : issue.message,
        );
        throw new BadRequestException({
          message: 'Validation failed',
          errors: details, // array of strings!
        });
      }
    }
  }
}
