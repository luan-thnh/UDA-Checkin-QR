import { handleCors, queryParam, requireAdmin, sendCsv, supabaseOr500, type VercelReq, type VercelRes} from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
  const { data: records } = await supabase
    .from('attendances')
    .select('*, students(full_name, class_name)')
    .eq('session_id', sessionId)
    .order('checked_at');
  const lines = ['MSSV,HoTen,Lop,ThoiGianCheckin,KhoangCach(m)'];
  for (const row of records ?? []) {
    const student = row.students as unknown as { full_name?: string; class_name?: string };
    lines.push(
      [row.student_code, student?.full_name ?? '', student?.class_name ?? '', row.checked_at, String(row.distance_m)].join(','),
    );
  }
  sendCsv(res, `diem-danh-${sessionId}.csv`, lines.join('\n'));
}
