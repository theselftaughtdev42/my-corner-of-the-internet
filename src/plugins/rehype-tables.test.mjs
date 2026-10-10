import { describe, expect, it } from 'vitest';
import remarkGfm from 'remark-gfm';
import rehypeTables from './rehype-tables.mjs';
import { render } from './render.test-helper.mjs';

const md = (markdown) => render(markdown, { remark: [remarkGfm], rehype: [rehypeTables] });

describe('rehypeTables', () => {
  it('wraps a table in a box that scrolls and takes focus', async () => {
    const html = await render('| a |\n| - |\n| 1 |', { remark: [remarkGfm], rehype: [rehypeTables, rehypeTables] });
    // Run twice to check it doesn't wrap a table that's already wrapped.
    expect(html.match(/table-scroll/g)).toHaveLength(1);
    expect(html).toMatch(/^<section class="table-scroll" tabindex="0" aria-label="Table 1"><table>/);
  });

  it('gives each box on a page its own name', async () => {
    const html = await md('| a |\n| - |\n| 1 |\n\ntext\n\n| b |\n| - |\n| 2 |');
    expect(html.match(/aria-label="[^"]*"/g)).toEqual(['aria-label="Table 1"', 'aria-label="Table 2"']);
  });

  it('aligns cells with a class instead of the align attribute', async () => {
    const html = await md('| a | b |\n| :-: | -: |\n| 1 | 2 |');
    expect(html).not.toContain('align=');
    for (const cell of ['<th class="align-center">a</th>', '<th class="align-right">b</th>']) {
      expect(html).toContain(cell);
    }
    for (const cell of ['<td class="align-center">1</td>', '<td class="align-right">2</td>']) {
      expect(html).toContain(cell);
    }
  });
});
