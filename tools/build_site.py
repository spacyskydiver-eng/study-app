#!/usr/bin/env python3
"""Build the Obsidian-style study site from the Biomedicine Vault.

Usage:
    python3 tools/build_site.py --vault "/path/to/Biomedicine Vault" --out .

Reads every note, canvas and attachment in the vault, renders it the way
Obsidian's reading view does (callouts, wikilinks, embeds, properties,
cssclasses), and writes a static single-page site:

    index.html            app shell
    assets/app.css        Obsidian-like layout
    assets/neural.css     copied from the vault's CSS snippet
    assets/app.js         the app (explorer, notes, graph, canvas, search)
    data/vault.json       every rendered note, canvas and the link graph
    attachments/...       images used by the included notes

Folders listed in --exclude (default: "03 Personal") are left out entirely,
and links pointing into them render as plain text.
"""
import argparse
import html
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone

import yaml
from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
from mdit_py_plugins.tasklists import tasklists_plugin
from mdit_py_plugins.footnote import footnote_plugin

IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp'}
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

md = (MarkdownIt('commonmark', {'html': True, 'linkify': False, 'typographer': False, 'breaks': True})
      .enable('table').enable('strikethrough')
      .use(tasklists_plugin, enabled=True)
      .use(footnote_plugin))

ICONS = {
    'note': 'pencil', 'abstract': 'clipboard-list', 'summary': 'clipboard-list', 'info': 'info', 'todo': 'check-circle',
    'tip': 'flame', 'hint': 'flame', 'important': 'flame', 'success': 'check', 'check': 'check', 'done': 'check',
    'question': 'help-circle', 'help': 'help-circle', 'faq': 'help-circle', 'warning': 'alert-triangle',
    'caution': 'alert-triangle', 'attention': 'alert-triangle', 'failure': 'x', 'fail': 'x', 'missing': 'x',
    'danger': 'zap', 'error': 'zap', 'bug': 'bug', 'example': 'list', 'quote': 'quote', 'cite': 'quote',
    'definition': 'book-open', 'figure': 'image', 'path': 'map', 'key': 'key',
}


def slug(s):
    s = re.sub(r'[^\w\s-]', '', s.lower(), flags=re.U).strip()
    return re.sub(r'[\s_]+', '-', s)


class Vault:
    def __init__(self, root, exclude):
        self.root = root
        self.exclude = [e.strip('/') for e in exclude]
        self.notes = {}       # id (path without .md) -> dict
        self.canvases = {}    # path -> raw json
        self.files = {}       # relpath -> abspath (attachments)
        self.by_name = {}     # lower basename -> [relpath]
        self.used_files = set()
        self.hidden = set()   # lower basenames of excluded notes, so links to them can be dropped
        self.scan()

    def excluded(self, rel):
        return any(rel == e or rel.startswith(e + '/') for e in self.exclude)

    def scan(self):
        for dp, dn, fn in os.walk(self.root):
            rel_dir = os.path.relpath(dp, self.root).replace(os.sep, '/')
            if rel_dir == '.':
                rel_dir = ''
            if self.excluded(rel_dir):
                self.hidden.update(os.path.splitext(f)[0].lower() for f in fn)
                dn[:] = [d for d in dn if not d.startswith('.')]
                continue
            dn[:] = [d for d in dn if not d.startswith('.')]
            for f in fn:
                if f.startswith('.'):
                    continue
                rel = (rel_dir + '/' + f).strip('/')
                if self.excluded(rel):
                    continue
                ext = os.path.splitext(f)[1].lower()
                self.by_name.setdefault(f.lower(), []).append(rel)
                if ext == '.md':
                    self.by_name.setdefault(f[:-3].lower(), []).append(rel)
                    self.notes[rel[:-3]] = {'path': rel}
                elif ext == '.canvas':
                    self.by_name.setdefault(f[:-7].lower(), []).append(rel)
                    self.canvases[rel] = None
                else:
                    self.files[rel] = os.path.join(dp, f)
        # Obsidian "shortest path" resolution: prefer the shallowest match
        for k in self.by_name:
            self.by_name[k].sort(key=lambda p: (p.count('/'), p))

    def resolve(self, target):
        """Resolve a wikilink target to a vault relpath (with extension) or None."""
        t = target.strip().replace('\\', '/')
        if not t:
            return None
        cands = []
        low = t.lower()
        if '/' in t:
            for ext in ('', '.md', '.canvas'):
                p = t + ext
                if p in self.notes or p[:-3] in self.notes and p.endswith('.md') or p in self.canvases or p in self.files:
                    return p
            low = os.path.basename(t).lower()
        cands = self.by_name.get(low) or self.by_name.get(low + '.md') or []
        return cands[0] if cands else None


