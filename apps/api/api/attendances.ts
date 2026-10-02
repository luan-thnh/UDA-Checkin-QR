import { handleCors, requireAdmin, supabaseOr500, type VercelReq, type VercelRes } from '../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    // Fetch all attendances with student info and session info
    const { data: records, error } = await supabase
      .from('attendances')
      .select('*, student:students(full_name, class_name), session:sessions(title, subject, starts_at)')
      .order('checked_at', { ascending: false });

    if (error) {
      res.status(500).json({ code: 'DATABASE_ERROR', message: error.message, data: null });
      return;
    }

    const formatted = (records ?? []).map((r: any) => ({
      id: r.id,
      sessionId: r.session_id,
      sessionTitle: r.session?.title,
      sessionSubject: r.session?.subject,
      sessionDate: r.session?.starts_at,
      studentCode: r.student_code,
      fullName: r.student?.full_name,
      className: r.student?.class_name,
      checkedAt: r.checked_at,
      distanceM: r.distance_m,
    }));

    res.status(200).json({ code: 'SUCCESS', message: 'OK', data: formatted });
    return;
  }

  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
