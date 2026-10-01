import { normalizeStudentCode, parseStudentRows } from '@checkin/shared';
import { readBody, requireAdmin, supabaseOr500, type VercelReq, type VercelRes } from '../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
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
}
