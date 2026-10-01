import { isValidCoordinate, isValidStudentCode, isWithinRadius, haversineMeters, normalizeStudentCode, } from '@checkin/shared';
import { attendanceKey } from '../store/memory.store.js';
function fail(code, message) {
    return { code, message, data: undefined };
}
export function checkIn(db, input) {
    const sessionId = input.sessionId.trim();
    const rawCode = input.studentCode ?? '';
    if (!sessionId || !isValidStudentCode(rawCode)) {
        return fail('INVALID_INPUT', 'Thieu sessionId hoac MSSV khong hop le.');
    }
    if (!isValidCoordinate(input.lat, input.lng)) {
        return fail('INVALID_INPUT', 'Toa do GPS khong hop le.');
    }
    const session = db.sessions.get(sessionId);
    if (!session) {
        return fail('SESSION_CLOSED', 'Phien diem danh khong ton tai.');
    }
    const now = new Date();
    const isExpired = session.status !== 'active' ||
        now < new Date(session.startsAt) ||
        now > new Date(session.endsAt);
    if (isExpired) {
        return fail('SESSION_CLOSED', 'Phien diem danh da dong hoac het han.');
    }
    const studentCode = normalizeStudentCode(rawCode);
    const student = db.students.get(studentCode);
    if (!student) {
        return fail('STUDENT_NOT_FOUND', `MSSV ${studentCode} khong co trong danh sach.`);
    }
    const distanceM = haversineMeters(input.lat, input.lng, session.latCenter, session.lngCenter);
    const inside = isWithinRadius(input.lat, input.lng, session.latCenter, session.lngCenter, session.radiusM);
    if (!inside) {
        return {
            code: 'OUT_OF_RANGE',
            message: `Ban dang cach truong ${Math.round(distanceM)}m, vuot qua ${session.radiusM}m cho phep.`,
            data: undefined,
        };
    }
    const key = attendanceKey(session.id, studentCode);
    const existing = db.attendances.get(key);
    if (existing) {
        return {
            code: 'ALREADY_CHECKED',
            message: `MSSV ${studentCode} da diem danh luc ${existing.checkedAt}.`,
            data: { attendance: existing, distanceM: existing.distanceM },
        };
    }
    const record = {
        id: `AT-${Date.now()}-${studentCode}`,
        sessionId: session.id,
        studentCode,
        checkedAt: now.toISOString(),
        distanceM: Math.round(distanceM),
        lat: input.lat,
        lng: input.lng,
    };
    db.attendances.set(key, record);
    return {
        code: 'SUCCESS',
        message: 'Diem danh thanh cong.',
        data: { attendance: record, distanceM: record.distanceM },
    };
}
