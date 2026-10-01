import { studentsToCsv } from '@checkin/shared';
import { handleCors, requireAdmin, sendCsv, supabaseOr500, type VercelReq, type VercelRes} from '../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  const { data } = await supabase.from('students').select('*').order('student_code');
  const rows = (data ?? []).map((row: any) => ({
    studentCode: row.student_code,
    fullName: row.full_name,
    className: row.class_name,
    faculty: row.faculty ?? undefined,
    email: row.email ?? undefined,
  }));
  sendCsv(res, 'danh-sach-sinh-vien.csv', studentsToCsv(rows));
}
