# Biomedicine Vault, on the web

An Obsidian-style reader for the Biomedicine Vault: file explorer, tabs, reading view with callouts and embeds, backlinks, outline, local and global graph view (cell, helix or free layout), canvases, full-text search and a quick switcher (Ctrl/Cmd+O).

Also here:

- **Flashcards** (`#/flashcards`): every question and key term in the vault as spaced-repetition cards, with XP, levels, streaks, badges, a 60-second sprint and an evolving specimen. Progress lives in the browser; export/import moves it between devices.
- **Book library** (`#/books`): searches the private textbook engine set in `site.config.json`, and every Alberts quote or figure in the notes links to its book page.

The old flashcard app lives at `legacy/index.html`.

## Rebuild after changing the vault

```
pip install markdown-it-py mdit-py-plugins beautifulsoup4 pyyaml
python3 tools/build_site.py --vault "/path/to/Biomedicine Vault" --out .
```

This rewrites `data/vault.json`, `data/cards.json`, `attachments/` and `assets/neural.css`, then deploy with `npx wrangler deploy`. The `03 Personal` folder is never published.
