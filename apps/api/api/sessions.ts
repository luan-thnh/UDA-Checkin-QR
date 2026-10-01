import { buildSessionDeepLink } from '@checkin/shared';
import { createSession } from '../src/services/session.service.js';
import type { MemoryDb } from '../src/store/memory.store.js';
import {
  readBody,
  requireAdmin,
  supabaseOr500,
  type VercelReq,
  type VercelRes,
} from '../src/vercel/handler.js';

export default async function handler(req: VercelReq, res: VercelRes) {
  const supabase = supabaseOr500(res);
  if (!supabase) return;

  if (req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    const { data } = await supabase.from('sessions').select('*').order('starts_at', { ascending: false });
    res.status(200).json({ code: 'SUCCESS', message: 'OK', data: data ?? [] });
    return;
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    try {
      // Dung lai logic validate bang cach chay qua memory store tam
      const { createMemoryDb } = await import('../src/store/memory.store.js');
      const tempDb: MemoryDb = createMemoryDb();
      const session = createSession(tempDb, readBody(req));
      const { error } = await supabase.from('sessions').insert({
        id: session.id,
        title: session.title,
        subject: session.subject ?? null,
        lat_center: session.latCenter,
        lng_center: session.lngCenter,
        radius_m: session.radiusM,
        starts_at: session.startsAt,
        ends_at: session.endsAt,
        status: 'active',
      });
      if (error) throw new Error(error.message);
      const miniAppId = process.env.MINI_APP_ID ?? 'MINI_APP_ID';
      res.status(201).json({
        code: 'SUCCESS',
        message: 'Tao phien thanh cong.',
        data: { ...session, qrPayload: buildSessionDeepLink(miniAppId, session.id) },
      });
    } catch (error) {
      res.status(400).json({
        code: 'INVALID_INPUT',
        message: error instanceof Error ? error.message : 'Du lieu phien khong hop le.',
        data: null,
      });
    }
    return;
  }

  res.status(405).json({ code: 'INVALID_INPUT', message: 'Method not allowed.', data: null });
}
