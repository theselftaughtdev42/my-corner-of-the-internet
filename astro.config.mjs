// @ts-check
import { defineConfig } from 'astro/config';
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
          content: { type: 'element', tagName: 'span', properties: { className: ['vh'] }, children: [{ type: 'text', value: ' (opens in a new tab)' }] },
        },
      ],
    ],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
