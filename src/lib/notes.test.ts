import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface Fake {
  id: string;
  created: string;
  updated?: string;
  series?: string;
  part?: number;
  draft?: boolean;
}

let entries: Fake[] = [];

vi.mock('astro:content', () => ({
  getCollection: async (_name: string, filter?: (n: unknown) => boolean) => {
    const notes = entries.map(e => ({
      id: e.id,
      collection: 'notes',
      data: {
        title: e.id,
        description: `About ${e.id}`,
        date: { created: new Date(e.created), updated: e.updated ? new Date(e.updated) : undefined },
        series: e.series,
        part: e.part,
        tags: [],
        draft: e.draft ?? false,
      },
    }));
    return filter ? notes.filter(filter) : notes;
  },
}));

// getLibrary keeps its first result, so each test loads the module afresh.
async function library(notes: Fake[]) {
  entries = notes;
  vi.resetModules();
  const mod = await import('./notes');
  return { ...mod, lib: await mod.getLibrary() };
}

beforeEach(() => vi.stubEnv('DEV', false));
afterEach(() => vi.unstubAllEnvs());

describe('helpers', async () => {
  const { isoDate, dayText, plural, noteUrl, seriesUrl, seriesAdded } = await import('./notes');

  it('formats dates in UTC', () => {
    const date = new Date('2024-06-04T23:30:00Z');
    expect(isoDate(date)).toBe('2024-06-04');
    expect(dayText(date)).toBe('4 Jun 2024');
  });

  it('pluralises', () => {
    expect(plural(1, 'note')).toBe('1 note');
    expect(plural(0, 'note')).toBe('0 notes');
    expect(plural(3, 'note')).toBe('3 notes');
  });

  it('builds addresses', () => {
    expect(noteUrl({ id: 'how-we-learn/chunk-it-up' } as never)).toBe('/notes/how-we-learn/chunk-it-up/');
    expect(seriesUrl({ slug: 'how-we-learn', name: 'How We Learn', notes: [] })).toBe('/notes/how-we-learn/');
  });

  it('dates a series by its newest note', () => {
    const note = (created: string) => ({ data: { date: { created: new Date(created) } } }) as never;
    const series = { slug: 's', name: 'S', notes: [note('2024-01-01'), note('2024-03-01'), note('2024-02-01')] };
    expect(isoDate(seriesAdded(series))).toBe('2024-03-01');
  });
});

describe('getLibrary', () => {
  it('sorts notes newest first and groups series in reading order', async () => {
    const { lib } = await library([
      { id: 'alone', created: '2024-02-01' },
      { id: 'learn/two', created: '2024-05-01', series: 'Learning', part: 2 },
      { id: 'learn/one', created: '2024-04-01', series: 'Learning', part: 1 },
      { id: 'cs/one', created: '2024-01-01', series: 'CS', part: 1 },
    ]);
    expect(lib.notes.map(n => n.id)).toEqual(['learn/two', 'learn/one', 'alone', 'cs/one']);
    expect(lib.standalone.map(n => n.id)).toEqual(['alone']);
    // Series come in the order they began.
    expect(lib.series.map(s => [s.slug, s.name, s.notes.map(n => n.id)])).toEqual([
      ['cs', 'CS', ['cs/one']],
      ['learn', 'Learning', ['learn/one', 'learn/two']],
    ]);
  });

  it('leaves drafts out of the built site', async () => {
    const { lib } = await library([
      { id: 'live', created: '2024-01-01' },
      { id: 'draft', created: '2024-01-02', draft: true },
    ]);
    expect(lib.notes.map(n => n.id)).toEqual(['live']);
  });

  it('shows drafts while developing', async () => {
    vi.stubEnv('DEV', true);
    const { lib } = await library([
      { id: 'live', created: '2024-01-01' },
      { id: 'draft', created: '2024-01-02', draft: true },
    ]);
    expect(lib.notes.map(n => n.id)).toEqual(['draft', 'live']);
  });

  it('reads the notes once', async () => {
    const { getLibrary, lib } = await library([{ id: 'first', created: '2024-01-01' }]);
    entries = [{ id: 'later', created: '2024-01-02' }];
    expect(await getLibrary()).toBe(lib);
  });

  it('finds the series a note is in', async () => {
    const { lib, seriesOf } = await library([
      { id: 'alone', created: '2024-01-01' },
      { id: 'learn/one', created: '2024-01-02', series: 'Learning', part: 1 },
    ]);
    expect(seriesOf(lib, lib.notes.find(n => n.id === 'learn/one')!)?.slug).toBe('learn');
    expect(seriesOf(lib, lib.notes.find(n => n.id === 'alone')!)).toBeUndefined();
  });

  it.each<[string, Fake[], RegExp]>([
    ['a series note outside a folder', [{ id: 'one', created: '2024-01-01', series: 'S', part: 1 }], /belongs in that series' folder/],
    ['a note in a folder with no series', [{ id: 'learn/one', created: '2024-01-01' }], /needs "series" and "part"/],
    [
      'two series in one folder',
      [
        { id: 'learn/one', created: '2024-01-01', series: 'A', part: 1 },
        { id: 'learn/two', created: '2024-01-02', series: 'B', part: 1 },
      ],
      /the learn\/ folder holds "B", not "A"/,
    ],
    [
      'one series split across folders',
      [
        { id: 'a/one', created: '2024-01-01', series: 'S', part: 1 },
        { id: 'b/two', created: '2024-01-02', series: 'S', part: 2 },
      ],
      /split across folders/,
    ],
    [
      'a gap in the parts',
      [
        { id: 's/one', created: '2024-01-01', series: 'S', part: 1 },
        { id: 's/three', created: '2024-01-02', series: 'S', part: 3 },
      ],
      /needs parts 1 to 2.*s\/three is part 3/,
    ],
    [
      'a repeated part',
      [
        { id: 's/one', created: '2024-01-01', series: 'S', part: 1 },
        { id: 's/also-one', created: '2024-01-02', series: 'S', part: 1 },
      ],
      /needs parts 1 to 2/,
    ],
    [
      'a note and a series at one address',
      [
        { id: 'learn', created: '2024-01-01' },
        { id: 'learn/one', created: '2024-01-02', series: 'S', part: 1 },
      ],
      /share the address \/notes\/learn\//,
    ],
  ])('rejects %s', async (_, notes, message) => {
    await expect(library(notes)).rejects.toThrow(message);
  });
});
