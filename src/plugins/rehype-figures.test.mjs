import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import rehypeFigures from './rehype-figures.mjs';
import { render } from './render.test-helper.mjs';

vi.mock('astro/assets/utils', () => ({
  inferRemoteSize: async () => ({ width: 640, height: 480 }),
  imageMetadata: async () => ({ width: 1, height: 1 }),
}));

// Measured sizes are kept per address, so each test uses its own.
let n = 0;
const url = ext => `https://example.com/${++n}.${ext}`;

const svgs = new Map();
const serve = (src, svg) => (svgs.set(src, svg), src);

beforeEach(() => {
  vi.stubGlobal('fetch', async src => (svgs.has(src) ? new Response(svgs.get(src)) : new Response('', { status: 404 })));
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const md = markdown => render(markdown, { rehype: [rehypeFigures] });

describe('rehypeFigures', () => {
  it('makes a picture on its own line a figure, captioned by its title', async () => {
    const src = url('png');
    expect(await md(`![A cat](${src} "My cat")`)).toBe(
      `<figure class="fig fig-picture"><a href="${src}" class="fig-frame">` +
        `<img src="${src}" alt="A cat" loading="lazy" decoding="async" width="640" height="480"></a>` +
        '<figcaption>My cat</figcaption></figure>',
    );
  });

  it('labels the link of a picture with no alt text', async () => {
    expect(await md(`![](${url('png')})`)).toContain('aria-label="Open the picture full size"');
  });

  it('leaves a picture inside running text alone', async () => {
    const src = url('png');
    expect(await md(`See ![x](${src}) here.`)).toBe(`<p>See <img src="${src}" alt="x"> here.</p>`);
  });

  it('sizes a diagram from its width and height', async () => {
    const src = serve(url('svg'), '<svg width="300px" height="150" viewBox="0 0 10 10"></svg>');
    const html = await md(`![Flow](${src})`);
    expect(html).toContain('class="fig fig-diagram"');
    expect(html).toContain('width="300" height="150"');
  });

  it('sizes a diagram from its viewBox when it has no plain width and height', async () => {
    const src = serve(url('svg'), '<svg width="100%" viewBox="0 0 805.33 140.97" content="…"></svg>');
    expect(await md(`![Flow](${src})`)).toContain('width="805" height="141"');
  });

  it('still shows a picture it cannot measure', async () => {
    const src = url('svg');
    const html = await md(`![Gone](${src})`);
    expect(html).toBe(
      `<figure class="fig fig-diagram"><a href="${src}" class="fig-frame"><img src="${src}" alt="Gone" loading="lazy" decoding="async"></a></figure>`,
    );
    expect(console.warn).toHaveBeenCalledWith(`[figures] Couldn't measure ${src}: HTTP 404`);
  });

  it('warns about a diagram with no size', async () => {
    const src = serve(url('svg'), '<svg></svg>');
    await md(`![Flow](${src})`);
    expect(console.warn).toHaveBeenCalledWith(`[figures] Couldn't measure ${src}: no width, height or viewBox on its <svg> tag`);
  });
});
