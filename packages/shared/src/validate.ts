import { DEFAULT_RADIUS_M } from './types.js';

export function normalizeStudentCode(rawCode: string): string {
  return rawCode.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidStudentCode(code: string): boolean {
  const normalized = normalizeStudentCode(code);
  return normalized.length >= 4 && normalized.length <= 20 && /^[A-Z0-9_-]+$/.test(normalized);
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function normalizeRadiusM(radiusM: number | undefined): number {
  if (!Number.isFinite(radiusM as number) || (radiusM as number) <= 0) {
    return DEFAULT_RADIUS_M;
  }
  return Math.min(Math.max(Math.round(radiusM as number), 50), 10000);
}

export function buildSessionDeepLink(miniAppId: string, sessionId: string): string {
  const encodedSession = encodeURIComponent(sessionId);
  return `https://zalo.me/s/${miniAppId}/?session=${encodedSession}`;
}

export function parseSessionIdFromQuery(query: Record<string, string | undefined>): string {
  return (query['session'] ?? query['sessionId'] ?? '').trim();
}
