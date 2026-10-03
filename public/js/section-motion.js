const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const compact = window.matchMedia('(max-width: 767px)');
const allowed = () => !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused');

export function initSectionMotion() {
  const animations = new Set();
  document.querySelectorAll('[data-pricing-group]').forEach(group => {
    const cards = [...group.querySelectorAll('[data-pricing-card]')];
    const seen = new Set();
    cards.forEach(card => { if (allowed()) card.dataset.pricingPending = ''; });
    function reveal(card, delay = 0) {
      if (seen.has(card)) return;
      seen.add(card);
      delete card.dataset.pricingPending;
      if (!allowed()) return;
      const animation = card.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 500, delay, easing: 'cubic-bezier(.21,.47,.32,.98)', fill: 'backwards' });
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => {});
    }
    let observer = null;
    function observe() {
      observer?.disconnect();
      if (!allowed() || !('IntersectionObserver' in window)) { cards.forEach(card => reveal(card)); return; }
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          if (entry.target === group) {
            cards.forEach((card, index) => reveal(card, index * 120));
            observer.unobserve(group);
          } else { reveal(entry.target); observer.unobserve(entry.target); }
        });
      }, { rootMargin: `0px 0px -${Math.round(innerHeight * .12)}px 0px` });
      if (compact.matches) cards.filter(card => !seen.has(card)).forEach(card => observer.observe(card));
      else observer.observe(group);
    }
    observe();
    compact.addEventListener('change', observe);
    document.addEventListener('dipanda:motion-change', observe);
    reduced.addEventListener('change', observe);
  });
  document.querySelectorAll('[data-process-cards]').forEach(group => {
    const cards = [...group.querySelectorAll('[data-process-card]')];
    group.dataset.processReady = '';
    const select = card => cards.forEach(item => {
      const active = item === card;
      item.classList.toggle('is-active', active);
      item.querySelector('[data-process-toggle]').setAttribute('aria-expanded', String(active));
      item.querySelector('.process-detail').hidden = !active;
    });
    select(cards[0]);
    cards.forEach(card => {
      card.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && matchMedia('(hover: hover) and (pointer: fine)').matches) select(card);
      });
      card.querySelector('[data-process-toggle]').addEventListener('focus', () => select(card));
      card.querySelector('[data-process-toggle]').addEventListener('click', () => select(card));
    });
    group.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') select(document.activeElement.closest('[data-process-card]') || cards[0]);
    });
    group.addEventListener('focusout', event => { if (!group.contains(event.relatedTarget)) select(cards[0]); });
  });
  function preferenceChanged() {
    if (!allowed()) { animations.forEach(animation => animation.cancel()); animations.clear(); }
  }
  document.addEventListener('dipanda:motion-change', preferenceChanged);
  reduced.addEventListener('change', preferenceChanged);
  document.addEventListener('visibilitychange', () => animations.forEach(animation => document.hidden ? animation.pause() : animation.play()));
}
