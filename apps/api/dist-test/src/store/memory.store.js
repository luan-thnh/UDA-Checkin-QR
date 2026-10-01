export function createMemoryDb() {
    return { students: new Map(), sessions: new Map(), attendances: new Map() };
}
export function attendanceKey(sessionId, studentCode) {
    return `${sessionId}::${studentCode}`;
}
export function seedDemoData(db) {
    db.students.set('SV001', {
        studentCode: 'SV001',
        fullName: 'Nguyen Van A',
        className: 'CTK45',
        faculty: 'CNTT',
    });
    db.students.set('SV002', {
        studentCode: 'SV002',
        fullName: 'Tran Thi B',
        className: 'CTK45',
        faculty: 'CNTT',
    });
    const now = Date.now();
    db.sessions.set('SS-DEMO-001', {
        id: 'SS-DEMO-001',
        title: 'Lap trinh Web - Tuan 1',
        subject: 'LT Web',
        latCenter: 10.762622,
        lngCenter: 106.660172,
        radiusM: 2000,
        startsAt: new Date(now - 60 * 60 * 1000).toISOString(),
        endsAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
    });
}
