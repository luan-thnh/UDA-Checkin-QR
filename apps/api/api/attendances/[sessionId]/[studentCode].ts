import { handleCors, requireAdmin, supabaseOr500, type VercelReq, type VercelRes } from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;

  if (req.method === 'DELETE') {
    const sessionId = req.query.sessionId as string;
    const studentCode = req.query.studentCode as string;

    const { error } = await supabase.from('attendances').delete().eq('session_id', sessionId).eq('student_code', studentCode);
    if (error) {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Khong the xoa', data: null });
    } else {
      res.status(200).json({ code: 'SUCCESS', message: 'Da xoa diem danh', data: null });
    }
    return;
  }
  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
