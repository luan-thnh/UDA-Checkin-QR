import {
  isValidCoordinate,
  isValidStudentCode,
  isWithinRadius,
  haversineMeters,
  normalizeStudentCode,
  type ApiResponse,
  type AttendRequest,
  type AttendSuccessData,
  type AttendanceRecord,
  type AttendanceResultCode,
} from '@checkin/shared';
import { supabase } from '../utils/supabase.js';

function fail(code: AttendanceResultCode, message: string): ApiResponse<never> {
  return { code, message, data: undefined as never };
}

export async function checkIn(input: AttendRequest): Promise<ApiResponse<AttendSuccessData>> {
  if (!supabase) return fail('INVALID_INPUT', 'Supabase not configured');
  
  const sessionId = input.sessionId.trim();
  const rawCode = input.studentCode ?? '';

  if (!sessionId || !isValidStudentCode(rawCode)) {
    return fail('INVALID_INPUT', 'Thieu sessionId hoac MSSV khong hop le.');
  }
  if (!isValidCoordinate(input.lat, input.lng)) {
    return fail('INVALID_INPUT', 'Toa do GPS khong hop le.');
  }

  // 1. Get session
  const { data: session, error: sessionErr } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (sessionErr || !session) {
    return fail('SESSION_CLOSED', 'Phien diem danh khong ton tai.');
  }

  const now = new Date();
  const isExpired =
    session.status !== 'active' ||
    now < new Date(session.starts_at) ||
    now > new Date(session.ends_at);
  if (isExpired) {
    return fail('SESSION_CLOSED', 'Phien diem danh da dong hoac het han.');
  }

  // 2. Anti-cheat check: Device ID
  if (input.deviceId) {
    const { data: existingDevice } = await supabase
      .from('attendances')
      .select('student_code')
      .eq('session_id', sessionId)
      .eq('device_id', input.deviceId)
      .neq('student_code', normalizeStudentCode(rawCode))
      .limit(1);

    if (existingDevice && existingDevice.length > 0) {
      return fail('INVALID_INPUT', `Phát hiện gian lận: Thiết bị này đã điểm danh cho sinh viên khác (${existingDevice[0].student_code})!`);
    }
  }

  // 3. Get student
  const studentCode = normalizeStudentCode(rawCode);
  const { data: student, error: studentErr } = await supabase.from('students').select('*').eq('student_code', studentCode).single();
  if (studentErr || !student) {
    return fail('STUDENT_NOT_FOUND', `MSSV ${studentCode} khong co trong danh sach.`);
  }

  // 4. Distance check
  const distanceM = haversineMeters(input.lat, input.lng, session.lat_center, session.lng_center);
  const inside = isWithinRadius(input.lat, input.lng, session.lat_center, session.lng_center, session.radius_m);
  if (!inside) {
    return {
      code: 'OUT_OF_RANGE',
      message: `Ban dang cach truong ${Math.round(distanceM)}m, vuot qua ${session.radius_m}m cho phep.`,
      data: undefined as never,
    };
  }

  // 4. Check existing
  const { data: existing } = await supabase.from('attendances').select('*').eq('session_id', sessionId).eq('student_code', studentCode).single();
  
  if (existing) {
    const attRecord: AttendanceRecord = {
      id: existing.id,
      sessionId: existing.session_id,
      studentCode: existing.student_code,
      checkedAt: existing.checked_at,
      distanceM: existing.distance_m,
      lat: existing.lat,
      lng: existing.lng,
    };
    return {
      code: 'ALREADY_CHECKED',
      message: `MSSV ${studentCode} da diem danh luc ${existing.checked_at}.`,
      data: { attendance: attRecord, distanceM: existing.distance_m },
    };
  }

  // 5. Insert
  const record = {
    id: `AT-${Date.now()}-${studentCode}`,
    session_id: session.id,
    student_code: studentCode,
    checked_at: now.toISOString(),
    distance_m: Math.round(distanceM),
    lat: input.lat,
    lng: input.lng,
    device_id: input.deviceId ?? null,
  };
  
  const { error: insertErr } = await supabase.from('attendances').insert(record);
  if (insertErr) {
    // Unique constraint violation check just in case of race condition
    if (insertErr.code === '23505') {
       return fail('ALREADY_CHECKED', 'Ban da diem danh roi.');
    }
    return fail('INVALID_INPUT', `Loi he thong: ${insertErr.message}`);
  }

  const attRecord: AttendanceRecord = {
    id: record.id,
    sessionId: record.session_id,
    studentCode: record.student_code,
    checkedAt: record.checked_at,
    distanceM: record.distance_m,
    lat: record.lat,
    lng: record.lng,
  };

  return {
    code: 'SUCCESS',
    message: 'Diem danh thanh cong.',
    data: { attendance: attRecord, distanceM: attRecord.distanceM },
  };
}

export async function listAllAttendances(): Promise<any[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('attendances')
    .select(`
      *,
      student:students (
        full_name,
        class_name,
        faculty
      )
    `);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    sessionId: row.session_id,
    studentCode: row.student_code,
    checkedAt: row.checked_at,
    distanceM: row.distance_m,
    lat: row.lat,
    lng: row.lng,
    fullName: row.student?.full_name,
    className: row.student?.class_name,
    faculty: row.student?.faculty
  }));
}

export async function getSessionAttendances(sessionId: string): Promise<any[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('attendances')
    .select(`
      *,
      student:students (
        full_name,
        class_name,
        faculty
      )
    `)
    .eq('session_id', sessionId);
  
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    sessionId: row.session_id,
    studentCode: row.student_code,
    checkedAt: row.checked_at,
    distanceM: row.distance_m,
    lat: row.lat,
    lng: row.lng,
    fullName: row.student?.full_name,
    className: row.student?.class_name,
    faculty: row.student?.faculty
  }));
}
