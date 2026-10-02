import { createSupabaseAdmin, isSupabaseEnabled } from '../db/supabase.js';
import { isAuthorized } from '../utils/auth.js';

export interface VercelReq {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

export interface VercelRes {
  status: (code: number) => VercelRes;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
}

function headerValue(headers: VercelReq['headers'], name: string): string | undefined {
  const raw = headers?.[name.toLowerCase()] ?? headers?.[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

export function queryParam(req: VercelReq, name: string): string {
  const raw = req.query?.[name];
  return encodeURIComponent(Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? ''));
}

export function readBody<T>(req: VercelReq): T {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return ((req.body ?? {}) as T) ?? ({} as T);
}

export function requireAdmin(req: VercelReq, res: VercelRes): boolean {
  if (isAuthorized(headerValue(req.headers, 'authorization'))) return true;
  res.status(401).json({ code: 'INVALID_INPUT', message: 'Thieu token admin.', data: null });
  return false;
}

export function supabaseOr500(res: VercelRes) {
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

export function sendCsv(res: VercelRes, filename: string, csv: string): void {
  res.setHeader('content-type', 'text/csv; charset=utf-8');
  res.setHeader('content-disposition', `attachment; filename="${filename}"`);
  res.status(200).send('\uFEFF' + csv);
}

export function handleCors(req: VercelReq, res: VercelRes): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return true;
  }
  return false;
}
