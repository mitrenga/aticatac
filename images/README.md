# images/

**Dočasně** (2026-11-08): `app-icon.svg` a PNG sada jsou zástupná ikona —
obecná ikona dema svision (`svision-tutorial/demos/demo/atari8`), ne grafika
jiné hry. Vlastní ikonu z grafiky originálu dostane projekt v M7.

**Prázdné až na tenhle soubor.** Ikony aplikace, favicon a poster patří do
**M7** a vyrábějí se nástroji ze svision, ne ručně:

- `app/svision/tools/make-app-icons` — `app-icon.svg` → PNG sady
  (192, 256, 512, 1024, 1980)
- `app/svision/tools/make-favicon` — `favicon.ico`

Předlohou má být **grafika z originálu** (`data/sprites.json` z M2 — rytíř,
čaroděj, nevolník, pergamen panelu), ne obrázek stažený odjinud.
`poster.png` a `cover.png` odkazuje `index.php` a `aboutPage.php`.

★ **Ikony jiné hry sem nekopírovat**, a proto tu `favicon.ico` zatím
**vůbec není**: převzatý favicon sourozence by byl obrázek cizí hry, což je
horší než žádný. Do M7 se prohlížeči nevrátí nic a je to v pořádku.
