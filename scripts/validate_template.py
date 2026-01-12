import re
from pathlib import Path

root = Path('templates/agendas')
files = list(root.glob('*.html'))

for path in files:
    print('\nChecking', path)
    text = path.read_text(encoding='utf-8')

    tags = re.finditer(r'{%\s*(.*?)\s*%}', text, re.S)
    stack = []
    line_starts = [0]
    for i, ch in enumerate(text):
        if ch == '\n':
            line_starts.append(i+1)

    errors = []

    for m in tags:
        tag = m.group(1).strip()
        # compute line number
        pos = m.start()
        line = next((i+1 for i, s in enumerate(line_starts) if s > pos), len(line_starts))
        parts = tag.split()
        if not parts:
            continue
        kw = parts[0]
        if kw in ('for', 'if', 'block', 'with', 'comment', 'autoescape', 'filter'):
            stack.append((kw, line, tag))
        elif kw in ('endfor', 'endif', 'endblock', 'endwith', 'endcomment', 'endautoescape', 'endfilter'):
            expect = {
                'endfor': 'for',
                'endif': 'if',
                'endblock': 'block',
                'endwith': 'with',
                'endcomment': 'comment',
                'endautoescape': 'autoescape',
                'endfilter': 'filter'
            }[kw]
            if not stack:
                errors.append((line, f"Unmatched {kw} (no opening {expect})"))
            else:
                top = stack.pop()
                if top[0] != expect:
                    errors.append((line, f"Mismatched {kw}, expected end for {top[0]} opened at line {top[1]}"))
        elif kw == 'empty':
            # valid only if top of stack is 'for'
            if not stack or stack[-1][0] != 'for':
                errors.append((line, "'empty' found but no open 'for' block"))

    if stack:
        for item in stack:
            errors.append((item[1], f"Unclosed block {item[0]} started at line {item[1]}"))

    if errors:
        for e in errors:
            print('Error at line', e[0], e[1])
    else:
        print('No errors detected in', path)
