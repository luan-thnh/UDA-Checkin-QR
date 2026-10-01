import { createSupabaseAdmin, isSupabaseEnabled } from '../db/supabase.js';
import { isAuthorized } from '../utils/auth.js';
import { isOriginAllowed } from '../utils/cors.js';
function headerValue(headers, name) {
    const raw = headers?.[name.toLowerCase()] ?? headers?.[name];
    return Array.isArray(raw) ? raw[0] : raw;
}
export function queryParam(req, name) {
    const raw = req.query?.[name];
    return encodeURIComponent(Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? ''));
}
export function readBody(req) {
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        }
        catch {
            return {};
        }
    }
    return (req.body ?? {}) ?? {};
}
export function requireAdmin(req, res) {
    if (isAuthorized(headerValue(req.headers, 'authorization')))
        return true;
    res.status(401).json({ code: 'INVALID_INPUT', message: 'Thieu token admin.', data: null });
    return false;
}
export function supabaseOr500(res) {
    if (!isSupabaseEnabled()) {
        res.status(500).json({
            code: 'INVALID_INPUT',
            message: 'Chua cau hinh SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tren Vercel.',
            data: null,
        });
        return null;
    }
    return createSupabaseAdmin();
}
export function sendCsv(res, filename, csv) {
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', `attachment; filename="${filename}"`);
    res.status(200).send('\uFEFF' + csv);
}
function firstHeader(headers, name) {
    const raw = headers?.[name] ?? headers?.[name.toLowerCase()];
    return Array.isArray(raw) ? raw[0] : raw;
}
export function handleCors(req, res) {
    const origin = firstHeader(req.headers, 'origin');
    if (isOriginAllowed(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).json({});
        return true;
    }
    return false;
}
