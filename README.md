# Biomedicine Vault, on the web

An Obsidian-style reader for the Biomedicine Vault: file explorer, tabs, reading view with callouts and embeds, backlinks, outline, local and global graph view (cell, helix or free layout), canvases, full-text search and a quick switcher (Ctrl/Cmd+O).

Also here:

- **Flashcards** (`#/flashcards`): every question and key term in the vault as spaced-repetition cards, with XP, levels, streaks, badges, a 60-second sprint and an evolving specimen. Progress lives in the browser; export/import moves it between devices.
- **Book library** (`#/books`): searches the private textbook engine set in `site.config.json`, and every Alberts quote or figure in the notes links to its book page.

The old flashcard app lives at `legacy/index.html`.

## 3D free graph

In **Graph view → Graph settings → Free**, choose **3D brain**. Cell, Helix and the local graph remain unchanged; the Free graph remembers your 2D/3D preference. The 3D network uses the actual notes and links, with spatial forces inside a soft, two-hemisphere brain-like envelope. Search, groups, orphan visibility and display/force settings still apply.

Drag to orbit, right-drag or Shift-drag to pan, and scroll to zoom. Click the map to activate keyboard controls: **WASD** pans, **Q/E** moves vertically, **arrow keys** orbit, **+/−** zooms, and **Shift** speeds up travel. Click a note to select it, double-click it or choose **Focus** to fly to its neighbourhood, and use **Open note** or **Enter** to read it. **Home** resets the camera; **Escape** deselects. On touch screens, one finger orbits and two fingers pan/pinch. The **Controls** button shows these shortcuts; **Auto orbit** can be turned off. Reduced-motion preferences disable auto orbit and momentum.

## Rebuild after changing the vault

```
pip install markdown-it-py mdit-py-plugins beautifulsoup4 pyyaml
python3 tools/build_site.py --vault "/path/to/Biomedicine Vault" --out .
```

This rewrites `data/vault.json`, `data/cards.json`, `attachments/` and `assets/neural.css`, then deploy with `npx wrangler deploy`. The `03 Personal` folder is never published.
