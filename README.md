# Biomedicine Vault, on the web

An Obsidian-style reader for the Biomedicine Vault: file explorer, tabs, reading view with callouts and embeds, backlinks, outline, local and global graph view, canvases, full-text search and a quick switcher (Ctrl/Cmd+O).

The old flashcard app lives at `legacy/index.html`.

## Rebuild after changing the vault

```
pip install markdown-it-py mdit-py-plugins beautifulsoup4 pyyaml
python3 tools/build_site.py --vault "/path/to/Biomedicine Vault" --out .
```

This rewrites `data/vault.json`, `attachments/` and `assets/neural.css`. The `03 Personal` folder is never published.
