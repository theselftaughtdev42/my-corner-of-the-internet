// Konami code easter egg → the (unlisted) Self-Taught Pathway page.
// Press: ↑ ↑ ↓ ↓ ← → ← → B A
(function () {
  // Instant navigation re-runs extra_javascript on each page swap while the
  // window persists — bind the listener only once to avoid stacking them.
  if (window.__konamiBound) return;
  window.__konamiBound = true;

  const sequence = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let pos = 0;

  document.addEventListener("keydown", function (event) {
    // Normalise single characters (B/A) to lower case; leave named keys as-is.
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (key === sequence[pos]) {
      pos += 1;
    } else {
      // Wrong key: restart, but count it if it happens to be the first key.
      pos = key === sequence[0] ? 1 : 0;
    }

    if (pos === sequence.length) {
      pos = 0;
      window.location.assign("/pathway/");
    }
  });
})();
