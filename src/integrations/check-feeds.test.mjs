import { describe, expect, it } from 'vitest';
import { findProblems } from './check-feeds.mjs';

const site = 'https://example.com/';
const pages = ['', 'notes/', 'notes/a/', 'about/', '404/'];

const sitemap = (paths) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths
    .map((p) => `<url><loc>${site}${p}</loc></url>`)
    .join('')}</urlset>`;

const rss = (links) =>
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>T</title><link>${site}</link><description>D</description>${links
    .map((l) => `<item><title>A</title><link>${l}</link></item>`)
    .join('')}</channel></rss>`;

const jsonFeed = (items) => JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'T', items });

const item = (path) => ({
  id: `${site}${path}`,
  url: `${site}${path}`,
  content_text: 'A',
  image: `${site}og/${path.replace(/\/$/, '.png')}`,
});

const valid = () => ({
  site,
  pages,
  files: {
    'sitemap.xml': sitemap(['', 'notes/', 'notes/a/', 'about/']),
    'feed.xml': rss([`${site}notes/a/`]),
    'feed.json': jsonFeed([item('notes/a/')]),
  },
  fileExists: (path) => path === 'og/notes/a.png',
});

describe('findProblems', () => {
  it('passes a sitemap and feeds that match the built pages', () => {
    expect(findProblems(valid())).toEqual([]);
  });

  it('names each file that was not built', () => {
    const input = valid();
    input.files['sitemap.xml'] = undefined;
    input.files['feed.json'] = undefined;
    expect(findProblems(input)).toEqual(["sitemap.xml wasn't built", "feed.json wasn't built"]);
  });

  describe('the sitemap', () => {
    it('must parse', () => {
      const input = valid();
      input.files['sitemap.xml'] = '<urlset><url><loc>x</url></urlset>';
      expect(findProblems(input)).toEqual([expect.stringMatching(/^sitemap\.xml isn't valid XML: /)]);
    });

    it('must be a URL set', () => {
      const input = valid();
      input.files['sitemap.xml'] = '<rss></rss>';
      expect(findProblems(input)).toEqual(["sitemap.xml isn't a sitemap: it has no <urlset>"]);
    });

    it('must only list pages that were built', () => {
      const input = valid();
      input.files['sitemap.xml'] = sitemap(['', 'notes/', 'notes/a/', 'about/', 'notes/draft/']);
      expect(findProblems(input)).toEqual([`sitemap.xml lists ${site}notes/draft/, which isn't a page`]);
    });

    it('must list every page but the 404 page', () => {
      const input = valid();
      input.files['sitemap.xml'] = sitemap(['', 'notes/', 'about/']);
      expect(findProblems(input)).toEqual(["sitemap.xml doesn't list the page /notes/a/"]);
    });
  });

  describe('the RSS feeds', () => {
    it('must parse', () => {
      const input = valid();
      input.files['feed.xml'] = '<rss><channel></rss>';
      expect(findProblems(input)).toEqual([expect.stringMatching(/^feed\.xml isn't valid XML: /)]);
    });

    it('must have the channel elements RSS requires', () => {
      const input = valid();
      input.files['feed.xml'] = '<rss version="2.0"><channel><title>T</title></channel></rss>';
      expect(findProblems(input)).toEqual([
        "feed.xml's channel has no <link>",
        "feed.xml's channel has no <description>",
      ]);
    });

    it('must give every item a title or description, and a link', () => {
      const input = valid();
      input.files['feed.xml'] = rss([]).replace('</channel>', '<item><guid>x</guid></item></channel>');
      expect(findProblems(input)).toEqual([
        'feed.xml item 1 has neither a <title> nor a <description>',
        'feed.xml item 1 has no <link>',
      ]);
    });

    it('must only link to pages that were built', () => {
      const input = valid();
      input.files['feed.xml'] = rss([`${site}notes/a/`, `${site}notes/gone/`]);
      expect(findProblems(input)).toEqual([`feed.xml links to ${site}notes/gone/, which isn't a page`]);
    });

    it('must only link to pages on this site', () => {
      const input = valid();
      input.files['feed.xml'] = rss(['https://elsewhere.com/notes/a/']);
      expect(findProblems(input)).toEqual(["feed.xml links to https://elsewhere.com/notes/a/, which isn't a page"]);
    });
  });

  describe('the JSON feeds', () => {
    it('must parse', () => {
      const input = valid();
      input.files['feed.json'] = '{"version":';
      expect(findProblems(input)).toEqual([expect.stringMatching(/^feed\.json isn't valid JSON: /)]);
    });

    it('must have the fields JSON Feed 1.1 requires', () => {
      const input = valid();
      input.files['feed.json'] = JSON.stringify({ version: 'https://jsonfeed.org/version/1' });
      expect(findProblems(input)).toEqual([
        "feed.json's version isn't https://jsonfeed.org/version/1.1",
        'feed.json has no title',
        'feed.json has no items',
      ]);
    });

    it('must give every item an id and some content', () => {
      const input = valid();
      input.files['feed.json'] = jsonFeed([{ url: `${site}notes/a/` }]);
      expect(findProblems(input)).toEqual([
        'feed.json item 1 has no id',
        'feed.json item 1 has neither content_html nor content_text',
      ]);
    });

    it('must only link to pages and images that were built', () => {
      const input = valid();
      input.files['feed.json'] = jsonFeed([item('notes/a/'), item('notes/gone/')]);
      expect(findProblems(input)).toEqual([
        `feed.json links to ${site}notes/gone/, which isn't a page`,
        `feed.json's image ${site}og/notes/gone.png doesn't exist`,
      ]);
    });
  });
});
