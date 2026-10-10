import { visit } from 'unist-util-visit';

// Wide tables scroll sideways inside their own box instead of widening the page.
// The box can take keyboard focus, so it can be scrolled without a mouse, and is named "Table 1", "Table 2"...
// so each box on a page has its own name.
// Cells aligned in the Markdown get a class (align-left, align-center or align-right) in place of the obsolete
// align attribute.
export default function rehypeTables() {
  return (tree) => {
    let count = 0;
    visit(tree, 'element', (node, index, parent) => {
      if ((node.tagName === 'th' || node.tagName === 'td') && node.properties.align) {
        node.properties.className = [...(node.properties.className ?? []), `align-${node.properties.align}`];
        delete node.properties.align;
      }
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if (parent.type === 'element' && parent.properties.className?.includes('table-scroll')) return;
      count += 1;
      parent.children[index] = {
        type: 'element',
        tagName: 'section',
        properties: { className: ['table-scroll'], tabIndex: 0, ariaLabel: `Table ${count}` },
        children: [node],
      };
    });
  };
}
