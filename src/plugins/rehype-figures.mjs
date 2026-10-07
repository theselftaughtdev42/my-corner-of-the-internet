import { visit } from 'unist-util-visit';

// A picture on a line of its own becomes a figure. Its Markdown title, if it has one, is the
// caption:  ![Alt text](https://…/graph.svg "The Forgetting Curve")
// Diagrams (.svg) sit on a plain plate so they read in dark mode too; other pictures fill the column.
// Each picture links to its full-size file, which the page opens in a viewer when scripts run.
export default function rehypeFigures() {
  return tree => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || !parent || index === undefined) return;
      const kids = node.children.filter(c => !(c.type === 'text' && !c.value.trim()));
      if (kids.length !== 1 || kids[0].type !== 'element' || kids[0].tagName !== 'img') return;
      const img = kids[0];
      const src = String(img.properties.src || '');
      const caption = img.properties.title ? String(img.properties.title) : '';
      delete img.properties.title;
      img.properties.loading = 'lazy';
      img.properties.decoding = 'async';
      const kind = /\.svg(\?|#|$)/i.test(src) ? 'diagram' : 'picture';
      const alt = String(img.properties.alt || '');
      const link = {
        type: 'element',
        tagName: 'a',
        properties: { href: src, className: ['fig-frame'], ...(alt ? {} : { ariaLabel: 'Open the picture full size' }) },
        children: [img],
      };
      const children = [link];
      if (caption) children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] });
      parent.children[index] = { type: 'element', tagName: 'figure', properties: { className: ['fig', `fig-${kind}`] }, children };
    });
  };
}
