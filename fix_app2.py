with open('apps/api/src/app.ts', 'r') as f:
    code = f.read()

code = code.replace("import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';", "")
code = code.replace("const dbFile = join(dataDir, 'db.json');", "")
code = code.replace("Parameters<typeof createSession>[1]", "Parameters<typeof createSession>[0]")
code = code.replace("await listSessions().map(", "(await listSessions()).map(")
code = code.replace("if (result.code === 'SUCCESS') \n        const status =", "const status =")

with open('apps/api/src/app.ts', 'w') as f:
    f.write(code)

with open('apps/api/src/services/student.service.ts', 'r') as f:
    code = f.read()
code = code.replace("count?.length || 0", "count || 0")
code = code.replace(".select('student_code', { count: 'exact' })", ".select('student_code')") # fix if any

with open('apps/api/src/services/student.service.ts', 'w') as f:
    f.write(code)
