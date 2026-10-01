import { normalizeStudentCode } from '@checkin/shared';
export function listStudents(db, query) {
    const keyword = query.trim().toUpperCase();
    const all = [...db.students.values()];
    if (!keyword)
        return all.sort(byStudentCode);
    return all
        .filter((student) => student.studentCode.includes(keyword) ||
        student.fullName.toUpperCase().includes(keyword) ||
        student.className.toUpperCase().includes(keyword))
        .sort(byStudentCode);
}
export function upsertStudents(db, students) {
    for (const student of students) {
        db.students.set(normalizeStudentCode(student.studentCode), {
            ...student,
            studentCode: normalizeStudentCode(student.studentCode),
        });
    }
    return { upserted: students.length };
}
function byStudentCode(a, b) {
    return a.studentCode.localeCompare(b.studentCode);
}
