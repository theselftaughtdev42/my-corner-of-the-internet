# My Corner of the Internet
This is the source code for my [website](https://www.theselftaughtdev.io).

It's built with [Astro](https://astro.build) and hosted on GitHub Pages 🚀

## Running it
You need Node 22 (see `.nvmrc`).

```sh
npm install
npm run dev       # live preview at http://localhost:4321 (drafts show here; search covers titles only)
npm run build     # type-check, build into dist/ and index the notes for search
npm run preview   # serve dist/, with full-text search
npm test          # unit tests
npm run lint      # ESLint (lint:fix to fix what it can)
npm run format    # Prettier (format:check only checks)
```

A pre-commit hook lints and formats the files you've staged.

## Writing a note
Copy `templates/note.md` into `src/content/notes/`. A note in a series goes in the series' folder
(`src/content/notes/how-we-learn/`) with `series` and `part` in its front matter; a new series gets a new
folder, whose name becomes its address (`/notes/how-we-learn/`). The build checks every
note's front matter, so a typo fails the build instead of quietly dropping a note.

- Callout boxes: `:::tip[Optional title]` … `:::` (also `note`, `info`, `question`, `warning`, `danger`).
- Pictures: `![Alt text](https://… "Optional caption")` on a line of its own.
- Maths: `$…$`.
- Abbreviations in `src/data/abbreviations.mjs` get tooltips wherever they appear.

## Publishing
Every push to `main` builds the site and publishes it to the `gh-pages` branch, which GitHub Pages serves.
Pull requests run the lint, format check, unit tests and build as checks.
