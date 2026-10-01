import { checkInWithSupabase } from '../src/services/attendance.supabase.js';
import { queryParam, readBody, supabaseOr500, type VercelReq, type VercelRes } from '../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  const body = readBody<{ sessionId?: string; studentCode?: string; lat?: number; lng?: number }>(req);
  // Cho phep gui session qua query (?sessionId=) khi Mini App GET-link
  const result = await checkInWithSupabase(supabase, {
    sessionId: body.sessionId ?? queryParam(req, 'sessionId'),
    studentCode: body.studentCode ?? '',
    lat: Number(body.lat),
    lng: Number(body.lng),
  });
  res.status(result.code === 'SUCCESS' || result.code === 'ALREADY_CHECKED' ? 200 : 400).json(result);
}