def split_frontmatter(text):
    if text.startswith('---'):
        m = re.match(r'^---\s*\n(.*?)\n---\s*(\n|$)', text, re.S)
        if m:
            try:
                fm = yaml.safe_load(m.group(1)) or {}
            except Exception:
                fm = {}
            return (fm if isinstance(fm, dict) else {}), text[m.end():]
    return {}, text


class Renderer:
    def __init__(self, vault):
        self.v = vault
        self.placeholders = {}

    # ---------------- wikilinks and embeds ----------------
    def link_html(self, target, alias, src_links):
        target_part, _, heading = target.partition('#')
        rel = self.v.resolve(target_part) if target_part else None
        label = alias if alias is not None else (target_part + (' › ' + heading if heading else '') if target_part else heading)
        label = html.escape(label)
        if target_part == '' and heading:
            return f'<a class="internal-link" data-heading="{html.escape(slug(heading))}" href="#{html.escape(slug(heading))}">{label}</a>'
        if rel is None:
            if os.path.basename(target_part).lower() in self.v.hidden:
                return f'<span class="excluded-link">{label}</span>'
            return f'<span class="internal-link is-unresolved">{label}</span>'
        if rel.endswith('.md'):
            nid = rel[:-3]
            src_links.add(nid)
            frag = f' data-heading="{html.escape(slug(heading))}"' if heading else ''
            return f'<a class="internal-link" data-note="{html.escape(nid)}"{frag} href="#/{html.escape(nid)}">{label}</a>'
        if rel.endswith('.canvas'):
            src_links.add(rel)
            return f'<a class="internal-link" data-note="{html.escape(rel)}" href="#/{html.escape(rel)}">{label}</a>'
        self.v.used_files.add(rel)
        return f'<a class="internal-link" href="attachments/{html.escape(rel)}" target="_blank">{label}</a>'

    def embed_html(self, target, alias, src_links):
        target_part, _, heading = target.partition('#')
        rel = self.v.resolve(target_part)
        if rel is None:
            return f'<span class="internal-embed is-unresolved">{html.escape(target_part)}</span>'
        ext = os.path.splitext(rel)[1].lower()
        if ext in IMAGE_EXT:
            self.v.used_files.add(rel)
            w = ''
            if alias and re.fullmatch(r'\d+(x\d+)?', alias.strip()):
                w = f' width="{alias.split("x")[0]}"'
                alias = None
            alt = html.escape(alias or os.path.basename(rel))
            return f'<span class="internal-embed media-embed image-embed"><img src="attachments/{html.escape(rel)}" alt="{alt}" loading="lazy"{w}></span>'
        if ext == '.canvas':
            src_links.add(rel)
            return f'<div class="internal-embed canvas-embed" data-canvas="{html.escape(rel)}"></div>'
        if ext == '.md':
            nid = rel[:-3]
            src_links.add(nid)
            return f'<div class="internal-embed markdown-embed" data-embed="{html.escape(nid)}"></div>'
        self.v.used_files.add(rel)
        return f'<a class="internal-link" href="attachments/{html.escape(rel)}" target="_blank">{html.escape(os.path.basename(rel))}</a>'

    def wikilinks(self, text, src_links):
        def emb(m):
            inner = m.group(1).replace('\\|', '|')
            t, _, a = inner.partition('|')
            return self.embed_html(t, a if _ else None, src_links)

        def lnk(m):
            inner = m.group(1).replace('\\|', '|')
            t, _, a = inner.partition('|')
            return self.link_html(t, a if _ else None, src_links)
        text = re.sub(r'!\[\[([^\]\n]+?)\]\]', emb, text)
        text = re.sub(r'\[\[([^\]\n]+?)\]\]', lnk, text)
        text = re.sub(r'(?<![=\w])==([^=\n]+)==(?!=)', r'<mark>\1</mark>', text)
        return text

    # ---------------- callouts ----------------
    def callouts(self, text, src_links):
        lines = text.split('\n')
        out, i = [], 0
        while i < len(lines):
            line = lines[i]
            if re.match(r'^\s{0,3}>', line):
                block = []
                while i < len(lines) and re.match(r'^\s{0,3}>', lines[i]):
                    block.append(re.sub(r'^\s{0,3}> ?', '', lines[i], count=1))
                    i += 1
                m = re.match(r'^\[!([\w-]+)\]([+-]?)\s*(.*)$', block[0]) if block else None
                if m:
                    ctype, fold, title = m.group(1).lower(), m.group(2), m.group(3)
                    inner = '\n'.join(block[1:])
                    content_html = self.render_md(inner, src_links) if inner.strip() else ''
                    title_html = md.renderInline(self.wikilinks(title, src_links)) if title else html.escape(ctype.capitalize())
                    key = f'CALLOUTPH{len(self.placeholders)}X'
                    icon = ICONS.get(ctype, 'pencil')
                    fold_attr = f' data-callout-fold="{fold}"' if fold else ''
                    collapsed = ' is-collapsed' if fold == '-' else ''
                    fold_html = '<div class="callout-fold"><svg class="svg-icon" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></div>' if fold else ''
                    self.placeholders[key] = (
                        f'<div class="callout{collapsed}" data-callout="{html.escape(ctype)}"{fold_attr}>'
                        f'<div class="callout-title"><div class="callout-icon" data-icon="{icon}"></div>'
                        f'<div class="callout-title-inner">{title_html}</div>{fold_html}</div>'
                        + (f'<div class="callout-content">{content_html}</div>' if content_html else '') + '</div>')
                    out += ['', key, '']
                else:
                    out += ['> ' + b for b in block]
                continue
            out.append(line)
            i += 1
        return '\n'.join(out)

    def render_md(self, text, src_links):
        text = self.callouts(text, src_links)
        text = self.wikilinks(text, src_links)
        h = md.render(text)
        for _ in range(3):
            if 'CALLOUTPH' not in h:
                break
            h = re.sub(r'<p>(CALLOUTPH\d+X)</p>', lambda m: self.placeholders[m.group(1)], h)
            h = re.sub(r'CALLOUTPH\d+X', lambda m: self.placeholders.get(m.group(0), ''), h)
        return h

    def note(self, nid):
        rel = self.v.notes[nid]['path']
        raw = open(os.path.join(self.v.root, rel), encoding='utf-8').read()
        fm, body = split_frontmatter(raw)
        links = set()
        h = self.render_md(body, links)
        soup = BeautifulSoup(h, 'html.parser')
        # drop blocks that only point at excluded (private) notes, then any heading left empty
        for sp in soup.find_all('span', class_='excluded-link'):
            top = sp
            while top.parent is not None and top.parent is not soup:
                top = top.parent
            if top.parent is soup and not top.find('a', class_='internal-link'):
                top.decompose()
            elif sp.parent is not None:
                sp.unwrap()
        tops = [c for c in soup.contents if not isinstance(c, str)]
        for i, c in enumerate(tops):
            if re.match('^h[1-6]$', c.name or ''):
                nxt = tops[i + 1] if i + 1 < len(tops) else None
                if nxt is None or (re.match('^h[1-6]$', nxt.name or '') and int(nxt.name[1]) <= int(c.name[1])) or nxt.name == 'hr' and (i + 2 >= len(tops) or re.match('^h[1-6]$', tops[i + 2].name or '')):
                    c.decompose()
        headings = []
        used_ids = set()
        for tag in soup.find_all(re.compile('^h[1-6]$')):
            text = tag.get_text().strip()
            tag['data-heading'] = text
            i = slug(text) or 'h'
            base, n = i, 2
            while i in used_ids:
                i = f'{base}-{n}'; n += 1
            used_ids.add(i)
            tag['id'] = i
            headings.append({'level': int(tag.name[1]), 'text': text, 'id': i})
        for a in soup.find_all('a', href=True):
            if a['href'].startswith(('http://', 'https://')):
                a['class'] = a.get('class', []) + ['external-link']
                a['target'] = '_blank'
                a['rel'] = 'noopener'
        # wrap each top-level block in a div, as Obsidian's reading view does
        wrapped = []
        for child in list(soup.contents):
            if isinstance(child, str):
                if child.strip():
                    wrapped.append(f'<div><p>{html.escape(child)}</p></div>')
                continue
            cls = f'el-{child.name}'
            wrapped.append(f'<div class="{cls}">{child}</div>')
        text = soup.get_text(' ')
        text = re.sub(r'\s+', ' ', text).strip()
        css = fm.get('cssclasses') or fm.get('cssclass') or []
        if isinstance(css, str):
            css = [c.strip() for c in css.replace(',', ' ').split()]
        title = os.path.basename(nid)
        props = {k: v for k, v in fm.items() if k not in ('cssclasses', 'cssclass')}
        return {
            'path': rel, 'title': title, 'display': str(fm.get('title') or title),
            'css': css, 'props': json.loads(json.dumps(props, default=str)),
            'html': ''.join(wrapped), 'links': sorted(links), 'headings': headings,
            'text': text[:20000], 'words': len(text.split()),
            'mtime': int(os.path.getmtime(os.path.join(self.v.root, rel))),
        }

    def canvas(self, rel):
        try:
            data = json.load(open(os.path.join(self.v.root, rel), encoding='utf-8'))
        except Exception:
            return {'nodes': [], 'edges': [], 'links': []}
        links = set()
        nodes = []
        for n in data.get('nodes', []):
            n = dict(n)
            if n.get('type') == 'text':
                n['html'] = self.render_md(n.get('text', ''), links)
                n.pop('text', None)
            elif n.get('type') == 'file':
                f = self.v.resolve(n.get('file', '')) if n.get('file') else None
                if f and os.path.splitext(f)[1].lower() in IMAGE_EXT:
                    self.v.used_files.add(f); n['image'] = 'attachments/' + f
                elif f and f.endswith('.md'):
                    links.add(f[:-3]); n['note'] = f[:-3]
                elif f and f.endswith('.canvas'):
                    links.add(f); n['note'] = f
            elif n.get('type') == 'group' and n.get('background'):
                f = self.v.resolve(n['background'])
                if f:
                    self.v.used_files.add(f); n['background'] = 'attachments/' + f
                else:
                    n.pop('background')
            nodes.append(n)
        return {'nodes': nodes, 'edges': data.get('edges', []), 'links': sorted(links)}


