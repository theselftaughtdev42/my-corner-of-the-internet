import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Markdown to HTML through only the given plugins (and directives), to test each plugin on its own. It
// isn't the site's whole pipeline: that's in astro.config.mjs.
export async function render(markdown, { remark = [], rehype = [] } = {}) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remark)
    .use(remarkRehype)
    .use(rehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
