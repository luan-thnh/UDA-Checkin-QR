import { normalizeStudentCode, parseStudentRows, studentsToCsv } from '@checkin/shared';
import { handleCors, queryParam, readBody, requireAdmin, sendCsv, supabaseOr500, type VercelReq, type VercelRes} from '../src/vercel/handler.js';
import { deleteClass, deleteStudent } from '../src/services/student.service.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;

  const action = queryParam(req, 'action'); // ?action=export

  if (req.method === 'GET') {
    if (action === 'export') {
      const { data } = await supabase.from('students').select('*').order('student_code');
      const rows = (data ?? []).map((row: any) => ({
        studentCode: row.student_code,
        fullName: row.full_name,
        className: row.class_name,
        faculty: row.faculty ?? undefined,
        email: row.email ?? undefined,
      }));
      sendCsv(res, 'danh-sach-sinh-vien.csv', studentsToCsv(rows));
      return;
    }

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
  
  if (req.method === 'POST') {
    // Import
    const body = readBody<{ rows?: unknown[] }>(req);
    const { imported, skipped } = parseStudentRows((body.rows ?? []) as never);
    if (imported.length) {
      await supabase.from('students').upsert(
        imported.map((student) => ({
          student_code: normalizeStudentCode(student.studentCode),
          full_name: student.fullName,
          class_name: student.className,
          faculty: student.faculty ?? null,
          email: student.email ?? null,
        })),
        { onConflict: 'student_code' },
      );
    }
    res.status(200).json({
      code: 'SUCCESS',
      message: `Nhap ${imported.length} SV, bo qua ${skipped.length} dong.`,
      data: { imported: imported.length, skipped },
    });
    return;
  }
  
  if (req.method === 'DELETE') {
    const className = queryParam(req, 'className');
    const studentCode = queryParam(req, 'studentCode');
    
    if (className) {
      const { deleted } = await deleteClass(className);
      res.status(200).json({ code: 'SUCCESS', message: `Da xoa ${deleted} sinh vien lop ${className}`, data: { deleted } });
      return;
    }
    if (studentCode) {
      const deleted = await deleteStudent(studentCode);
      if (deleted) {
        res.status(200).json({ code: 'SUCCESS', message: 'Da xoa sinh vien.', data: { deleted: 1 } });
      } else {
        res.status(404).json({ code: 'INVALID_INPUT', message: 'Khong tim thay sinh vien.', data: null });
      }
      return;
    }
    res.status(400).json({ code: 'INVALID_INPUT', message: 'Thieu tham so xoa', data: null });
    return;
  }

  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
