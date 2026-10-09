import fs from 'node:fs/promises';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import { imageMetadata, inferRemoteSize } from 'astro/assets/utils';

// A picture on a line of its own becomes a figure. Its Markdown title, if it has one, is the
// caption:  ![Alt text](https://…/graph.svg "The Forgetting Curve")
// Diagrams (.svg) sit on a plain plate so they read in dark mode too; other pictures fill the column.
// Each picture links to its full-size file, which the page opens in a viewer when scripts run.
// Each picture also gets its width and height, so the text below it doesn't jump as it loads.
export default function rehypeFigures() {
  return async (tree) => {
    const imgs = [];
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;
      const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      if (kids.length !== 1 || kids[0].type !== 'element' || kids[0].tagName !== 'img') return;
      const img = kids[0];
      const src = String(img.properties.src || '');
      const caption = img.properties.title ? String(img.properties.title) : '';
      delete img.properties.title;
      img.properties.loading = 'lazy';
      img.properties.decoding = 'async';
      imgs.push(img);
      const kind = isSvg(src) ? 'diagram' : 'picture';
      const alt = String(img.properties.alt || '');
      const link = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: src,
          className: ['fig-frame'],
          ...(alt ? {} : { ariaLabel: 'Open the picture full size' }),
        },
        children: [img],
      };
      const children = [link];
      if (caption)
        children.push({
          type: 'element',
          tagName: 'figcaption',
          properties: {},
          children: [{ type: 'text', value: caption }],
        });
      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['fig', `fig-${kind}`] },
        children,
      };
    });
    await Promise.all(
      imgs.map(async (img) => {
        const size = await sizeOf(String(img.properties.src));
        if (size) Object.assign(img.properties, size);
      }),
    );
  };
}

const isSvg = (src) => /\.svg(\?|#|$)/i.test(src);
const sizes = new Map();

// A picture that can't be measured (offline, say) still shows; it just doesn't hold its space.
function sizeOf(src) {
  if (!sizes.has(src)) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), 20_000).unref());
    sizes.set(
      src,
      Promise.race([measure(src), timeout]).catch((err) => {
        console.warn(`[figures] Couldn't measure ${src}: ${err.message}`);
        return null;
      }),
    );
  }
  return sizes.get(src);
}

async function measure(src) {
  const remote = /^https?:/i.test(src);
  if (remote && !isSvg(src)) {
    const { width, height } = await inferRemoteSize(src);
    return { width, height };
  }
  let data;
  if (remote) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = new Uint8Array(await res.arrayBuffer());
  } else {
    data = await fs.readFile(path.join(process.cwd(), 'public', decodeURI(src.split(/[?#]/)[0])));
  }
  if (isSvg(src)) return svgSize(new TextDecoder().decode(data));
  const { width, height } = await imageMetadata(data, src);
  return { width, height };
}

// Diagrams drawn in draw.io carry the whole drawing in one long attribute, which the general image
// reader gives up on, so a diagram's size is read from its <svg> tag: width and height, or else viewBox.
function svgSize(svg) {
  const tag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const attr = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const px = (v) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? Math.round(parseFloat(v)) : undefined);
  let width = px(attr('width'));
  let height = px(attr('height'));
  if (!width || !height) {
    const box = (attr('viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (box.length === 4 && box[2] > 0 && box[3] > 0) [width, height] = [Math.round(box[2]), Math.round(box[3])];
  }
  if (!width || !height) throw new Error('no width, height or viewBox on its <svg> tag');
  return { width, height };
}
