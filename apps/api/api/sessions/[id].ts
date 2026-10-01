import { studentsToCsv } from '@checkin/shared';
import { handleCors, queryParam, requireAdmin, sendCsv, supabaseOr500, type VercelReq, type VercelRes} from '../../src/vercel/handler.js';
import { closeSession, deleteSession } from '../../src/services/session.service.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (handleCors(req, res)) return;
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
  const action = queryParam(req, 'action'); // ?action=public, close, export, attendances
  
  if (req.method === 'GET') {
    if (action === 'public' || !action) {
      const { data: session } = await supabase
        .from('sessions')
        .select('id,title,subject,lat_center,lng_center,radius_m,starts_at,ends_at,status')
        .eq('id', sessionId)
        .single();
      if (!session) {
        res.status(404).json({ code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
        return;
      }
      res.status(200).json({
        code: 'SUCCESS',
        message: 'OK',
        data: {
          id: session.id,
          title: session.title,
          subject: session.subject,
          latCenter: session.lat_center,
          lngCenter: session.lng_center,
          radiusM: session.radius_m,
          startsAt: session.starts_at,
          endsAt: session.ends_at,
          status: session.status,
        },
      });
      return;
    }
    
    if (action === 'attendances') {
      if (!requireAdmin(req, res)) return;
      const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
      if (!session) {
        res.status(404).json({ code: 'SESSION_CLOSED', message: 'Phien khong ton tai.', data: null });
        return;
      }
      const { data: records } = await supabase
        .from('attendances')
        .select('*, student:students(full_name, class_name)')
        .eq('session_id', sessionId)
        .order('checked_at', { ascending: true });
        
      const formatted = (records ?? []).map((r: any) => ({
        id: r.id,
        sessionId: r.session_id,
        studentCode: r.student_code,
        checkedAt: r.checked_at,
        distanceM: r.distance_m,
        lat: r.lat,
        lng: r.lng,
        fullName: r.student?.full_name,
        className: r.student?.class_name,
      }));
      res.status(200).json({ code: 'SUCCESS', message: 'OK', data: { session, total: formatted.length, records: formatted } });
      return;
    }
    
    if (action === 'export') {
      if (!requireAdmin(req, res)) return;
      const { data: records } = await supabase
        .from('attendances')
        .select('*, student:students(full_name, class_name)')
        .eq('session_id', sessionId)
        .order('checked_at', { ascending: true });
      const lines = ['MSSV,HoTen,Lop,ThoiGianCheckin,KhoangCach(m)'];
      for (const r of (records ?? [])) {
        lines.push([r.student_code, r.student?.full_name ?? '', r.student?.class_name ?? '', r.checked_at, String(r.distance_m)].join(','));
      }
      sendCsv(res, `diem-danh-${sessionId}.csv`, lines.join('\n'));
      return;
    }
  }
  
  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    if (action === 'close') {
      const closed = await closeSession(sessionId);
      res.status(200).json({ code: 'SUCCESS', message: 'Da dong phien.', data: closed });
      return;
    }
  }
  
  if (req.method === 'DELETE') {
    if (!requireAdmin(req, res)) return;
    const deleted = await deleteSession(sessionId);
    if (deleted) {
      res.status(200).json({ code: 'SUCCESS', message: 'Da xoa phien diem danh.', data: { deleted: 1 } });
    } else {
      res.status(404).json({ code: 'INVALID_INPUT', message: 'Khong the xoa phien (co the phien khong ton tai).', data: null });
    }
    return;
  }
  
  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed or missing action.', data: null });
}
