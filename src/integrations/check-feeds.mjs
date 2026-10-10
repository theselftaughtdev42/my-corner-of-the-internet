import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { SyntaxValidator } from 'fast-xml-validator';

// Fails the build when the sitemap or a feed is malformed, or lists an address that isn't a built page.
// Astro hands over the pages it built, so each address is checked against those, not guessed at in dist/.
// The sitemap must also list every page, so a new page can't be left out of it, and none of the files can go missing.
export default function checkFeeds() {
  let site;
  return {
    name: 'check-feeds',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = config.site;
      },
      'astro:build:done': ({ pages, dir }) => {
        const root = fileURLToPath(dir);
        const files = Object.fromEntries(
          FEEDS.map((name) => [
            name,
            existsSync(`${root}/${name}`) ? readFileSync(`${root}/${name}`, 'utf8') : undefined,
          ]),
        );
        const problems = findProblems({
          site,
          pages: pages.map((p) => p.pathname),
          files,
          fileExists: (path) => existsSync(`${root}/${path}`),
        });
        if (problems.length) {
          throw new Error(`The sitemap and feeds don't match the built pages:\n- ${problems.join('\n- ')}`);
        }
      },
    },
  };
}

// The sitemap and the feeds, at the MkDocs site's addresses (see docs/adr/0001-build-the-site-with-astro.md).
const FEEDS = [
  'sitemap.xml',
  'feed_rss_created.xml',
  'feed_rss_updated.xml',
  'feed_json_created.json',
  'feed_json_updated.json',
];

const xml = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  isArray: (name) => name === 'url' || name === 'item',
});

/**
 * Everything wrong with the sitemap and the feeds, as one sentence each.
 * @param {object} input
 * @param {string} input.site The site's address, such as https://example.com/
 * @param {string[]} input.pages The built pages' paths, such as 'notes/a/', with '' for the home page
 * @param {Record<string, string | undefined>} input.files The sitemap and the feeds, by file name, undefined if not built
 * @param {(path: string) => boolean} input.fileExists Whether a file such as 'og/a.png' was built
 * @returns {string[]}
 */
export function findProblems({ site, pages, files, fileExists }) {
  const built = new Set(pages);
  // The path of a page on this site, or undefined for an address elsewhere.
  const pathOf = (address) => {
    const url = new URL(address, site);
    return url.origin === new URL(site).origin ? url.pathname.slice(1) : undefined;
  };
  const isPage = (address) => built.has(pathOf(address));

  return Object.entries(files).flatMap(([name, text]) => {
    if (text === undefined) return [`${name} wasn't built`];
    if (name === 'sitemap.xml') return sitemapProblems(name, text, pages, pathOf, isPage);
    if (name.endsWith('.xml')) return rssProblems(name, text, isPage);
    return jsonFeedProblems(name, text, isPage, (address) => fileExists(pathOf(address) ?? ''));
  });
}

function parseXml(name, text) {
  try {
    SyntaxValidator.validate(text);
  } catch (error) {
    return { problem: `${name} isn't valid XML: ${error.message} (line ${error.line})` };
  }
  return { doc: xml.parse(text) };
}

function sitemapProblems(name, text, pages, pathOf, isPage) {
  const { doc, problem } = parseXml(name, text);
  if (problem) return [problem];
  if (!doc.urlset) return [`${name} isn't a sitemap: it has no <urlset>`];
  const locs = (doc.urlset.url ?? []).map((u) => u.loc);
  const listed = new Set(locs.map(pathOf));
  return [
    ...locs.filter((loc) => !isPage(loc)).map((loc) => `${name} lists ${loc}, which isn't a page`),
    ...pages.filter((p) => p !== '404/' && !listed.has(p)).map((p) => `${name} doesn't list the page /${p}`),
  ];
}

// RSS 2.0 requires a channel title, link and description, and a title or description on each item.
// A link isn't required by RSS, but every item here is a page, so it must have one.
function rssProblems(name, text, isPage) {
  const { doc, problem } = parseXml(name, text);
  if (problem) return [problem];
  const channel = doc.rss?.channel;
  if (!channel) return [`${name} isn't an RSS feed: it has no <rss><channel>`];
  return [
    ...['title', 'link', 'description']
      .filter((field) => !channel[field])
      .map((field) => `${name}'s channel has no <${field}>`),
    ...(channel.item ?? []).flatMap((item, i) => {
      const problems = [];
      if (!item.title && !item.description)
        problems.push(`${name} item ${i + 1} has neither a <title> nor a <description>`);
      if (!item.link) problems.push(`${name} item ${i + 1} has no <link>`);
      else if (!isPage(item.link)) problems.push(`${name} links to ${item.link}, which isn't a page`);
      return problems;
    }),
  ];
}

// JSON Feed 1.1 requires a version, a title and items, and an id and some content on each item.
function jsonFeedProblems(name, text, isPage, fileExists) {
  let feed;
  try {
    feed = JSON.parse(text);
  } catch (error) {
    return [`${name} isn't valid JSON: ${error.message}`];
  }
  const problems = [];
  if (feed.version !== 'https://jsonfeed.org/version/1.1')
    problems.push(`${name}'s version isn't https://jsonfeed.org/version/1.1`);
  if (!feed.title) problems.push(`${name} has no title`);
  if (!Array.isArray(feed.items)) return [...problems, `${name} has no items`];
  feed.items.forEach((item, i) => {
    if (!item.id) problems.push(`${name} item ${i + 1} has no id`);
    if (!item.content_html && !item.content_text)
      problems.push(`${name} item ${i + 1} has neither content_html nor content_text`);
    if (item.url && !isPage(item.url)) problems.push(`${name} links to ${item.url}, which isn't a page`);
    if (item.image && !fileExists(item.image)) problems.push(`${name}'s image ${item.image} doesn't exist`);
  });
  return problems;
}
