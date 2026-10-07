// One social card per page, at /og/<page>.png. Notes and series pages use their own address:
// /og/notes/how-we-learn/spaced-repetition.png.
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard, type Card } from '../../lib/card';
import { dayText, getLibrary, noteUrl, plural, seriesOf, seriesUrl } from '../../lib/notes';
import { SITE } from '../../lib/site';

export const getStaticPaths = (async () => {
  const library = await getLibrary();
  const key = (url: string) => url.replace(/^\/|\/$/g, '');
  const cards: { params: { card: string }; props: Card }[] = [
    { params: { card: 'home' }, props: { title: SITE.name, footer: SITE.tagline, logo: true } },
    { params: { card: 'notes' }, props: { title: 'Notes', footer: plural(library.notes.length, 'note') } },
    { params: { card: 'about' }, props: { title: 'Tim MacKay', footer: 'Obsessive Learner' } },
    { params: { card: 'pathway' }, props: { title: 'The Self-Taught Pathway', footer: 'The self-taught curriculum' } },
    ...library.series.map(s => ({
      params: { card: key(seriesUrl(s)) },
      props: { title: s.name, footer: plural(s.notes.length, 'note'), bars: { count: s.notes.length, current: 0 } },
    })),
    ...library.notes.map(n => {
      const s = seriesOf(library, n);
      return {
        params: { card: key(noteUrl(n)) },
        props: s
          ? { title: n.data.title, footer: `${s.name} · Part ${n.data.part} of ${s.notes.length}`, bars: { count: s.notes.length, current: n.data.part! } }
          : { title: n.data.title, footer: dayText(n.data.date.created) },
      };
    }),
  ];
  return cards;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props as Card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
