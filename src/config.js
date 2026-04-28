/**
 * Base URL of the Next.js site (no trailing slash), e.g. http://192.168.1.5:3000
 * Set EXPO_PUBLIC_FIGURES_API_URL in project root .env — see README.
 */
export function getFiguresApiBaseUrl() {
  const raw = process.env.EXPO_PUBLIC_FIGURES_API_URL;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\/$/, '');
}
