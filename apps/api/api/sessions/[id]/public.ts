import { queryParam, supabaseOr500, type VercelReq, type VercelRes } from '../../../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
    return;
  }
  const supabase = supabaseOr500(res);
  if (!supabase) return;
  const sessionId = decodeURIComponent(queryParam(req, 'id'));
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
}
