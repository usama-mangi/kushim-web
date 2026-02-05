import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const messages = errors.map((error) => {
        return {
          field: error.property,
          errors: Object.values(error.constraints || {}),
        };
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

@Injectable()
export class SqlInjectionPipe implements PipeTransform {
  private readonly sqlPatterns = [
    /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval)(\s|$)/gi,
    /--/g,
    /;/g,
    /\/\*/g,
    /\*\//g,
    /xp_/gi,
  ];

  transform(value: any) {
    if (typeof value === 'string') {
      return this.sanitizeSql(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          sanitized[key] = this.transform(value[key]);
        }
      }
      return sanitized;
    }
    return value;
  }

  private sanitizeSql(str: string): string {
    const sanitized = str;
    for (const pattern of this.sqlPatterns) {
      if (pattern.test(sanitized)) {
        throw new BadRequestException('Potentially malicious input detected');
      }
    }
    return sanitized;
  }
}
