// Behaviour on every page: the "/" shortcut to search, the picture viewer, and the Konami code.

/** Set when a reader goes to search from another page, so Esc in the empty box can take them back. */
export const FROM_KEY = 'search-from';

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

function rememberPage() {
  try {
    sessionStorage.setItem(FROM_KEY, location.href);
  } catch {
    /* storage unavailable: Esc just clears the box */
  }
}

// The search box lives on Home. The header's search icon and "/" go there and put the cursor in it.
document.querySelectorAll<HTMLAnchorElement>('[data-search-link]').forEach(a => a.addEventListener('click', rememberPage));

document.addEventListener('keydown', e => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
  const box = document.querySelector<HTMLInputElement>('#q');
  e.preventDefault();
  if (box) {
    box.focus();
  } else {
    rememberPage();
    location.href = '/#search';
  }
});

// Pictures in notes link to their full-size file. With scripts on, they open over the page instead.
let viewer: HTMLDialogElement | null = null;
function openPicture(img: HTMLImageElement) {
  if (!viewer) {
    viewer = document.createElement('dialog');
    viewer.className = 'viewer';
    viewer.innerHTML = '<button type="button" aria-label="Close">×</button><img alt="">';
    viewer.addEventListener('click', () => viewer!.close());
    document.body.append(viewer);
  }
  const big = viewer.querySelector('img')!;
  // The picture's own size keeps its shape while the full-size file loads.
  for (const a of ['width', 'height']) {
    const v = img.getAttribute(a);
    if (v) big.setAttribute(a, v);
    else big.removeAttribute(a);
  }
  big.src = img.currentSrc || img.src;
  big.alt = img.alt;
  big.classList.toggle('is-diagram', !!img.closest('.fig-diagram'));
  viewer.showModal();
}
document.addEventListener('click', e => {
  const link = (e.target as Element).closest?.('a.fig-frame');
  if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const img = link.querySelector('img');
  if (!img || typeof HTMLDialogElement !== 'function') return;
  e.preventDefault();
  openPicture(img);
});

// Konami code easter egg: ↑ ↑ ↓ ↓ ← → ← → B A opens the (unlisted) Self-Taught Pathway page.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
document.addEventListener('keydown', e => {
  // Single characters (B/A) count in either case; named keys stay as they are.
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === KONAMI[pos]) pos += 1;
  // Wrong key: start again, but count it if it happens to be the first key.
  else pos = key === KONAMI[0] ? 1 : 0;
  if (pos === KONAMI.length) {
    pos = 0;
    location.assign('/pathway/');
  }
});
