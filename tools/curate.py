"""Curation layer applied after the vault is rendered.

Reads content/flashcards/*.json and content/exams/*.json and, for each curated subject:
  - removes the subject's Questions and Test notes and the Questions / Test sections inside its notes
    (their questions stay in the flashcards)
  - adds an "Exam practice" section to the subject hub and to each lecture hub that has a paper
  - drops, edits and adds flashcards (including diagram cards with numbered gaps)
  - writes data/exams.json for the exam view

build_site.py calls apply() on every build. It can also patch an existing build in place:
    python3 tools/curate.py            (writes data/*.json)
    python3 tools/curate.py --dry-run  (reports only)
Running it twice changes nothing the second time.
"""
import argparse
import glob
import hashlib
import html as H
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DROP_H2 = {'questions', 'test', 'test#'}
SLOT = '<!--exam-slot-->'


def norm(s):
    s = H.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    s = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'\2', s)
    s = re.sub(r'\[\[([^\]]+)\]\]', r'\1', s)
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def top_blocks(html):
    """Split rendered note html into its top-level <div> blocks."""
    out, depth, start = [], 0, 0
    for m in re.finditer(r'<div\b|</div>', html):
        if m.group(0) == '<div':
            if depth == 0:
                start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append(html[start:m.end()])
    if depth != 0 or ''.join(out) != html:
        return None
    return out


def h2_of(block):
    m = re.match(r'<div class="el-h2"><h2 data-heading="([^"]*)" id="([^"]*)"', block)
    return (H.unescape(m.group(1)), m.group(2)) if m else None


def strip_sections(note):
    blocks = top_blocks(note['html'])
    if blocks is None:
        return False
    keep, dropping, dropped_ids = [], False, set()
    for b in blocks:
        h = h2_of(b)
        if h:
            dropping = h[0].strip().lower() in DROP_H2
            if dropping and SLOT not in keep:
                keep.append(SLOT)
        if dropping:
            m = re.search(r'<h[1-6][^>]* id="([^"]*)"', b)
            if m:
                dropped_ids.add(m.group(1))
            continue
        keep.append(b)
    if len(keep) == len(blocks):
        return False
    note['html'] = ''.join(keep)
    note['headings'] = [h for h in note.get('headings', []) if h.get('id') not in dropped_ids]
    return True


def plain(html):
    t = re.sub(r'<[^>]+>', ' ', html)
    return re.sub(r'\s+', ' ', H.unescape(t)).strip()


def exam_section(papers):
    items = ''.join(
        f'<li><a class="internal-link" data-note="exam/{H.escape(p["id"])}" href="#/exam/{H.escape(p["id"])}">'
        f'{H.escape(p["lecture"])}: {H.escape(p["title"])}</a> <span class="exam-meta">{p["marks"]} marks</span></li>' for p in papers)
    return ('<div class="el-h2"><h2 data-heading="Exam practice" id="exam-practice">Exam practice</h2></div>'
            '<div class="el-p"><p>Exam-style questions answered in full, then marked against a mark scheme. No time limit.</p></div>'
            f'<div class="el-ul"><ul class="exam-links">{items}</ul></div>')


def add_exam_section(note, papers):
    if 'id="exam-practice"' in note['html']:
        return False
    sec = exam_section(papers)
    if SLOT in note['html']:
        note['html'] = note['html'].replace(SLOT, sec, 1).replace(SLOT, '')
        note.setdefault('headings', []).append({'level': 2, 'text': 'Exam practice', 'id': 'exam-practice'})
        return True
    blocks = top_blocks(note['html'])
    if blocks is None:
        note['html'] += sec
    else:
        at = len(blocks)
        for i, b in enumerate(blocks):  # before "Related" if there is one, else at the end
            h = h2_of(b)
            if h and h[0].strip().lower() == 'related':
                at = i
                break
        blocks.insert(at, sec)
        note['html'] = ''.join(blocks)
    note.setdefault('headings', []).append({'level': 2, 'text': 'Exam practice', 'id': 'exam-practice'})
    return True


def diagram_card(a):
    img = 'attachments/' + a['img']
    w, h = a.get('size', [4, 3])
    boxes = ''.join(
        f'<span class="occl-box" style="left:{l["box"][0]}%;top:{l["box"][1]}%;width:{l["box"][2]}%;height:{l["box"][3]}%"><b>{i + 1}</b></span>'
        for i, l in enumerate(a['labels']))
    front = (f'<div class="occl" style="aspect-ratio:{w}/{h};max-width:min(640px,calc(55vh * {w} / {h}))"><img src="{H.escape(img)}" alt="" loading="lazy">{boxes}</div>'
             f'<div class="occl-prompt">{H.escape(a["prompt"])}</div>')
    back = '<ol class="occl-answers">' + ''.join(f'<li>{H.escape(l["answer"])}</li>' for l in a['labels']) + '</ol>'
    cid = hashlib.sha1(('d:' + a['img'] + ':' + a['prompt']).encode()).hexdigest()[:12]
    return {'type': 'qa', 'front': front, 'back': back, 'id': cid, 'note': a['note'], 'diagram': True}


def load_specs(root):
    fl = {}
    for p in sorted(glob.glob(os.path.join(root, 'content', 'flashcards', '*.json'))):
        d = json.load(open(p, encoding='utf-8'))
        fl[d['subject']] = d
    ex = []
    for p in sorted(glob.glob(os.path.join(root, 'content', 'exams', '*.json'))):
        d = json.load(open(p, encoding='utf-8'))
        if isinstance(d, dict) and 'papers' in d:
            ex.append(d)
    return fl, ex


