import { describe, expect, it, vi } from 'vitest';
import { jsonFeed, rssFeed } from './feeds';

vi.mock('astro:content', () => {
  const note = (id: string, created: string, updated?: string, series?: string) => ({
    id,
    collection: 'notes',
    data: {
      title: `Title of ${id}`,
      description: `About ${id}`,
      date: { created: new Date(created), updated: updated ? new Date(updated) : undefined },
      series,
      part: series ? 1 : undefined,
      tags: ['learning'],
      draft: false,
    },
  });
  const notes = [
    note('old-but-edited', '2024-01-01', '2024-09-01'),
    note('newest', '2024-06-01'),
    note('learn/one', '2024-03-01', undefined, 'Learning'),
  ];
  return { getCollection: async () => notes };
});

const site = new URL('https://theselftaughtdev.io');

describe('jsonFeed', () => {
  it('lists notes by the date they were added', async () => {
    const feed = await (await jsonFeed(site, 'created')).json();
    expect(feed.feed_url).toBe('https://theselftaughtdev.io/feed_json_created.json');
    expect(feed.items.map((i: { id: string }) => i.id)).toEqual([
      'https://theselftaughtdev.io/notes/newest/',
      'https://theselftaughtdev.io/notes/learn/one/',
      'https://theselftaughtdev.io/notes/old-but-edited/',
    ]);
  });

  it('lists notes by the date they last changed', async () => {
    const res = await jsonFeed(site, 'updated');
    expect(res.headers.get('Content-Type')).toBe('application/feed+json; charset=utf-8');
    const feed = await res.json();
    expect(feed.items.map((i: { url: string }) => i.url)).toEqual([
      'https://theselftaughtdev.io/notes/old-but-edited/',
      'https://theselftaughtdev.io/notes/newest/',
      'https://theselftaughtdev.io/notes/learn/one/',
    ]);
  });

  it("points each item at its note's card and dates", async () => {
    const feed = await (await jsonFeed(site, 'updated')).json();
    expect(feed.items[0]).toMatchObject({
      title: 'Title of old-but-edited',
      summary: 'About old-but-edited',
      image: 'https://theselftaughtdev.io/og/notes/old-but-edited.png',
      date_published: '2024-01-01T00:00:00.000Z',
      date_modified: '2024-09-01T00:00:00.000Z',
      tags: ['learning'],
    });
    expect(feed.items[1].image).toBe('https://theselftaughtdev.io/og/notes/newest.png');
  });
});

describe('rssFeed', () => {
  it('lists notes in feed order, linking to itself', async () => {
    const xml = await (await rssFeed(site, 'updated')).text();
    expect(xml).toContain('<atom:link href="https://theselftaughtdev.io/feed_rss_updated.xml" rel="self"');
    const links = [...xml.matchAll(/<item>.*?<link>(.*?)<\/link>/g)].map(m => m[1]);
    expect(links).toEqual([
      'https://theselftaughtdev.io/notes/old-but-edited/',
      'https://theselftaughtdev.io/notes/newest/',
      'https://theselftaughtdev.io/notes/learn/one/',
    ]);
  });

  it("files a series note under its series", async () => {
    const xml = await (await rssFeed(site, 'created')).text();
    expect(xml).toMatch(/<link>https:\/\/theselftaughtdev\.io\/notes\/learn\/one\/<\/link>.*<category>Learning<\/category>/);
  });
});
