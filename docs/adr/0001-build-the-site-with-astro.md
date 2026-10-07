# Build the site with Astro

The site moved from MkDocs with the Material theme to Astro in October 2026, with the redesign
("6 Search"): a search-first Home, one Notes section in place of the Blog and the Wiki, and quiet reading
pages. That design replaces almost everything Material draws (header, navigation, home, lists, note page,
search), so building it on Material would have meant overriding the theme rather than using it. Material
had also gone into maintenance mode (fixes only), with its team moving to Zensical, which didn't yet have
the blog, RSS or social card plugins the site used.

Astro was chosen over Hugo and Docusaurus. Docusaurus is a docs framework with its own layout, the same
problem as Material. Hugo would have worked, but its templates are awkward for custom UI and its front
matter isn't type-checked. In Astro the mockup's HTML and CSS became components almost as they were, every
note's front matter is checked by a schema, pages ship no JavaScript except the search box's, and search
comes from Pagefind.

## Consequences

- Notes are Markdown with Astro-specific bits: `:::` callouts (remark-directive) instead of `!!!`
  admonitions, a `book` field instead of a snippet include, and `series` plus `part` for notes in a series.
- Old Blog and Wiki addresses redirect to the new Notes addresses (`src/redirects.mjs`), with a
  `<meta http-equiv="refresh">` page each, since GitHub Pages can't send real redirects.
- The feeds and the sitemap keep their old addresses.
- The build needs Node instead of Python and uv.
