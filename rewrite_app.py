import re

with open('apps/api/src/app.ts', 'r') as f:
    code = f.read()

# Remove memory store and file persistence logic
code = re.sub(r"import \{ createMemoryDb.*?\} from '\./store/memory\.store\.js';\n", "", code)
code = re.sub(r"export const db: MemoryDb = createMemoryDb\(\);\nrestoreOrSeed\(\);\n.*?(?=function readJsonBody)", "", code, flags=re.DOTALL)

# Replace all occurrences of db in function calls to just empty or remove the db argument
code = code.replace("listStudents(db, ", "await listStudents(")
code = code.replace("upsertStudents(db, ", "await upsertStudents(")
code = code.replace("deleteStudent(db, ", "await deleteStudent(")
code = code.replace("deleteClass(db, ", "await deleteClass(")
code = code.replace("createSession(db, ", "await createSession(")
code = code.replace("listSessions(db)", "await listSessions()")
code = code.replace("closeSession(db, ", "await closeSession(")
code = code.replace("deleteSession(db, ", "await deleteSession(")
code = code.replace("checkIn(db, ", "await checkIn(")
code = code.replace("persist();", "")
code = code.replace("if (deleted) persist();", "")

# Rewrite the attendances route
code = code.replace("const allAttendances = [...db.attendances.values()].map(a => ({\n        ...a,\n        ...(db.students.get(a.studentCode) ?? {})\n      }));", "const { listAllAttendances } = await import('./services/attendance.service.js');\n      const allAttendances = await listAllAttendances();")

# Fix missing async getSession
code = code.replace("const session = db.sessions.get(sessionId);", "const { getSession } = await import('./services/session.service.js');\n      const session = await getSession(sessionId);")
code = code.replace("const session = db.sessions.get(id);", "const { getSession } = await import('./services/session.service.js');\n      const session = await getSession(id);")

# Fix attendances fetch inside session route
code = code.replace("const records = [...db.attendances.values()]\n          .filter((record) => record.sessionId === sessionId)\n          .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))\n          .map((record) => ({ ...record, ...(db.students.get(record.studentCode) ?? {}) }));", "const { getSessionAttendances } = await import('./services/attendance.service.js');\n        const records = await getSessionAttendances(sessionId);")

# Fix export logic
code = code.replace("for (const record of [...db.attendances.values()]\n          .filter((r) => r.sessionId === sessionId)\n          .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {\n          const student = db.students.get(record.studentCode);", "const { getSessionAttendances } = await import('./services/attendance.service.js');\n        const records = await getSessionAttendances(sessionId);\n        for (const record of records) {\n          const student = record;")

# We'll just replace the export route entirely to be safe
export_route_old = """      if (action === 'export' && req.method === 'GET') {
        const lines = ['MSSV,HoTen,Lop,ThoiGianCheckin,KhoangCach(m)'];
        const { getSessionAttendances } = await import('./services/attendance.service.js');
        const records = await getSessionAttendances(sessionId);
        for (const record of records) {
          const student = record;
          lines.push(
            [
              record.studentCode,
              student?.fullName ?? '',
              student?.className ?? '',
              record.checkedAt,
              String(record.distanceM),
            ].join(','),
          );
        }
        sendCsv(res, `diem-danh-${sessionId}.csv`, lines.join('\\n'));
        return;
      }"""
# Wait, I didn't match the old text.
export_route_regex = r"if \(action === 'export' && req\.method === 'GET'\) \{.*?(?=sendCsv\(res).*?return;\n      \}"
code = re.sub(export_route_regex, export_route_old, code, flags=re.DOTALL)

with open('apps/api/src/app.ts', 'w') as f:
    f.write(code)