def build_tree(paths):
    tree = {}
    for p in paths:
        parts = p.split('/')
        node = tree
        for part in parts[:-1]:
            node = node.setdefault(part, {})
        node.setdefault('__files__', []).append(p)
    return tree


def graph_settings(vault_root):
    try:
        g = json.load(open(os.path.join(vault_root, '.obsidian', 'graph.json')))
    except Exception:
        g = {}
    groups = []
    for cg in g.get('colorGroups', []):
        rgb = cg.get('color', {}).get('rgb', 0x9AA6D8)
        groups.append({'query': cg.get('query', ''), 'color': '#%06x' % rgb})
    return {
        'search': g.get('search', ''), 'groups': groups,
        'center': g.get('centerStrength', 0.5), 'repel': g.get('repelStrength', 10),
        'linkStrength': g.get('linkStrength', 1), 'linkDistance': g.get('linkDistance', 250),
        'nodeSize': g.get('nodeSizeMultiplier', 1), 'lineSize': g.get('lineSizeMultiplier', 1),
        'textFade': g.get('textFadeMultiplier', 0), 'showOrphans': g.get('showOrphans', True),
        'hideUnresolved': g.get('hideUnresolved', True),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vault', required=True)
    ap.add_argument('--out', default=ROOT)
    ap.add_argument('--exclude', action='append', default=None,
                    help='vault folder to leave out (repeatable). Default: "03 Personal"')
    ap.add_argument('--title', default='Biomedicine Vault')
    a = ap.parse_args()
    exclude = a.exclude if a.exclude is not None else ['03 Personal']
    v = Vault(a.vault, exclude)
    r = Renderer(v)
    notes = {}
    for nid in sorted(v.notes):
        try:
            notes[nid] = r.note(nid)
        except Exception as e:
            print('failed to render', nid, e, file=sys.stderr)
    canvases = {rel: r.canvas(rel) for rel in sorted(v.canvases)}
    # attachments
    out_att = os.path.join(a.out, 'attachments')
    if os.path.isdir(out_att):
        shutil.rmtree(out_att)
    for rel in sorted(v.used_files):
        src = v.files.get(rel)
        if not src:
            continue
        dst = os.path.join(out_att, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
    # neural.css from the vault
    os.makedirs(os.path.join(a.out, 'assets'), exist_ok=True)
    snippet_dir = os.path.join(a.vault, '.obsidian', 'snippets')
    css = ''
    try:
        appearance = json.load(open(os.path.join(a.vault, '.obsidian', 'appearance.json')))
        for name in appearance.get('enabledCssSnippets', []):
            p = os.path.join(snippet_dir, name + '.css')
            if os.path.exists(p):
                css += open(p, encoding='utf-8').read() + '\n'
    except Exception:
        pass
    if css:
        open(os.path.join(a.out, 'assets', 'neural.css'), 'w', encoding='utf-8').write(css)
    try:
        bookmarks = json.load(open(os.path.join(a.vault, '.obsidian', 'bookmarks.json'))).get('items', [])
    except Exception:
        bookmarks = []
    bookmarks = [b for b in bookmarks if b.get('path') and not v.excluded(b['path'])]
    data = {
        'title': a.title,
        'built': datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),
        'notes': notes, 'canvases': canvases,
        'tree': build_tree(sorted([n['path'] for n in notes.values()] + list(canvases))),
        'graph': graph_settings(a.vault), 'bookmarks': bookmarks,
        'home': 'Home' if 'Home' in notes else (sorted(notes)[0] if notes else ''),
    }
    os.makedirs(os.path.join(a.out, 'data'), exist_ok=True)
    with open(os.path.join(a.out, 'data', 'vault.json'), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    n_links = sum(len(n['links']) for n in notes.values())
    print(f'{len(notes)} notes, {len(canvases)} canvases, {len(v.used_files)} attachments, {n_links} links')


if __name__ == '__main__':
    main()
