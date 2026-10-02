import { handleCors, supabaseOr500, type VercelReq, type VercelRes } from '../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;

  if (req.method === 'GET') {
    const sId = req.query.session as string;
    const dId = req.query.device as string;

    if (!sId || !dId) {
      res.status(400).json({ code: "INVALID_INPUT", message: "Missing params", data: null });
      return;
    }

    const { data } = await supabase.from("attendances").select("student_code").eq("session_id", sId).eq("device_id", dId).limit(1);
    if (data && data.length > 0) {
      res.status(200).json({ code: "SUCCESS", message: "OK", data: { studentCode: data[0].student_code } });
    } else {
      res.status(200).json({ code: "SUCCESS", message: "OK", data: null });
    }
    return;
  }
  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
