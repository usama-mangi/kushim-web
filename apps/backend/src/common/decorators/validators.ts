import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// UUID validator
export function IsUUID4(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUUID4',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const uuid4Regex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return typeof value === 'string' && uuid4Regex.test(value);
        },
        defaultMessage() {
          return 'Invalid UUID v4 format';
        },
      },
    });
  };
}

// Email validator with additional checks
@ValidatorConstraint({ async: false })
export class IsSecureEmailConstraint implements ValidatorConstraintInterface {
  validate(email: any) {
    if (typeof email !== 'string') return false;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /../,
      /%0d%0a/i,
    ];

    return !suspiciousPatterns.some((pattern) => pattern.test(email));
  }

  defaultMessage() {
    return 'Invalid or potentially malicious email address';
  }
}

export function IsSecureEmail(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSecureEmailConstraint,
    });
  };
}

// URL validator with whitelist
@ValidatorConstraint({ async: false })
export class IsWhitelistedUrlConstraint implements ValidatorConstraintInterface {
  validate(url: any, args: ValidationArguments) {
    if (typeof url !== 'string') return false;

    try {
      const urlObj = new URL(url);

      // Only allow HTTPS
      if (urlObj.protocol !== 'https:') return false;

      // Check against whitelist if provided
      const whitelist = args.constraints[0] as string[] | undefined;
      if (whitelist && whitelist.length > 0) {
        return whitelist.some((domain) => urlObj.hostname.endsWith(domain));
      }

      // Basic security checks
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
      ];

      return !suspiciousPatterns.some((pattern) => pattern.test(url));
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'URL must be HTTPS and from an allowed domain';
  }
}

export function IsWhitelistedUrl(
  whitelist?: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [whitelist],
      validator: IsWhitelistedUrlConstraint,
    });
  };
}

// Strong password validator
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: any) {
    if (typeof password !== 'string') return false;

    // Minimum 12 characters
    if (password.length < 12) return false;

    // Must contain uppercase, lowercase, number, and special character
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    );

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  defaultMessage() {
    return 'Password must be at least 12 characters and contain uppercase, lowercase, number, and special character';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Safe string validator (alphanumeric + basic punctuation)
@ValidatorConstraint({ async: false })
export class IsSafeStringConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;

    // Allow alphanumeric, spaces, and basic punctuation
    const safePattern = /^[a-zA-Z0-9\s\-_.,'@]+$/;
    return safePattern.test(value);
  }

  defaultMessage() {
    return 'String contains invalid characters';
  }
}

export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeStringConstraint,
    });
  };
}

// JSON validator with size limit
export function IsSecureJSON(
  maxSizeKb: number = 100,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSecureJSON',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxSizeKb],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;

          try {
            const jsonStr =
              typeof value === 'string' ? value : JSON.stringify(value);
            const sizeKb = new Blob([jsonStr]).size / 1024;

            if (sizeKb > args.constraints[0]) return false;

            // Validate JSON structure
            if (typeof value === 'string') {
              JSON.parse(value);
            }

            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `JSON must be valid and under ${args.constraints[0]}KB`;
        },
      },
    });
  };
}
