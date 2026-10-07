import rss from '@astrojs/rss';
import { getLibrary, noteUrl, type Note } from './notes';
import { SITE } from './site';

// The feeds keep the MkDocs site's addresses, so existing subscriptions carry on:
// /feed_rss_created.xml and /feed_json_created.json list notes by the date they were added,
// /feed_rss_updated.xml and /feed_json_updated.json by the date they last changed.
export type FeedOrder = 'created' | 'updated';

const changed = (n: Note) => n.data.date.updated ?? n.data.date.created;
const dateOf = (n: Note, order: FeedOrder) => (order === 'created' ? n.data.date.created : changed(n));

async function notesFor(order: FeedOrder) {
  const { notes } = await getLibrary();
  return [...notes].sort((a, b) => dateOf(b, order).getTime() - dateOf(a, order).getTime());
}

const cardFor = (n: Note) => `/og${noteUrl(n)}`.replace(/\/$/, '.png');

export async function rssFeed(site: URL, order: FeedOrder) {
  const notes = await notesFor(order);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>en</language><atom:link href="${new URL(`/feed_rss_${order}.xml`, site)}" rel="self" type="application/rss+xml" />`,
    items: notes.map(n => ({
      title: n.data.title,
      description: n.data.description,
      link: noteUrl(n),
      pubDate: dateOf(n, order),
      author: SITE.author,
      categories: n.data.series ? [n.data.series] : undefined,
    })),
  });
}

export async function jsonFeed(site: URL, order: FeedOrder) {
  const notes = await notesFor(order);
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.name,
    description: SITE.description,
    home_page_url: new URL('/', site).href,
    feed_url: new URL(`/feed_json_${order}.json`, site).href,
    language: 'en',
    authors: [{ name: SITE.author }],
    items: notes.map(n => ({
      id: new URL(noteUrl(n), site).href,
      url: new URL(noteUrl(n), site).href,
      title: n.data.title,
      summary: n.data.description,
      content_text: n.data.description,
      image: new URL(cardFor(n), site).href,
      date_published: n.data.date.created.toISOString(),
      date_modified: changed(n).toISOString(),
      tags: n.data.tags,
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), { headers: { 'Content-Type': 'application/feed+json; charset=utf-8' } });
}
