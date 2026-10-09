import { describe, expect, it } from 'vitest';
import { byBestMatch, esc, findInList, highlight, pagePath, snippet, terms, type Listed } from './search-match';

describe('terms', () => {
  it('lower-cases the words and trims punctuation from their ends', () => {
    expect(terms('  "Spaced  Repetition!" ')).toEqual(['spaced', 'repetition']);
  });

  it('keeps a leading ~ or /, as in a path', () => {
    expect(terms('~/notes /usr')).toEqual(['~/notes', '/usr']);
  });

  it('drops words that are only punctuation', () => {
    expect(terms('a - b')).toEqual(['a', 'b']);
    expect(terms('')).toEqual([]);
  });
});

describe('esc', () => {
  it('escapes HTML', () => {
    expect(esc(`<a href="x">Tom's & Jerry's</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;Tom&#39;s &amp; Jerry&#39;s&lt;/a&gt;');
  });
});

describe('highlight', () => {
  it('marks every match, whatever its case', () => {
    expect(highlight('Learn to learn', ['learn'])).toBe('<mark>Learn</mark> to <mark>learn</mark>');
  });

  it('escapes the text around and inside the marks', () => {
    expect(highlight('<b> & <i>', ['&'])).toBe('&lt;b&gt; <mark>&amp;</mark> &lt;i&gt;');
  });

  it('treats the words as plain text, not patterns', () => {
    expect(highlight('C++ or C', ['c++'])).toBe('<mark>C++</mark> or C');
  });

  it('escapes the text when there are no words', () => {
    expect(highlight('<x>', [])).toBe('&lt;x&gt;');
  });
});

describe('pagePath', () => {
  const origin = 'https://theselftaughtdev.io';

  it("turns Pagefind's addresses into the list's paths", () => {
    expect(pagePath('/notes/chunk-it-up/index.html', origin)).toBe('/notes/chunk-it-up/');
    expect(pagePath('/notes/chunk-it-up', origin)).toBe('/notes/chunk-it-up/');
    expect(pagePath('https://theselftaughtdev.io/notes/a/', origin)).toBe('/notes/a/');
  });
});

describe('findInList', () => {
  // Weaker matches come first here, so the tests show the results are sorted best first.
  const notes: Listed[] = [
    { url: '/b/', title: 'Binary made easy', description: 'Counting with spaced-out bits', series: 'Intro to CS' },
    { url: '/a/', title: 'Spaced repetition', description: 'Remember more by reviewing', series: 'How We Learn' },
    { url: '/c/', title: 'To uni or not', description: 'A choice', series: '' },
  ];
  const urls = (q: string) => findInList(q, notes).map(h => [h.url, h.score]);

  it('scores the title above the description, and both above the series, best first', () => {
    expect(urls('spaced')).toEqual([['/a/', 10], ['/b/', 4]]);
    expect(urls('learn')).toEqual([['/a/', 3]]);
  });

  it('needs every word to match somewhere', () => {
    expect(urls('spaced remember')).toEqual([['/a/', 14]]);
    expect(urls('spaced nowhere')).toEqual([]);
  });

  it('finds a note in no series by "standalone"', () => {
    expect(urls('standalone')).toEqual([['/c/', 3]]);
  });

  it('finds nothing for no words', () => {
    expect(urls('')).toEqual([]);
  });
});

describe('snippet', () => {
  it('shows the description, marked, when the words are in it', () => {
    expect(snippet('Learn faster', ['learn'], { url: '/a/', score: 1, excerpt: 'other' })).toBe('<mark>Learn</mark> faster');
  });

  it("falls back to Pagefind's excerpt when they aren't", () => {
    expect(snippet('Learn faster', ['binary'], { url: '/a/', score: 1, excerpt: 'in <mark>binary</mark>' })).toBe(
      'in <mark>binary</mark>',
    );
  });

  it('shows the description, escaped, when there is no excerpt', () => {
    expect(snippet('A & B', ['zzz'], { url: '/a/', score: 1 })).toBe('A &amp; B');
  });
});

describe('byBestMatch', () => {
  it('puts the group with the best match first, and keeps the page order otherwise', () => {
    const groups = [
      { name: 'first', best: 0, place: 0 },
      { name: 'second', best: 5, place: 1 },
      { name: 'third', best: 0, place: 2 },
      { name: 'fourth', best: 5, place: 3 },
    ];
    expect([...groups].reverse().sort(byBestMatch).map(g => g.name)).toEqual(['second', 'fourth', 'first', 'third']);
  });
});
