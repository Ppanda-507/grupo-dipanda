const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const allowed = () => !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused');

export function initAboutMotion() {
  // Apply the same WhisperText entrance to section titles, preserving inline
  // emphasis, line breaks and the exact copy. About already has its own markup.
  document.querySelectorAll('.section-heading h2,.section-heading h1').forEach(heading => {
    if (heading.hasAttribute('data-whisper')) return;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
        else { const span = document.createElement('span'); span.dataset.whisperWord = ''; span.textContent = part; fragment.append(span); }
      });
      node.replaceWith(fragment);
    });
    heading.dataset.whisper = '';
    heading.closest('[data-reveal]')?.removeAttribute('data-reveal');
  });
  document.querySelectorAll('[data-whisper]').forEach(phrase => {
    const words = [...phrase.querySelectorAll('[data-whisper-word]')];
    const icons = [...phrase.querySelectorAll('[data-whisper-icon]')];
    let animations = [], observer = null, state = 'pending';
    function complete() {
      if (state === 'complete') return;
      state = 'complete';
      phrase.dataset.whisperState = state;
      animations.forEach(animation => animation.cancel());
      animations = [];
      observer?.disconnect();
      document.dispatchEvent(new CustomEvent('dipanda:words-ready'));
    }
    function play() {
      if (state !== 'pending') return;
      if (!allowed()) { complete(); return; }
      state = 'playing';
      phrase.dataset.whisperState = state;
      // WhisperText demo: 100ms stagger, 500ms, x -20, y 0, power2.out.
      // Sampling 1-(1-t)^3 reproduces GSAP's ease without another runtime.
      const frames = Array.from({ length: 31 }, (_, index) => {
        const t = index / 30, progress = 1 - Math.pow(1 - t, 3);
        return { offset: t, opacity: progress, transform: `translateX(${-20 * (1 - progress)}px)` };
      });
      words.forEach((word, index) => animations.push(word.animate(frames, {
        duration: 500, delay: index * 100, easing: 'linear', fill: 'both'
      })));
      const phraseDuration = Math.max(0, words.length - 1) * 100 + 500;
      icons.forEach((icon, index) => animations.push(icon.animate([
        { opacity: 0, transform: `translateY(8px) scale(.9) rotate(${index % 2 ? 12 : -12}deg)` },
        { opacity: 1, transform: 'translateY(0) scale(1) rotate(0deg)' }
      ], { duration: 500, delay: phraseDuration + index * 120, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'both' })));
      Promise.all(animations.map(animation => animation.finished)).then(complete).catch(() => {});
    }
    phrase.dataset.whisperState = state;
    if (!allowed()) complete();
    else if ('IntersectionObserver' in window) {
      const observe = () => {
        if (state !== 'pending') return;
        observer?.disconnect();
        observer = new IntersectionObserver(entries => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          play();
        }, { rootMargin: `0px 0px -${Math.round(window.innerHeight * .1)}px 0px`, threshold: 0 });
        observer.observe(phrase);
      };
      observe();
      window.addEventListener('resize', observe, { passive: true });
    } else play();
    function preferencesChanged() { if (!allowed()) complete(); }
    document.addEventListener('dipanda:motion-change', preferencesChanged);
    reduced.addEventListener('change', preferencesChanged);
    document.addEventListener('visibilitychange', () => {
      animations.forEach(animation => document.hidden ? animation.pause() : animation.play());
    });
  });
}
