import { describe, expect, it } from 'vitest';
import rehypeAbbr from './rehype-abbr.mjs';
import { render } from './render.test-helper.mjs';

const md = markdown => render(markdown, { rehype: [rehypeAbbr] });

describe('rehypeAbbr', () => {
  it('wraps each abbreviation with its meaning', async () => {
    expect(await md('An API and an LLM.')).toBe(
      '<p>An <abbr title="Application Programming Interface">API</abbr> and an <abbr title="Large Language Model">LLM</abbr>.</p>',
    );
  });

  it('prefers the longest match', async () => {
    expect(await md('LLMs')).toBe('<p><abbr title="Large Language Models">LLMs</abbr></p>');
  });

  it('matches whole words only', async () => {
    expect(await md('CSSX, API-first and RAFT stay as they are.')).toBe('<p>CSSX, API-first and RAFT stay as they are.</p>');
  });

  it('leaves code alone', async () => {
    expect(await md('`SQL` and\n\n```\nSQL\n```')).toBe('<p><code>SQL</code> and</p>\n<pre><code>SQL\n</code></pre>');
  });
});
