#!/usr/bin/env python3
"""Write one lecture's notes (hub, topics, key terms) in the vault's format from a Python spec.

Usage: python3 tools/make_lecture.py spec.py vault-additions/<date>
The spec file defines SPEC = {...} (see keys below). Key terms that already exist in data/vault.json
are linked, not rewritten.
"""
import json
import os
import runpy
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAGS = {'Molecular Biology and Genetics': ('genetics', 'subject-genetics'),
        'Biological Chemistry': ('chemistry', 'subject-chemistry'),
        'Introduction to Biomedicine': ('biomedicine', 'subject-biomedicine'),
        'Professional Skills for Biosciences': ('skills', 'subject-skills')}


def q(s):
    return '"' + str(s).replace('"', '\\"') + '"'


def main(spec_path, out_root):
    S = runpy.run_path(spec_path)['SPEC']
    subj, date = S['subject'], S['date']
    tag, css = TAGS[subj]
    hub = S['hub']
    folder = os.path.join(out_root, '01 Year 1', subj, S.get('section', 'Lectures'), S['folder'])
    os.makedirs(folder, exist_ok=True)
    os.makedirs(os.path.join(out_root, '02 Key Terms'), exist_ok=True)
    existing = set()
    vj = os.path.join(ROOT, 'data', 'vault.json')
    if os.path.exists(vj):
        existing = {k.split('/')[-1] for k in json.load(open(vj))['notes'] if k.startswith('02 Key Terms/')}
    terms = S.get('terms', {})
    lines = []
    total_q = 0
    for i, t in enumerate(S['topics'], 1):
        fn = f"{i:02d} {t['file'] if 'file' in t else t['title']}"
        t['fn'] = fn
        qs = t.get('questions', [])
        total_q += len(qs)
        body = t['body'].strip()
        if qs:
            body += '\n\n## Questions\n' + '\n\n'.join(f'> [!question]- {a}\n> {b}' for a, b in qs)
        md = f'''---
title: {q(t['title'])}
aliases: [{q(t['title'])}]
tags: [{tag}, topic]
type: topic
subject: {subj}
part_of: {q(hub)}
kind: {S.get('kind', 'lecture')}
semester: {S.get('semester', 'Autumn')}
summary: {q(t['summary'])}
source: {q(S['source'])}
cssclasses: [{css}, page-topic]
created: {date}
updated: {date}
---
# {t['title']}

> [!path] [[{subj}]] › [[{hub}]]

*Source: {S['source']}, {t['slides']}*

{body}
'''
        open(os.path.join(folder, fn + '.md'), 'w').write(md)
        nk = sum(1 for k, v in terms.items() if v[2] == i)
        bits = [f'{nk} key term{"s" if nk != 1 else ""}' if nk else '', f'{len(qs)} question{"s" if len(qs) != 1 else ""}' if qs else '']
        bits = ' · '.join(b for b in bits if b)
        lines.append(f"{i}. [[{fn}|{t['title']}]]" + (f' *{bits}*' if bits else ''))
    glance = '\n'.join(f'> | {a} | {b} |' for a, b in S['glance'])
    md = f'''---
title: {q(hub)}
tags: [{tag}, hub]
type: hub
subject: {subj}
kind: {S.get('kind', 'lecture')}
number: {S['number']}
semester: {S.get('semester', 'Autumn')}
cssclasses: [{css}, page-hub]
created: {date}
updated: {date}
---
# {hub}

> [!path] [[{subj}]] › {S.get('kind', 'lecture').title()} {S['number']}

> [!abstract] {S.get('kind', 'lecture').title()} {S['number']}
> {len(S['topics'])} topics · {len(terms)} key terms · {total_q} questions

> [!key] At a glance
>
> | Term | What to know |
> | --- | --- |
{glance}

## Topics
''' + '\n'.join(lines) + '\n\n## Key terms\n' + '\n'.join(f'- [[{k}]]' for k in sorted(terms, key=str.lower)) + '''

## Progress
- [ ] Topics read
- [ ] Topic questions done
- [ ] Wrong answers redone
'''
    open(os.path.join(folder, hub + '.md'), 'w').write(md)
    made = 0
    for k, (d, al, ti) in terms.items():
        if k in existing:
            continue
        t = S['topics'][ti - 1]
        open(os.path.join(out_root, '02 Key Terms', k + '.md'), 'w').write(f'''---
title: {q(k)}
aliases: [{", ".join(q(a) for a in al)}]
tags: [key-term, {tag}]
type: key term
subjects: [{subj}]
cssclasses: [subject-terms, page-term]
created: {date}
updated: {date}
---
# {k}

> [!definition] Definition
> {d}

## Where this comes up
- [[{t['fn']}|{t['title']}]] · *{subj}*
''')
        made += 1
    print(f"{hub}: {len(S['topics'])} topics, {total_q} questions, {made} new key terms ({len(terms) - made} linked)")


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
