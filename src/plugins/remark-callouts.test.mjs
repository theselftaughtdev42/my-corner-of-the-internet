import { describe, expect, it } from 'vitest';
import remarkCallouts from './remark-callouts.mjs';
import { render } from './render.test-helper.mjs';

const md = (markdown) => render(markdown, { remark: [remarkCallouts] });

describe('remarkCallouts', () => {
  it('turns a callout into an aside with its default title', async () => {
    expect(await md(':::tip\nRead slowly.\n:::')).toBe(
      '<aside class="callout callout-tip"><p class="callout-title">Tip</p><p>Read slowly.</p></aside>',
    );
  });

  it('uses the label as the title', async () => {
    expect(await md(':::warning[Mind the *gap*]\nCareful.\n:::')).toBe(
      '<aside class="callout callout-warning"><p class="callout-title">Mind the <em>gap</em></p><p>Careful.</p></aside>',
    );
  });

  it('fails on an unknown callout', async () => {
    await expect(md(':::shout\nHey.\n:::')).rejects.toThrow(
      'Unknown callout ":::shout". Use one of: note, info, tip, question, warning, danger.',
    );
  });

  it('puts colons in running text back as written', async () => {
    expect(await md('Meet at 10:30 or at the:station[north] entrance.')).toBe(
      '<p>Meet at 10:30 or at the:station[north] entrance.</p>',
    );
  });

  it('puts a leaf directive back as a paragraph', async () => {
    expect(await md('::thing')).toBe('<p>::thing</p>');
  });
});
