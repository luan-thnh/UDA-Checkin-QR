import {
  handleCors,
  queryParam,
  requireAdmin,
  supabaseOr500,
  type VercelReq,
  type VercelRes,
} from '../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET' && !queryParam(req, 'action')) {
    const keyword = queryParam(req, 'q').toUpperCase();
    let query = supabase.from('students').select('*').order('student_code');
    if (keyword) query = query.or(`student_code.ilike.%${keyword}%,full_name.ilike.%${keyword}%`);
    const { data } = await query;
    const rows = (data ?? []).map((row) => ({
      studentCode: row.student_code,
      fullName: row.full_name,
      className: row.class_name,
      faculty: row.faculty ?? undefined,
      email: row.email ?? undefined,
    }));
    res.status(200).json({ code: 'SUCCESS', message: 'OK', data: rows });
    return;
  }

  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
