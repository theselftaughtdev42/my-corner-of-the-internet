import { visit } from 'unist-util-visit';

// Wide tables scroll sideways inside their own box instead of widening the page.
// The box can take keyboard focus, so it can be scrolled without a mouse.
export default function rehypeTables() {
  return tree => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if (parent.type === 'element' && parent.properties.className?.includes('table-scroll')) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table' },
        children: [node],
      };
    });
  };
}
