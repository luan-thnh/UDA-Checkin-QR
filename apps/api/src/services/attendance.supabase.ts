import {
  haversineMeters,
  isValidCoordinate,
  isValidStudentCode,
  isWithinRadius,
  normalizeStudentCode,
  type ApiResponse,
  type AttendRequest,
  type AttendSuccessData,
} from '@checkin/shared';
import type { SupabaseClient } from '@supabase/supabase-js';

function fail(code: ApiResponse<never>['code'], message: string): ApiResponse<never> {
  return { code, message, data: undefined as never };
}

export async function checkInWithSupabase(
  supabase: SupabaseClient,
  input: AttendRequest,
): Promise<ApiResponse<AttendSuccessData>> {
  const sessionId = input.sessionId.trim();
  if (!sessionId || !isValidStudentCode(input.studentCode ?? '')) {
    return fail('INVALID_INPUT', 'Thieu sessionId hoac MSSV khong hop le.');
  }
  if (!isValidCoordinate(input.lat, input.lng)) {
    return fail('INVALID_INPUT', 'Toa do GPS khong hop le.');
  }
  const studentCode = normalizeStudentCode(input.studentCode);

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id,title,lat_center,lng_center,radius_m,starts_at,ends_at,status')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) {
    return fail('SESSION_CLOSED', 'Phien diem danh khong ton tai.');
  }

  const now = new Date();
  if (
    session.status !== 'active' ||
    now < new Date(session.starts_at) ||
    now > new Date(session.ends_at)
  ) {
    return fail('SESSION_CLOSED', 'Phien diem danh da dong hoac het han.');
  }

  const { data: student } = await supabase
    .from('students')
    .select('student_code')
    .eq('student_code', studentCode)
    .single();
  if (!student) {
    return fail('STUDENT_NOT_FOUND', `MSSV ${studentCode} khong co trong danh sach.`);
  }

  if (input.deviceId) {
    const { data: existingDevice } = await supabase
      .from('attendances')
      .select('student_code')
      .eq('session_id', sessionId)
      .eq('device_id', input.deviceId)
      .neq('student_code', studentCode)
      .limit(1);

    if (existingDevice && existingDevice.length > 0) {
      return fail('INVALID_INPUT', `Phát hiện gian lận: Thiết bị này đã điểm danh cho sinh viên khác (${existingDevice[0].student_code})!`);
    }
  }

  const distanceM = haversineMeters(input.lat, input.lng, session.lat_center, session.lng_center);
  if (!isWithinRadius(input.lat, input.lng, session.lat_center, session.lng_center, session.radius_m)) {
    return {
      code: 'OUT_OF_RANGE',
      message: `Ban dang cach truong ${Math.round(distanceM)}m, vuot qua ${session.radius_m}m cho phep.`,
      data: undefined as never,
    };
  }

  const { data: existing } = await supabase
    .from('attendances')
    .select('*')
    .eq('session_id', session.id)
    .eq('student_code', studentCode)
    .single();
  if (existing) {
    return {
      code: 'ALREADY_CHECKED',
      message: `MSSV ${studentCode} da diem danh luc ${existing.checked_at}.`,
      data: {
        attendance: {
          id: existing.id,
          sessionId: existing.session_id,
          studentCode: existing.student_code,
          checkedAt: existing.checked_at,
          distanceM: existing.distance_m,
          lat: existing.lat,
          lng: existing.lng,
        },
        distanceM: existing.distance_m,
      },
    };
  }

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
  const { error: insertError } = await supabase.from('attendances').insert(record);
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: raced } = await supabase
        .from('attendances')
        .select('*')
        .eq('session_id', session.id)
        .eq('student_code', studentCode)
        .single();
      return {
        code: 'ALREADY_CHECKED',
        message: `MSSV ${studentCode} da diem danh luc ${raced?.checked_at ?? ''}.`,
        data: undefined as never,
      };
    }
    return fail('INVALID_INPUT', 'Khong luu duoc diem danh. Thu lai.');
  }

  return {
    code: 'SUCCESS',
    message: 'Diem danh thanh cong.',
    data: {
      attendance: {
        id: record.id,
        sessionId: record.session_id,
        studentCode: record.student_code,
        checkedAt: record.checked_at,
        distanceM: record.distance_m,
        lat: record.lat,
        lng: record.lng,
      },
      distanceM: record.distance_m,
    },
  };
}
