// Home's search box. Typing narrows the list under it in place: the matching notes keep their series
// heading and their reading order, and only whole groups move, so the series holding the best match comes
// first. The best match is selected, so Enter opens it; the arrow keys pick another.
//
// Matches come from Pagefind's index of the built site (made by `npm run build`). Where that index isn't
// there, as under `npm run dev`, titles, descriptions and series names are searched instead.
import { byBestMatch, esc, findInList, highlight, pagePath, snippet, terms, type Hit } from './search-match';
import { FROM_KEY } from './site';

interface Pagefind {
  options(o: object): Promise<void>;
  init(): Promise<void>;
  search(q: string): Promise<{ results: { data(): Promise<{ url: string; excerpt: string }> }[] }>;
}

const box = document.querySelector<HTMLInputElement>('#q');
const list = document.querySelector<HTMLElement>('#all-notes');
const rest = document.querySelector<HTMLElement>('.rest');
const below = document.querySelector<HTMLElement>('.below');
const msg = document.querySelector<HTMLElement>('.msg');

if (box && list && rest && below && msg) {
  const $$ = <T extends Element>(sel: string, root: ParentNode) => Array.from(root.querySelectorAll<T>(sel));
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  /* ---------- Finding matches ---------- */
  let pagefind: Promise<Pagefind | null> | null = null;
  function loadPagefind() {
    const url = '/pagefind/pagefind.js';
    pagefind ??= import(/* @vite-ignore */ url)
      .then(async (pf: Pagefind) => {
        await pf.options({ excerptLength: 24 });
        await pf.init();
        return pf;
      })
      .catch(() => null);
    return pagefind;
  }

  async function findWithPagefind(pf: Pagefind, q: string): Promise<Hit[]> {
    const { results } = await pf.search(q);
    const data = await Promise.all(results.slice(0, 40).map(r => r.data()));
    return data.map((d, i) => ({ url: pagePath(d.url, location.origin), score: data.length - i, excerpt: d.excerpt }));
  }

  const listed = () =>
    $$<HTMLElement>('.li', list!).map(li => ({
      url: li.dataset.url!,
      title: li.dataset.title || '',
      description: li.dataset.description || '',
      series: li.dataset.series,
    }));

  async function find(q: string) {
    const pf = await loadPagefind();
    return pf ? findWithPagefind(pf, q) : findInList(q, listed());
  }

  /* ---------- Showing them ---------- */
  let sel = -1;
  // Last place the mouse really moved to over the list (the list changes under a still pointer as you type).
  let px: number | null = null;
  let py: number | null = null;

  // Whatever is listed under the box right now: the recent notes and series, or the matches.
  const shown = () => $$<HTMLAnchorElement>('.item', below).filter(a => a.getClientRects().length);

  // One underline marks the note Enter opens: the best match, or wherever the arrows or mouse moved it.
  function select(i: number, scroll = false) {
    const items = shown();
    $$('.item.is-sel', below!).forEach(a => a.classList.remove('is-sel'));
    sel = items.length && i >= 0 ? i % items.length : -1;
    if (sel < 0) return;
    items[sel].classList.add('is-sel');
    if (scroll) items[sel].scrollIntoView({ block: 'nearest' });
  }

  // The status line: "No notes match" is shown; everything else is for screen readers only.
  function tell(text: string, visible: boolean) {
    msg!.textContent = text;
    msg!.classList.toggle('vh', !visible);
  }
  const opens = () => {
    const a = shown()[sel];
    return a ? `Enter opens ${a.querySelector('.t')!.textContent}.` : '';
  };

  const rank = (g: HTMLElement) => ({ best: Number(g.dataset.best), place: Number(g.dataset.g) });

  let latest = 0;
  async function filter(q: string) {
    const ask = ++latest;
    // One letter matches nearly everything, so the lists stay until there are two.
    const res = q.trim().length > 1 ? await find(q) : null;
    if (ask !== latest) return; // a newer search has started
    list!.hidden = !res;
    rest!.hidden = !!res;
    const ts = terms(q);
    const hits = new Map((res || []).map(h => [h.url, h]));
    const groups = $$<HTMLElement>('.group', list!);
    for (const g of groups) {
      let best = 0;
      for (const li of $$<HTMLElement>('.li', g)) {
        const hit = hits.get(li.dataset.url!);
        li.hidden = !!res && !hit;
        li.querySelector('.t')!.innerHTML = hit ? highlight(li.dataset.title || '', ts) : esc(li.dataset.title || '');
        const d = li.querySelector<HTMLElement>('.d')!;
        d.innerHTML = hit ? snippet(li.dataset.description || '', ts, hit) : '';
        d.hidden = !hit;
        if (hit) best = Math.max(best, hit.score);
      }
      g.hidden = !!res && !best;
      g.dataset.best = String(best);
    }
    groups
      .sort((a, b) => byBestMatch(rank(a), rank(b)))
      .forEach(g => list!.appendChild(g));
    list!.classList.toggle('is-found', !!res);
    let top = -1;
    let score = 0;
    shown().forEach((a, i) => {
      const hit = hits.get(a.closest<HTMLElement>('.li')?.dataset.url ?? '');
      if (hit && hit.score > score) { top = i; score = hit.score; }
    });
    select(top);
    const count = res ? res.filter(h => $$<HTMLElement>('.li', list!).some(li => li.dataset.url === h.url)).length : 0;
    if (!res) tell('', false);
    else if (!count) tell(`No notes match “${q.trim()}”.`, true);
    else tell(`${plural(count, 'note')} found. ${opens()}`, false);
  }

  /* ---------- Keys, mouse and focus ---------- */
  // Where search was opened from, so Esc in an empty box can take the reader back there.
  let from: string | null = null;
  try {
    from = sessionStorage.getItem(FROM_KEY);
    sessionStorage.removeItem(FROM_KEY);
  } catch {
    /* storage unavailable */
  }
  if (location.hash !== '#search' || !from || new URL(from).origin !== location.origin) from = null;

  box.addEventListener('input', () => filter(box.value));
  box.addEventListener('focus', () => {
    loadPagefind();
    // On a phone the keyboard covers the lower half of the screen, so the box moves up near the top to
    // leave room for what it finds.
    if (window.innerWidth > 640) return;
    const top = box.getBoundingClientRect().top + window.scrollY - 16;
    if (top > window.scrollY) window.scrollTo({ top });
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = shown().length;
      if (!n) return;
      const d = e.key === 'ArrowDown' ? 1 : -1;
      select(sel < 0 ? (d > 0 ? 0 : n - 1) : (sel + d + n) % n, true);
      tell(opens(), false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      shown()[sel]?.click();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (box.value) {
        box.value = '';
        filter('');
      } else if (from) {
        history.back();
      } else {
        box.blur();
      }
    }
  });

  // Keys on a focused row: the arrows move focus along the rows (the selection follows it), and Esc goes
  // back to the box.
  below.addEventListener('keydown', e => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.item');
    if (!a) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      box.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = shown();
      const n = items.length;
      items[(items.indexOf(a) + (e.key === 'ArrowDown' ? 1 : -1) + n) % n]?.focus();
    }
  });
  // Keyboard focus moves the selection too, so the underline and the focus ring never mark two rows.
  below.addEventListener('focusin', e => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.item');
    const i = a ? shown().indexOf(a) : -1;
    if (i >= 0 && i !== sel) select(i);
  });
  below.addEventListener('focusout', e => {
    const to = e.relatedTarget as Node | null;
    if (!below.contains(to) && to !== box && !box.value.trim()) select(-1);
  });
  // The mouse moves the same selection the arrows do, so only one title is ever underlined.
  below.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || (e.clientX === px && e.clientY === py)) return;
    px = e.clientX;
    py = e.clientY;
    const a = (e.target as Element).closest<HTMLAnchorElement>('.item');
    const i = a ? shown().indexOf(a) : -1;
    if (i >= 0 && i !== sel) select(i);
  });
  below.addEventListener('pointerleave', () => {
    px = py = null;
    // Nothing typed: the list goes back to rest, unless a row has keyboard focus.
    if (!box.value.trim() && !below.contains(document.activeElement)) select(-1);
  });

  // Arriving from the search icon or "/" on another page puts the cursor in the box.
  if (location.hash === '#search') box.focus();
  // Coming back to Home with words still in the box (the browser keeps them) shows their matches again.
  window.addEventListener('pageshow', () => {
    if (box.value.trim()) filter(box.value);
  });
}
