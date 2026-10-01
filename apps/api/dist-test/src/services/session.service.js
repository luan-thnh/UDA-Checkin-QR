import { isValidCoordinate, normalizeRadiusM } from '@checkin/shared';
export function createSession(db, input) {
    const title = input.title.trim();
    if (!title)
        throw new Error('Thieu tieu de phien.');
    if (!isValidCoordinate(input.latCenter, input.lngCenter)) {
        throw new Error('Toa do truong khong hop le.');
    }
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        throw new Error('Khung gio bat dau/ket thuc khong hop le.');
    }
    const session = {
        id: `SS-${Date.now().toString(36).toUpperCase()}`,
        title,
        subject: input.subject?.trim() || undefined,
        latCenter: input.latCenter,
        lngCenter: input.lngCenter,
        radiusM: normalizeRadiusM(input.radiusM),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: 'active',
    };
    db.sessions.set(session.id, session);
    return session;
}
export function listSessions(db) {
    return [...db.sessions.values()].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}
export function closeSession(db, sessionId) {
    const session = db.sessions.get(sessionId);
    if (!session)
        throw new Error('Phien khong ton tai.');
    session.status = 'closed';
    return session;
}
