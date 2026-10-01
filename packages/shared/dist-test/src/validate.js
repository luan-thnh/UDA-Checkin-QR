import { DEFAULT_RADIUS_M } from './types.js';
export function normalizeStudentCode(rawCode) {
    return rawCode.trim().toUpperCase().replace(/\s+/g, '');
}
export function isValidStudentCode(code) {
    const normalized = normalizeStudentCode(code);
    return normalized.length >= 4 && normalized.length <= 20 && /^[A-Z0-9_-]+$/.test(normalized);
}
export function isValidCoordinate(lat, lng) {
    return (Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180);
}
export function normalizeRadiusM(radiusM) {
    if (!Number.isFinite(radiusM) || radiusM <= 0) {
        return DEFAULT_RADIUS_M;
    }
    return Math.min(Math.max(Math.round(radiusM), 50), 10000);
}
export function buildSessionDeepLink(miniAppId, sessionId) {
    const encodedSession = encodeURIComponent(sessionId);
    return `https://zalo.me/s/${miniAppId}/?session=${encodedSession}`;
}
export function parseSessionIdFromQuery(query) {
    return (query['session'] ?? query['sessionId'] ?? '').trim();
}
