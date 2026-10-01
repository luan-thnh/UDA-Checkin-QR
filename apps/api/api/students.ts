import {
  handleCors,
  queryParam,
  requireAdmin,
  supabaseOr500,
  type VercelReq,
  type VercelRes,
} from '../src/vercel/handler.js';
import { deleteClass } from '../src/services/student.service.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET' && !queryParam(req, 'action')) {
    const keyword = queryParam(req, 'q').toUpperCase();
    let query = supabase.from('students').select('*').order('student_code');
    if (keyword) query = query.or(`student_code.ilike.%${keyword}%,full_name.ilike.%${keyword}%,class_name.ilike.%${keyword}%`);
    const { data } = await query;
    const rows = (data ?? []).map((row: any) => ({
      studentCode: row.student_code,
      fullName: row.full_name,
      className: row.class_name,
      faculty: row.faculty ?? undefined,
      email: row.email ?? undefined,
    }));
    res.status(200).json({ code: 'SUCCESS', message: 'OK', data: rows });
    return;
  }
  
  if (req.method === 'DELETE') {
    const className = queryParam(req, 'className');
    if (className) {
      const { deleted } = await deleteClass(className);
      res.status(200).json({ code: 'SUCCESS', message: `Da xoa ${deleted} sinh vien lop ${className}`, data: { deleted } });
    } else {
      res.status(400).json({ code: 'INVALID_INPUT', message: 'Thieu tham so className', data: null });
    }
    return;
  }

  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
