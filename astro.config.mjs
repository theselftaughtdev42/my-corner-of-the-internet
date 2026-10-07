// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeExternalLinks from 'rehype-external-links';
import remarkCallouts from './src/plugins/remark-callouts.mjs';
import rehypeFigures from './src/plugins/rehype-figures.mjs';
import rehypeTables from './src/plugins/rehype-tables.mjs';
import rehypeAbbr from './src/plugins/rehype-abbr.mjs';
import { redirects } from './src/redirects.mjs';

export default defineConfig({
  site: 'https://theselftaughtdev.io',
  trailingSlash: 'always',
  redirects,
  markdown: {
    processor: unified({
      // Quotes and dashes stay as written, as they were on the MkDocs site.
      smartypants: false,
      remarkPlugins: [remarkDirective, remarkCallouts, remarkMath],
      rehypePlugins: [
        // MathML needs no stylesheet or fonts: browsers draw it themselves.
        [rehypeKatex, { output: 'mathml' }],
        rehypeFigures,
        rehypeTables,
        rehypeAbbr,
        [
          rehypeExternalLinks,
          {
            target: '_blank',
            rel: ['noopener'],
            properties: { className: ['ext'] },
            // Said to screen readers, but kept out of the search index.
            content: {
              type: 'element',
              tagName: 'span',
              properties: { className: ['vh'], dataPagefindIgnore: '' },
              children: [{ type: 'text', value: ' (opens in a new tab)' }],
            },
            // A picture's link to its own full-size file opens in the picture viewer instead.
            test: el => !String(el.properties.className ?? '').includes('fig-frame'),
          },
        ],
      ],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
