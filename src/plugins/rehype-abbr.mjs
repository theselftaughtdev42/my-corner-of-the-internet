import { visit, SKIP } from 'unist-util-visit';
import { abbreviations } from '../data/abbreviations.mjs';

// Wraps each abbreviation from src/data/abbreviations.mjs in <abbr title="…">, as whole words only,
// outside code.
const SKIP_TAGS = new Set(['code', 'pre', 'abbr', 'script', 'style', 'svg', 'math']);
const words = Object.keys(abbreviations).sort((a, b) => b.length - a.length);
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pattern = new RegExp(`(?<![\\w-])(${words.map(escape).join('|')})(?![\\w-])`, 'g');

export default function rehypeAbbr() {
  return tree => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'element' && SKIP_TAGS.has(node.tagName)) return SKIP;
      if (node.type !== 'text' || !parent || index === undefined) return;
      const parts = node.value.split(pattern);
      if (parts.length === 1) return;
      const out = parts
        .map((part, i) => (i % 2
          ? { type: 'element', tagName: 'abbr', properties: { title: abbreviations[part] }, children: [{ type: 'text', value: part }] }
          : { type: 'text', value: part }))
        .filter(n => n.type !== 'text' || n.value);
      parent.children.splice(index, 1, ...out);
      return index + out.length;
    });
  };
}
