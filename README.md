# Biomedicine Vault, on the web

An Obsidian-style reader for the Biomedicine Vault: file explorer, tabs, reading view with callouts and embeds, backlinks, outline, local and global graph view (cell, helix or free layout), canvases, full-text search and a quick switcher (Ctrl/Cmd+O).

Also here:

- **Flashcards** (`#/flashcards`): every question and key term in the vault as spaced-repetition cards, with XP, levels, streaks, badges, a 60-second sprint and an evolving specimen. Skip any card, undo the last rating, choose any section or topic to study first, and give a plan's sections a high, normal or low priority. Progress lives in the browser and, once signed in, syncs between devices; export/import also moves it.
- **Book library** (`#/books`): searches the private textbook engine set in `site.config.json`, and every Alberts quote or figure in the notes links to its book page.

The old flashcard app lives at `legacy/index.html`.

## On a phone

On a touch screen of phone size the site uses its own layout (`assets/phone.css`, `assets/phone.js`, everything under `body.is-phone`): a bottom bar for the main sections, one column, full-screen flashcards with swipes (right Good, left Again, up Skip). The graph and the neural map are desktop only. Desktop windows never get this layout, however narrow.

Add the site to the home screen to install it (`manifest.webmanifest`). `sw.js` keeps an offline copy; the network always comes first, so a normal deploy reaches the installed app with nothing to bump, and the PIN still shows whenever the server can be reached. With no connection the saved copy opens without the PIN. Mail, calendar and `/api/` calls are never saved. Flashcard progress and lecture ticks made offline sync when the connection is back.

## 3D free graph

In **Graph view → Graph settings → Free**, choose **3D brain**. Cell, Helix and the local graph remain unchanged; the Free graph remembers your 2D/3D preference. The 3D network uses the actual notes and links, with spatial forces inside a soft, two-hemisphere brain-like envelope. Search, groups, orphan visibility and display/force settings still apply.

Drag to orbit, right-drag or Shift-drag to pan, and scroll to zoom. Click the map to activate keyboard controls: **WASD** pans, **Q/E** moves vertically, **arrow keys** orbit, **+/−** zooms, and **Shift** speeds up travel. Click a note to select it, double-click it or choose **Focus** to fly to its neighbourhood, and use **Open note** or **Enter** to read it. **Home** resets the camera; **Escape** deselects. On touch screens, one finger orbits and two fingers pan/pinch. The **Controls** button shows these shortcuts; **Auto orbit** can be turned off. Reduced-motion preferences disable auto orbit and momentum.

## Rebuild after changing the vault

```
pip install markdown-it-py mdit-py-plugins beautifulsoup4 pyyaml
python3 tools/build_site.py --vault "/path/to/Biomedicine Vault" --out .
```

This rewrites `data/vault.json`, `data/cards.json`, `attachments/` and `assets/neural.css`, then deploy with `npx wrangler deploy`. The `03 Personal` folder is never published.
