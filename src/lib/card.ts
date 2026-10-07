// Social cards: the 1200×630 pictures that link previews show. Charcoal ground, off-white type, and the
// orange kept for the brandmark and the current series bar, as on the site (light text on orange fails
// contrast, so the cards no longer use an orange ground).
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

// Satori's ES module build reads __dirname, which ES modules don't have, so load its CommonJS build.
const satori: typeof import('satori').default = createRequire(import.meta.url)('satori').default;

const W = 1200;
const H = 630;
const BG = '#1F2128';
const FG = '#F4F4F4';
const MUTED = '#A3A6B0';
const BAR = '#4B4E58';
const ORANGE = '#FF7F29';

export type Card = {
  /** The big line: a note's title, or a page's name. */
  title: string;
  /** One quiet line at the bottom: a series and part, a date, or the tagline. */
  footer?: string;
  /** For a note in a series: how many notes, and which one this is (1-based). */
  bars?: { count: number; current: number };
  /** Home shows the full logo instead of a title. */
  logo?: boolean;
};

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

const svgData = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const MARK = svgData(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 333.69 333.7"><polygon fill="${ORANGE}" points="158.45 244.66 158.45 333.7 0 333.7 0 175.23 89.01 175.23 89.01 244.66 158.45 244.66"/><polygon fill="${FG}" points="0 0 333.69 0 333.69 333.69 223.8 333.69 223.8 109.88 0 109.88 0 0"/></svg>`,
);

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 700; style: 'normal' }[]> | undefined;
function loadFonts() {
  const file = (weight: number) =>
    fs.readFile(path.join(process.cwd(), `node_modules/@fontsource/poppins/files/poppins-latin-${weight}-normal.woff`));
  fonts ??= Promise.all([file(400), file(700)]).then(([regular, bold]) => [
    { name: 'Poppins', data: regular, weight: 400 as const, style: 'normal' as const },
    { name: 'Poppins', data: bold, weight: 700 as const, style: 'normal' as const },
  ]);
  return fonts;
}

let logo: Promise<string> | undefined;
function loadLogo() {
  logo ??= fs
    .readFile(path.join(process.cwd(), 'public/assets/logo_light.svg'), 'utf8')
    .then(svg => svgData(svg.replace(/fill:\s*#1f2128/i, `fill: ${FG}`)));
  return logo;
}

export async function renderCard(card: Card) {
  const size = card.title.length > 44 ? 60 : 68;
  const bars = card.bars
    ? h(
        'div',
        { display: 'flex', marginRight: 28 },
        Array.from({ length: card.bars.count }, (_, i) =>
          h('div', { width: 44, height: 6, borderRadius: 3, marginRight: i < card.bars!.count - 1 ? 8 : 0, background: i + 1 === card.bars!.current ? ORANGE : BAR }),
        ),
      )
    : null;

  const body = card.logo
    ? h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }, [
        h('img', { width: 700, height: 122.5 }, undefined, { src: await loadLogo(), width: 700, height: 122.5 }),
        h('div', { marginTop: 44, fontSize: 40, color: FG }, card.footer),
      ])
    : h('div', { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }, [
        h('div', { display: 'flex', alignItems: 'center' }, [
          h('img', { width: 52, height: 52 }, undefined, { src: MARK, width: 52, height: 52 }),
          h('div', { marginLeft: 20, fontSize: 28, fontWeight: 700, color: FG }, 'The Self-Taught Dev'),
        ]),
        h(
          'div',
          { display: 'flex', fontSize: size, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: FG, maxWidth: 1000 },
          card.title,
        ),
        h('div', { display: 'flex', alignItems: 'center', fontSize: 28, color: MUTED, minHeight: 42 }, [bars, card.footer ?? ''].filter(Boolean)),
      ]);

  const svg = await satori(h('div', { display: 'flex', width: W, height: H, padding: 72, background: BG, fontFamily: 'Poppins' }, [body]) as never, {
    width: W,
    height: H,
    fonts: await loadFonts(),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
}
