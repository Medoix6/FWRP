/**
 * Input validation and sanitization utilities
 */

export function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  // Remove potentially harmful characters and trim
  return input.trim().substring(0, maxLength);
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email, 254).toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  return sanitized;
}

export function validateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

export function validateLocation(location: string): string {
  const sanitized = sanitizeString(location, 200);
  if (sanitized.length < 2) {
    throw new Error('Location must be at least 2 characters');
  }
  return sanitized;
}

export function validateFoodName(name: string): string {
  const sanitized = sanitizeString(name, 100);
  if (sanitized.length < 2) {
    throw new Error('Food name must be at least 2 characters');
  }
  return sanitized;
}

export function validateDescription(description: string): string {
  const sanitized = sanitizeString(description, 2000);
  if (sanitized.length < 10) {
    throw new Error('Description must be at least 10 characters');
  }
  return sanitized;
}

export function validateDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  // Ensure date is in the future
  if (date < new Date()) {
    throw new Error('Expiry date must be in the future');
  }
  return dateString;
}

export function validateCategory(category: string): string {
  const sanitized = sanitizeString(category, 50);
  if (sanitized.length < 2) {
    throw new Error('Category must be at least 2 characters');
  }
  return sanitized;
}

export function validateServings(servings: number): number {
  if (!Number.isFinite(servings) || servings <= 0) {
    throw new Error('Servings must be a positive number');
  }
  if (servings > 1000) {
    throw new Error('Servings cannot exceed 1000');
  }
  return Math.round(servings);
}

export function validateAllergens(allergens: string): string[] {
  if (!allergens) return [];
  const parts = allergens
    .split(',')
    .map((item) => sanitizeString(item, 50))
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length > 20) {
    throw new Error('Too many allergens listed');
  }
  return parts;
}

export function validatePackaging(packaging: string): string {
  const sanitized = sanitizeString(packaging, 100);
  if (sanitized.length < 2) {
    throw new Error('Packaging must be at least 2 characters');
  }
  return sanitized;
}

export function validatePickupWindow(windowValue: string): string {
  const sanitized = sanitizeString(windowValue, 10);
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(sanitized)) {
    throw new Error('Pickup window must be in HH:MM format');
  }
  return sanitized;
}

export function validatePassword(password: string): boolean {
  // At least 6 characters, 1 uppercase, 1 number
  return /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
}

export function validateFileType(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
}

export function validateFileSize(file: File, maxSizeMB = 5): void {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
  }
}
