import { handleCors, queryParam, requireAdmin, supabaseOr500, type VercelReq, type VercelRes} from '../../../src/vercel/handler.js';
import { deleteSession } from '../../../src/services/session.service.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  if (req.method !== 'DELETE') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  if (!requireAdmin(req, res)) return;
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
  
  const deleted = await deleteSession(sessionId);
  if (deleted) {
    res.status(200).json({ code: 'SUCCESS', message: 'Da xoa phien diem danh.', data: { deleted: 1 } });
  } else {
    res.status(404).json({ code: 'INVALID_INPUT', message: 'Khong the xoa phien (co the phien khong ton tai).', data: null });
  }
}
