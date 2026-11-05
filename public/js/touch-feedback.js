// Give touch presses the same fill/arrow state as desktop hover, without
// intercepting clicks or delaying navigation. Cancel when a gesture scrolls.
export function initTouchFeedback() {
  let current = null;
  let timer;
  let start;
  const clear = () => { clearTimeout(timer); current?.classList.remove('is-touch-pressed'); current = null; };
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    document.documentElement.dataset.touchInput = 'true';
    clear();
    const target = event.target.closest('.button--motion,.flow-button,.hero-buttons .pill-link--glass');
    if (!target || target.matches(':disabled,[aria-disabled="true"]')) return;
    current = target;
    start = [event.clientX, event.clientY];
    current.classList.add('is-touch-pressed');
  }, { passive: true });
  document.addEventListener('pointermove', event => {
    if (current && Math.hypot(event.clientX - start[0], event.clientY - start[1]) > 12) clear();
  }, { passive: true });
  document.addEventListener('pointerup', () => {
    if (current?.matches('.mobile-navigation nav>.button')) clear();
    else timer = setTimeout(clear, 220);
  }, { passive: true });
  document.addEventListener('pointercancel', clear, { passive: true });
  window.addEventListener('pagehide', clear);
  document.addEventListener('keydown', () => { delete document.documentElement.dataset.touchInput; });
}

export function initFlowPreview() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-flow-preview]').forEach(preview => {
    const image = preview.querySelector('[data-flow-image]');
    const toggle = preview.querySelector('[data-flow-toggle]');
    const staticSrc = preview.dataset.flowStatic || '/assets/diagrams/fluxo-informacao-static.png';
    const animatedSrc = preview.dataset.flowAnimated || '/assets/diagrams/fluxo-informacao.gif';
    let playing = false;
    let pausedByUser = false;
    const stop = () => {
      playing = false;
      image.src = staticSrc;
      toggle.setAttribute('aria-pressed', 'false');
      toggle.textContent = 'Reproduzir fluxo';
    };
    const start = () => {
      if (playing) return;
      playing = true;
      image.src = animatedSrc;
      toggle.setAttribute('aria-pressed', 'true');
      toggle.textContent = 'Pausar fluxo';
    };
    toggle.addEventListener('click', () => {
      if (playing) { pausedByUser = true; return stop(); }
      pausedByUser = false;
      start();
    });
    reduced.addEventListener('change', stop);
    document.addEventListener('dipanda:motion-change', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return stop();
      if (!pausedByUser && !document.hidden && !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused')) start();
    }).observe(preview);
  });
}
