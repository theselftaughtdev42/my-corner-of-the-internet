// The parts of Home's search that don't touch the page: reading the query, scoring notes against it when
// Pagefind's index isn't there, and marking the matches. search.ts wires them to the page.

export interface Hit {
  url: string;
  score: number;
  /** Pagefind's excerpt, HTML with the matches in <mark>. */
  excerpt?: string;
}

/** What the fallback search can see of a note: what its row in the list carries. */
export interface Listed {
  url: string;
  title: string;
  description: string;
  /** Unset for a note in no series. */
  series?: string;
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** A page's path as the list writes it, from one of Pagefind's addresses. */
export const pagePath = (url: string, origin: string) => {
  const p = new URL(url, origin).pathname.replace(/index\.html$/, '');
  return p.endsWith('/') ? p : `${p}/`;
};

/** The query's words, lower case, with punctuation trimmed from their ends. */
export const terms = (q: string) =>
  (q || '').toLowerCase().split(/\s+/).map(t => t.replace(/^[^\w~/]+|[^\w]+$/g, '')).filter(Boolean);

/** Escaped HTML of the text, with each of the words in <mark>. */
export function highlight(text: string, ts: string[]) {
  if (!ts.length) return esc(text);
  const re = new RegExp(`(${ts.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return text.split(re).map((part, i) => (i % 2 ? `<mark>${esc(part)}</mark>` : esc(part))).join('');
}

/**
 * Without Pagefind: notes holding every word, best first. A word in the title counts most, then in the
 * description, then in the series name ("standalone" for a note in none).
 */
export function findInList(q: string, notes: Listed[]): Hit[] {
  const ts = terms(q);
  const out: Hit[] = [];
  for (const note of notes) {
    const title = note.title.toLowerCase();
    const desc = note.description.toLowerCase();
    const series = (note.series || 'standalone').toLowerCase();
    let score = 0;
    for (const t of ts) {
      const s = title.includes(t) ? 10 : desc.includes(t) ? 4 : series.includes(t) ? 3 : 0;
      if (!s) { score = 0; break; }
      score += s;
    }
    if (score) out.push({ url: note.url, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** The line under a match: its description when the words are in it, else Pagefind's excerpt. */
export function snippet(description: string, ts: string[], hit: Hit) {
  if (terms(description).some(w => ts.some(t => w.includes(t)))) return highlight(description, ts);
  return hit.excerpt || esc(description);
}

/** Groups holding better matches first; otherwise they keep their place on the page. */
export const byBestMatch = (a: { best: number; place: number }, b: { best: number; place: number }) =>
  b.best - a.best || a.place - b.place;
