import { describe, expect, it } from 'vitest';
import remarkGfm from 'remark-gfm';
import rehypeTables from './rehype-tables.mjs';
import { render } from './render.test-helper.mjs';

describe('rehypeTables', () => {
  it('wraps a table in a box that scrolls and takes focus', async () => {
    const html = await render('| a |\n| - |\n| 1 |', { remark: [remarkGfm], rehype: [rehypeTables, rehypeTables] });
    // Run twice to check it doesn't wrap a table that's already wrapped.
    expect(html.match(/table-scroll/g)).toHaveLength(1);
    expect(html).toMatch(/^<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>/);
  });
});
