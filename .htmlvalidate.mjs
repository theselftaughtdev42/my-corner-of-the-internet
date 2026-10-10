import { defineConfig } from 'html-validate';

// Checks every built page with the recommended rules. A rule is only switched off with its reason.
export default defineConfig({
  extends: ['html-validate:recommended'],
  rules: {
    // Astro writes its redirect pages with a lowercase <!doctype html>. Either case is valid HTML.
    'doctype-style': 'off',
    // A page's title is the note's title and the site's name. Length is advice for search results, not invalid
    // markup.
    'long-title': 'off',
  },
});
