import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

export interface Series {
  slug: string;
  name: string;
  /** In reading order. */
  notes: Note[];
}

export interface Library {
  /** Newest first. */
  notes: Note[];
  /** In the order they began. */
  series: Series[];
  /** Notes in no series, newest first. */
  standalone: Note[];
}

/** A series note's folder, which names the series in its address. */
const folder = (note: Note) => (note.id.includes('/') ? note.id.split('/')[0] : undefined);

export const noteUrl = (note: Note) => `/notes/${note.id}/`;

export const seriesUrl = (series: Series) => `/notes/${series.slug}/`;

/** The date a note was added, as YYYY-MM-DD. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "4 Jun 2024". Front matter dates are days, so they're read in UTC. */
export const dayText = (date: Date) => `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const newestFirst = (a: Note, b: Note) => b.data.date.created.getTime() - a.data.date.created.getTime();

/** A series is dated by its newest note, so the date can be found on that note. */
export const seriesAdded = (series: Series) =>
  series.notes.reduce((latest, n) => (n.data.date.created > latest ? n.data.date.created : latest), new Date(0));

let cached: Promise<Library> | undefined;

/** Every published note (drafts show only while developing), grouped into series. */
export function getLibrary(): Promise<Library> {
  cached ??= load();
  return cached;
}

async function load(): Promise<Library> {
  const notes = (await getCollection('notes', (n) => import.meta.env.DEV || !n.data.draft)).sort(newestFirst);

  // Each series has its own folder, whose name is the series' address (short names keep the path readable).
  const bySeries = new Map<string, Note[]>();
  const folderSeries = new Map<string, string>();
  for (const note of notes) {
    const name = note.data.series;
    const dir = folder(note);
    if (name && !dir) {
      throw new Error(`${note.id}: a note in "${name}" belongs in that series' folder in src/content/notes/.`);
    }
    if (!name && dir) {
      throw new Error(`${note.id}: a note in a folder needs "series" and "part" in its front matter.`);
    }
    if (!name || !dir) continue;
    const other = folderSeries.get(dir);
    if (other && other !== name) throw new Error(`${note.id}: the ${dir}/ folder holds "${other}", not "${name}".`);
    folderSeries.set(dir, name);
    bySeries.set(name, [...(bySeries.get(name) ?? []), note]);
  }

  const series: Series[] = [...bySeries].map(([name, members]) => {
    const dirs = new Set(members.map(folder));
    if (dirs.size > 1) throw new Error(`"${name}" is split across folders ${[...dirs].join(', ')}; keep it in one.`);
    const ordered = members.sort((a, b) => a.data.part! - b.data.part!);
    ordered.forEach((n, i) => {
      if (n.data.part !== i + 1) {
        throw new Error(`"${name}" needs parts 1 to ${ordered.length}, one note each; ${n.id} is part ${n.data.part}.`);
      }
    });
    return { slug: folder(ordered[0])!, name, notes: ordered };
  });
  series.sort((a, b) => a.notes[0].data.date.created.getTime() - b.notes[0].data.date.created.getTime());

  const urls = new Set<string>();
  for (const url of [...notes.map(noteUrl), ...series.map(seriesUrl)]) {
    if (urls.has(url)) throw new Error(`Two pages would share the address ${url}.`);
    urls.add(url);
  }

  return { notes, series, standalone: notes.filter((n) => !n.data.series) };
}

export function seriesOf(library: Library, note: Note) {
  return library.series.find((s) => s.name === note.data.series);
}
