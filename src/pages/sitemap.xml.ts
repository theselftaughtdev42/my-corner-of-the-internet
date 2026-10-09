import type { APIRoute } from 'astro';
import { getLibrary, isoDate, noteUrl, seriesAdded, seriesUrl } from '../lib/notes';

// Every page, at the same address as the MkDocs site's sitemap.
export const GET: APIRoute = async ({ site }) => {
  const library = await getLibrary();
  const newest = library.notes[0]?.data.date.created;
  const pages: [string, Date | undefined][] = [
    ['/', newest],
    ['/notes/', newest],
    ...library.series.map((s) => [seriesUrl(s), seriesAdded(s)] as [string, Date]),
    ...library.notes.map((n) => [noteUrl(n), n.data.date.updated ?? n.data.date.created] as [string, Date]),
    ['/about/', undefined],
    ['/pathway/', undefined],
  ];
  const urls = pages
    .map(
      ([path, date]) =>
        `<url><loc>${new URL(path, site)}</loc>${date ? `<lastmod>${isoDate(date)}</lastmod>` : ''}</url>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    },
  );
};
