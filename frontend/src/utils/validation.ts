const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]).{8,100}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateIndianPhone(phone: string): string | null {
  const cleaned = phone.trim();
  if (!INDIAN_PHONE_REGEX.test(cleaned)) {
    return 'Enter a valid 10-digit Indian mobile number starting with 6-9';
  }
  return null;
}

export function validateStrongPassword(password: string): string | null {
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return 'Password must be 8+ chars with uppercase, lowercase, number, and symbol';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Enter a valid email address';
  }
  return null;
}

export function containsHtmlOrScript(value: string): boolean {
  return /<[^>]*>|javascript:/i.test(value);
}

export const FALLBACK_BIRD_IMG =
  'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=800&q=80';

export function sanitizeImageUrl(url?: string): string {
  if (!url) return FALLBACK_BIRD_IMG;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  return FALLBACK_BIRD_IMG;
}
