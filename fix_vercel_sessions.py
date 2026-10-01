with open('apps/api/api/sessions.ts', 'r') as f:
    code = f.read()

# Replace the manual insert in api/sessions.ts
# Since createSession now returns the created session object and inserts it into supabase
replacement = """      const session = await createSession(readBody(req));
      const miniAppId = process.env.MINI_APP_ID ?? 'MINI_APP_ID';
      res.status(201).json({
"""

import re
code = re.sub(r"      const session = await createSession\(readBody\(req\)\);\n      const \{ error \} = await supabase.*?if \(error\) throw new Error\(error\.message\);\n      const miniAppId = process\.env\.MINI_APP_ID \?\? 'MINI_APP_ID';\n      res\.status\(201\)\.json\(\{", replacement, code, flags=re.DOTALL)

with open('apps/api/api/sessions.ts', 'w') as f:
    f.write(code)
