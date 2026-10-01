import { queryParam, requireAdmin, supabaseOr500, type VercelReq, type VercelRes } from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
  const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (!session) {
    res.status(404).json({ code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
    return;
  }
  const { data: records } = await supabase
    .from('attendances')
    .select('*, students(full_name, class_name)')
    .eq('session_id', sessionId)
    .order('checked_at');
  res.status(200).json({
    code: 'SUCCESS',
    message: 'OK',
    data: { session, total: records?.length ?? 0, records: records ?? [] },
  });
}
