with open('apps/api/src/app.ts', 'r') as f:
    code = f.read()

# Fix the sendCsv line
code = code.replace("lines.join('\n\n'))", "lines.join('\\n'))")
code = code.replace("lines.join('\n", "lines.join('\\n'")
code = code.replace("'));\n", "'));\n")

with open('apps/api/src/app.ts', 'w') as f:
    f.write(code)
