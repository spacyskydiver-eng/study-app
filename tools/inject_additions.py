#!/usr/bin/env python3
"""Add new notes to an existing build without the full vault.

Usage:
    python3 tools/inject_additions.py vault-additions/2026-11-20 [more dirs...]

The full Obsidian vault lives on the Mac, so this builds a shadow vault: an empty stub for every note
already in data/vault.json, links to every published attachment, and the new markdown on top. Only the
new notes are rendered (with build_site's Renderer, so they come out exactly as a full build would),
then merged into data/vault.json and data/cards.json. New lecture hubs are added to their subject hub's
Lectures list. Run tools/curate.py afterwards. Running it again with the same folders replaces those
notes and changes nothing else.
"""
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import build_site as BS  # noqa: E402


def main(dirs):
    data = json.load(open(os.path.join(ROOT, 'data', 'vault.json'), encoding='utf-8'))
    deck = json.load(open(os.path.join(ROOT, 'data', 'cards.json'), encoding='utf-8'))
    shadow = tempfile.mkdtemp(prefix='shadow-vault-')
    try:
        for nid, n in data['notes'].items():
            p = os.path.join(shadow, n['path'])
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'w').write('')
        att = os.path.join(ROOT, 'attachments')
        for dp, _, fn in os.walk(att):
            for f in fn:
                rel = os.path.relpath(os.path.join(dp, f), att)
                dst = os.path.join(shadow, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                os.symlink(os.path.join(dp, f), dst)
        added = []
        for d in dirs:
            for dp, _, fn in os.walk(d):
                for f in fn:
                    if f.startswith('.') or f == 'README.md':
                        continue
                    rel = os.path.relpath(os.path.join(dp, f), d)
                    dst = os.path.join(shadow, rel)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    if os.path.lexists(dst):
                        os.remove(dst)
                    shutil.copy2(os.path.join(dp, f), dst)
                    if f.endswith('.md'):
                        added.append(rel[:-3])
        v = BS.Vault(shadow, ['03 Personal'])
        r = BS.Renderer(v)
        new = {}
        for nid in sorted(set(added)):
            new[nid] = r.note(nid)
        data['notes'].update(new)
        # lecture hubs into their subject hub's Lectures list
        for nid, n in new.items():
            pr = n['props']
            if pr.get('type') != 'hub' or not pr.get('subject') or pr.get('kind') not in ('lecture', 'seminar', 'practical', 'section'):
                continue
            subj = pr['subject']
            sid = next((k for k in data['notes'] if k.endswith('/' + subj) and data['notes'][k]['props'].get('type') in ('subject hub', 'subject', 'module', 'hub', None)), None)
            if not sid:
                continue
            sh = data['notes'][sid]
            if nid in sh['links']:
                continue
            topics = sum(1 for k, x in new.items() if x['props'].get('part_of') == os.path.basename(nid) and x['props'].get('type') == 'topic')
            li = f'<li><a class="internal-link" data-note="{BS.html.escape(nid)}" href="#/{BS.html.escape(nid)}">{BS.html.escape(os.path.basename(nid))}</a> <em>{topics} topics</em></li>'
            head = {'lecture': 'Lectures', 'seminar': 'Seminars', 'practical': 'Practicals', 'section': 'Sections'}[pr['kind']]
            m = re.search(r'<h2 data-heading="' + head + r'"[^>]*>.*?</h2></div><div class="el-ol"><ol>(.*?)</ol>', sh['html'], re.S)
            if not m:
                print('no list to extend in', sid, 'for', nid)
                continue
            num = int(pr.get('number') or 0)
            items = re.findall(r'<li>.*?</li>', m.group(1), re.S)
            def numof(item):
                mm = re.search(r'data-note="[^"]*/(\d+) [^"/]*/[^"]*"', item)
                return int(mm.group(1)) if mm else 0
            pos = len(items)
            for i, it in enumerate(items):
                if numof(it) > num:
                    pos = i
                    break
            items.insert(pos, li)
            sh['html'] = sh['html'][:m.start(1)] + '\n'.join(items) + sh['html'][m.end(1):]
            sh['links'] = list(sh['links']) + [nid]
        data['tree'] = BS.build_tree(sorted([n['path'] for n in data['notes'].values()] + list(data.get('canvases', {}))))
        # flashcards from the new notes
        nd = BS.build_cards(v, r, new)
        by_deck = {d['id']: d for d in deck['decks']}
        idx = {c['id']: i for i, c in enumerate(deck['cards'])}
        for c in nd['cards']:
            if c['id'] in idx:
                deck['cards'][idx[c['id']]] = c
            else:
                deck['cards'].append(c)
        for d in nd['decks']:
            if d['id'] not in by_deck:
                deck['decks'].append(d)
                by_deck[d['id']] = d
        for d in deck['decks']:
            d['count'] = sum(1 for c in deck['cards'] if c['deck'] == d['id'])
        deck['decks'].sort(key=lambda d: (d['subject'], d['name'] == 'Key terms', d['name']))
        # new attachments
        n_att = 0
        for rel in sorted(v.used_files):
            src = v.files.get(rel)
            dst = os.path.join(att, rel)
            if src and not os.path.islink(src) and not os.path.exists(dst):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
                n_att += 1
        data['built'] = BS.datetime.now(BS.timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
        json.dump(data, open(os.path.join(ROOT, 'data', 'vault.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        json.dump(deck, open(os.path.join(ROOT, 'data', 'cards.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        unresolved = sum(n['html'].count('is-unresolved') for n in new.values())
        print(f'{len(new)} notes added or replaced, {len(nd["cards"])} cards from them, {n_att} new attachments, {unresolved} unresolved links')
    finally:
        shutil.rmtree(shadow, ignore_errors=True)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
