import { isValidCoordinate, normalizeRadiusM } from '@checkin/shared';
import type { CheckinSession } from '@checkin/shared';
import { supabase } from '../utils/supabase.js';

export interface CreateSessionInput {
  title: string;
  subject?: string;
  className?: string;
  latCenter: number;
  lngCenter: number;
  radiusM?: number;
  startsAt: string;
  endsAt: string;
}

export async function createSession(input: CreateSessionInput): Promise<CheckinSession> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const title = input.title.trim();
  if (!title) throw new Error('Thieu tieu de phien.');
  if (!isValidCoordinate(input.latCenter, input.lngCenter)) {
    throw new Error('Toa do truong khong hop le.');
  }
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error('Khung gio bat dau/ket thuc khong hop le.');
  }

  const session: CheckinSession = {
    id: `SS-${Date.now().toString(36).toUpperCase()}`,
    title,
    subject: input.subject?.trim() || undefined,
    className: input.className?.trim() || undefined,
    latCenter: input.latCenter,
    lngCenter: input.lngCenter,
    radiusM: normalizeRadiusM(input.radiusM),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: 'active',
  };

  const { error } = await supabase.from('sessions').insert({
    id: session.id,
    title: session.title,
    subject: session.subject,
    lat_center: session.latCenter,
    lng_center: session.lngCenter,
    radius_m: session.radiusM,
    starts_at: session.startsAt,
    ends_at: session.endsAt,
    status: session.status,
  });

  if (error) throw new Error(`Loi tao phien: ${error.message}`);
  return session;
}

export async function listSessions(): Promise<CheckinSession[]> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('starts_at', { ascending: false });

  if (error) throw new Error(`Loi tai danh sach phien: ${error.message}`);
  
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    className: row.class_name, // Not in original DB schema, we'll map if exists, otherwise undefined (Wait, did user add it to DB? The screenshot doesn't show class_name in sessions! I'll skip it for now or just map what we have)
    latCenter: row.lat_center,
    lngCenter: row.lng_center,
    radiusM: row.radius_m,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  }));
}

export async function getSession(sessionId: string): Promise<CheckinSession | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    latCenter: data.lat_center,
    lngCenter: data.lng_center,
    radiusM: data.radius_m,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    status: data.status,
  };
}

export async function closeSession(sessionId: string): Promise<CheckinSession> {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'closed' })
    .eq('id', sessionId)
    .select()
    .single();

  if (error || !data) throw new Error('Phien khong ton tai hoac loi cap nhat.');
  
  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    latCenter: data.lat_center,
    lngCenter: data.lng_center,
    radiusM: data.radius_m,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    status: data.status,
  };
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  return !error;
}
