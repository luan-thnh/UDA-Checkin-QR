import { handleCors, queryParam, requireAdmin, supabaseOr500, type VercelReq, type VercelRes} from '../../src/vercel/handler.js';
import { deleteStudent } from '../../src/services/student.service.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'DELETE') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  
  const studentCode = decodeURIComponent(queryParam(req, 'id'));
  const deleted = await deleteStudent(studentCode);
  
  if (deleted) {
    res.status(200).json({ code: 'SUCCESS', message: 'Da xoa sinh vien.', data: { deleted: 1 } });
  } else {
    res.status(404).json({ code: 'INVALID_INPUT', message: 'Khong tim thay sinh vien.', data: null });
  }
}
