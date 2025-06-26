
// Comprehensive data validation utilities for resilient operation
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export class DataValidator {
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const value = data[rule.field];
      
      // Required field validation
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: rule.field, message: `${rule.field} is required` });
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        const typeValid = this.validateType(value, rule.type);
        if (!typeValid) {
          errors.push({ field: rule.field, message: `${rule.field} must be of type ${rule.type}` });
          continue;
        }
      }

      // String validations
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters` });
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push({ field: rule.field, message: `${rule.field} must not exceed ${rule.maxLength} characters` });
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field: rule.field, message: `${rule.field} format is invalid` });
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.min}` });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({ field: rule.field, message: `${rule.field} must not exceed ${rule.max}` });
        }
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
          errors.push({ 
            field: rule.field, 
            message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid` 
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return typeof value === 'string' && /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  // SADC-specific validations
  static validateSADCCountry(country: string): boolean {
    const sadcCountries = [
      'Zimbabwe', 'South Africa', 'Botswana', 'Zambia', 'Namibia',
      'Angola', 'Mozambique', 'Malawi'
    ];
    return sadcCountries.includes(country);
  }

  static validateSkillCategory(category: string): boolean {
    const validCategories = [
      'Welding', 'Painting', 'Building & Construction', 'Plumbing', 'Electrical',
      'Home Helper', 'Gardener', 'HVAC Tech', 'Mechanic', 'Auto Electrician',
      'Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing',
      'Consulting', 'Photography', 'Catering', 'Cleaning Services', 'Tutoring'
    ];
    return validCategories.includes(category);
  }

  static validateRole(role: string): boolean {
    const validRoles = ['user', 'client', 'service_provider', 'admin', 'super_admin'];
    return validRoles.includes(role);
  }
}

// Sanitization utilities
export class DataSanitizer {
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/[<>]/g, '') // Remove HTML brackets
      .substring(0, 1000); // Limit length
  }

  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim().substring(0, 254);
  }

  static sanitizePhone(phone: string): string {
    if (typeof phone !== 'string') return '';
    return phone.replace(/[^\d\+\-\(\)\s]/g, '').trim().substring(0, 20);
  }

  static sanitizeNumber(input: any): number {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  }

  static sanitizeArray(input: any): any[] {
    return Array.isArray(input) ? input : [];
  }
}