def apply(data, deck, root=ROOT, log=print):
    from build_site import build_tree  # noqa: local import keeps this usable from build_site itself
    fl, exams = load_specs(root)
    notes = data['notes']
    report = {}
    subjects = set(fl) | {e['subject'] for e in exams}
    for subject in sorted(subjects):
        base = None
        for nid, n in notes.items():
            if (n.get('props') or {}).get('type') == 'subject hub' and n['title'] == subject:
                base = nid.rsplit('/', 1)[0] + '/'
                hub = nid
                break
        if not base:
            log(f'curate: no hub for {subject}, skipped')
            continue
        # 1. remove Questions / Test notes and sections
        gone = {nid for nid in notes if nid.startswith(base + 'Questions/') or nid.startswith(base + 'Test/')}
        for nid in gone:
            del notes[nid]
        stripped = sum(strip_sections(n) for nid, n in notes.items() if nid.startswith(base))
        if gone:
            pat = re.compile(r'<a class="internal-link" data-note="(' + '|'.join(re.escape(H.escape(g, quote=True)) for g in gone) + r')"[^>]*>(.*?)</a>', re.S)
            for n in notes.values():
                if any(g in n.get('links', []) for g in gone):
                    n['links'] = [l for l in n['links'] if l not in gone]
                    n['html'] = re.sub(r'<li>\s*' + pat.pattern + r'\s*</li>\n?', '', n['html'])
                    n['html'] = pat.sub(r'\2', n['html'])
        # 2. exam practice links
        papers = [p for e in exams if e['subject'] == subject for p in e['papers']]
        linked = 0
        if papers:
            linked += add_exam_section(notes[hub], papers)
            for p in papers:
                if p['hub'] != hub and p['hub'] in notes:
                    linked += add_exam_section(notes[p['hub']], [p])
        for nid, n in notes.items():
            if nid.startswith(base):
                n['html'] = n['html'].replace(SLOT, '')
                n['text'] = plain(n['html'])
                n['words'] = len(n['text'].split())
        # 3. flashcards
        spec = fl.get(subject)
        dropped = edited = added = 0
        if spec:
            drop = {norm(f) for f in spec.get('drop', [])}
            edits = {norm(k): v for k, v in spec.get('edit', {}).items()}
            sdecks = {d['id'] for d in deck['decks'] if d.get('subject') == subject}
            keep = []
            for c in deck['cards']:
                if c['deck'] in sdecks and not c.get('diagram'):
                    k = norm(c['front'])
                    if k in drop:
                        dropped += 1
                        continue
                    if k in edits:
                        e = edits[k]
                        if any(c.get(f) != v for f, v in e.items()):
                            c.update(e)
                            edited += 1
                keep.append(c)
            deck['cards'] = keep
            have = {c['id'] for c in keep}
            note_deck = {}
            for c in keep:
                if c['deck'] in sdecks:
                    note_deck.setdefault(c['note'], c['deck'])
            hub_deck = {d['hub']: d['id'] for d in deck['decks'] if d.get('subject') == subject and d.get('hub')}
            for a in spec.get('add', []):
                if a.get('type') != 'diagram':
                    continue
                c = diagram_card(a)
                if c['id'] in have:
                    continue
                d = note_deck.get(a['note'])
                if not d:  # topic note with no cards of its own: use its lecture hub's deck
                    folder = a['note'].rsplit('/', 1)[0] + '/'
                    d = next((dk for hk, dk in hub_deck.items() if hk.startswith(folder)), None)
                if not d:
                    log(f'curate: no deck for diagram card in {a["note"]}')
                    continue
                if not os.path.exists(os.path.join(root, 'attachments', a['img'])):
                    log(f'curate: image not in the build: {a["img"]}')
                c['deck'] = d
                deck['cards'].append(c)
                have.add(c['id'])
                added += 1
        report[subject] = dict(notes_removed=len(gone), sections_removed=stripped, exam_links=linked,
                               cards_dropped=dropped, cards_edited=edited, cards_added=added)
    # deck counts, empty decks out
    counts = {}
    for c in deck['cards']:
        counts[c['deck']] = counts.get(c['deck'], 0) + 1
    for d in deck['decks']:
        d['count'] = counts.get(d['id'], 0)
    deck['decks'] = [d for d in deck['decks'] if d['count']]
    data['tree'] = build_tree(sorted([n['path'] for n in notes.values()] + list(data.get('canvases', {}))))
    for s, r in report.items():
        log(f'curate {s}: ' + ', '.join(f'{k.replace("_", " ")} {v}' for k, v in r.items()))
    return {'subjects': [{k: e[k] for k in ('subject', 'module', 'papers')} for e in exams]}


def main():
    import sys
    sys.path.insert(0, HERE)
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=ROOT)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    vp, cp = os.path.join(a.out, 'data', 'vault.json'), os.path.join(a.out, 'data', 'cards.json')
    data = json.load(open(vp, encoding='utf-8'))
    deck = json.load(open(cp, encoding='utf-8'))
    exams = apply(data, deck, a.out)
    if a.dry_run:
        print('dry run: nothing written')
        return
    json.dump(data, open(vp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(deck, open(cp, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(exams, open(os.path.join(a.out, 'data', 'exams.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'{len(data["notes"])} notes, {len(deck["cards"])} flashcards in {len(deck["decks"])} decks, '
          f'{sum(len(s["papers"]) for s in exams["subjects"])} exam papers')


if __name__ == '__main__':
    main()
