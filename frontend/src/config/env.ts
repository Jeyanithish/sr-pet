const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

if (
  rawApiBaseUrl !== '' &&
  !rawApiBaseUrl.startsWith('https://') &&
  !rawApiBaseUrl.startsWith('http://localhost')
) {
  throw new Error('VITE_API_BASE_URL must be an https:// URL in production');
}

export const ENV = {
  API_BASE_URL: rawApiBaseUrl,
  RAZORPAY_KEY_ID: (import.meta.env.VITE_RAZORPAY_KEY_ID ?? '').trim(),
} as const;
