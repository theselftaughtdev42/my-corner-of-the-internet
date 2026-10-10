import { visit } from 'unist-util-visit';

// Callout boxes, written as container directives:
//
//   :::tip[Optional title]
//   Text of the callout.
//   :::
//
// Each becomes <div class="callout callout-tip" role="note"> with its title on the first line. Not an <aside>:
// that is a landmark, and a page with several callouts would have several landmarks with no name.
const TITLES = {
  note: 'Note',
  info: 'Info',
  tip: 'Tip',
  question: 'Question',
  warning: 'Warning',
  danger: 'Danger',
};

export default function remarkCallouts() {
  return (tree, file) => {
    visit(tree, (node, index, parent) => {
      if (node.type === 'containerDirective') {
        if (!(node.name in TITLES)) {
          file.fail(`Unknown callout ":::${node.name}". Use one of: ${Object.keys(TITLES).join(', ')}.`, node);
        }
        const first = node.children[0];
        const labelled = first && first.type === 'paragraph' && first.data && first.data.directiveLabel;
        const title = labelled ? first.children : [{ type: 'text', value: TITLES[node.name] }];
        const body = labelled ? node.children.slice(1) : node.children;
        node.data = { hName: 'div', hProperties: { className: ['callout', `callout-${node.name}`], role: 'note' } };
        node.children = [
          { type: 'paragraph', data: { hProperties: { className: ['callout-title'] } }, children: title },
          ...body,
        ];
        return;
      }
      // A colon in running text (":name") parses as a text directive too. Put those back as text.
      if ((node.type === 'textDirective' || node.type === 'leafDirective') && parent && index !== undefined) {
        const marker = node.type === 'textDirective' ? ':' : '::';
        const text = { type: 'text', value: marker + node.name };
        const label = node.children.length
          ? [{ type: 'text', value: '[' }, ...node.children, { type: 'text', value: ']' }]
          : [];
        const replacement =
          node.type === 'textDirective' ? [text, ...label] : [{ type: 'paragraph', children: [text, ...label] }];
        parent.children.splice(index, 1, ...replacement);
        return index + replacement.length;
      }
    });
  };
}
