import { queryParam, requireAdmin, supabaseOr500, type VercelReq, type VercelRes } from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'closed' })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) {
    res.status(404).json({ code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
    return;
  }
  res.status(200).json({ code: 'SUCCESS', message: 'Da dong phien.', data });
}
