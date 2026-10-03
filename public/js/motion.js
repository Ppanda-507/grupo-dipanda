const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pausedByVisitor = false;
const rotators = new Set();

export function setMotionPaused(paused) {
  pausedByVisitor = Boolean(paused);
  applyMotionPreference();
  document.dispatchEvent(new CustomEvent('dipanda:motion-change', { detail: { paused: pausedByVisitor } }));
}

export function isMotionPaused() { return pausedByVisitor; }

function applyMotionPreference() {
  const paused = reducedMotion.matches || pausedByVisitor;
  document.documentElement.toggleAttribute('data-motion-paused', paused);
  document.querySelectorAll('[data-motion-toggle]').forEach(button => {
    button.setAttribute('aria-pressed', String(pausedByVisitor));
    button.setAttribute('aria-label', pausedByVisitor ? 'Retomar animações' : 'Pausar animações');
    const label = button.querySelector('[data-motion-label]');
    if (label) label.textContent = pausedByVisitor ? 'Retomar animações' : 'Pausar animações';
  });
  rotators.forEach(rotator => rotator.update());
}

export function initMotion() {
  // Progressive enhancement: all content remains readable if JavaScript fails.
  const reveals = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.dataset.visible = 'true';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    reveals.forEach(element => {
      if (element.getBoundingClientRect().top >= window.innerHeight) element.dataset.pending = 'true';
      revealObserver.observe(element);
    });
  }

  document.querySelectorAll('[data-word-rotator]').forEach(element => {
    const words = JSON.parse(element.dataset.words || '[]');
    const current = element.querySelector('[data-word-current]');
    const next = element.querySelector('[data-word-next]');
    const phrase = element.closest('[data-whisper]');
    if (!current || !next || words.length < 2) return;
    const sizer = element.hasAttribute('data-word-fit') ? element.querySelector('.word-width') : null;
    const line = sizer ? element.closest('.about-line') : null;
    let index = 0, timer = null, fitTimer = null, visible = false, animations = [], layoutAnimations = [];
    function fitWord(text, animate = false) {
      if (!sizer || sizer.textContent === text) return;
      const items = animate && line ? [...line.children] : [];
      const positions = items.map(item => item.getBoundingClientRect());
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations = [];
      // Intrinsic text width uses the actual font, accents and viewport size.
      sizer.textContent = text;
      items.forEach((item, position) => {
        const box = item.getBoundingClientRect();
        const x = positions[position].left - box.left, y = positions[position].top - box.top;
        if (Math.abs(x) < .5 && Math.abs(y) < .5) return;
        const animation = item.animate([
          { transform: `translate(${x}px,${y}px)` }, { transform: 'translate(0px,0px)' }
        ], { duration: 300, easing: 'cubic-bezier(.23,1,.32,1)' });
        layoutAnimations.push(animation);
      });
    }
    function reserveLineHeight() {
      if (!sizer || !line) return;
      const text = sizer.textContent;
      line.style.minHeight = '';
      let height = 0;
      words.forEach(word => {
        sizer.textContent = word;
        height = Math.max(height, line.getBoundingClientRect().height);
      });
      sizer.textContent = text;
      // Reserve only the tallest natural layout, so shorter words never move
      // the cards below the phrase when a phone changes between one/two lines.
      line.style.minHeight = `${height}px`;
    }
    if (sizer) {
      reserveLineHeight();
      document.fonts?.ready.then(reserveLineHeight);
      let resizeFrame = null;
      window.addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(reserveLineHeight);
      }, { passive: true });
    }
    // AnimatedHero's stiffness 50, with Motion's default mass 1 and damping 10.
    // Sample the actual damped spring into compositor-driven WAAPI keyframes.
    const springFrames = incoming => Array.from({ length: 97 }, (_, step) => {
      const t = step / 60;
      const progress = step === 96 ? 1 : 1 - Math.exp(-5 * t) * (Math.cos(5 * t) + Math.sin(5 * t));
      return {
        offset: step / 96,
        transform: `translateY(${incoming ? 150 * (1 - progress) : -150 * progress}px)`,
        opacity: Math.max(0, Math.min(1, incoming ? progress : 1 - progress))
      };
    });
    function settle() {
      clearTimeout(fitTimer); fitTimer = null;
      animations.forEach(animation => animation.cancel());
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations = [];
      animations = [];
      current.textContent = words[index];
      next.textContent = '';
      fitWord(words[index]);
    }
    function cancel() { clearInterval(timer); timer = null; settle(); }
    function update() {
      const ready = !phrase || phrase.dataset.whisperState === 'complete';
      const active = visible && ready && !document.hidden && !reducedMotion.matches && !pausedByVisitor;
      if (!active) { cancel(); return; }
      if (timer) return;
      timer = setInterval(() => {
        settle();
        index = (index + 1) % words.length;
        next.textContent = words[index];
        const timing = { duration: 1600, easing: 'linear', fill: 'both' };
        const outgoingFrames = springFrames(false);
        animations = [current.animate(outgoingFrames, timing), next.animate(springFrames(true), timing)];
        const incoming = animations[1];
        if (sizer) {
          // Resize in the gap after the outgoing word has left the window,
          // before the incoming word arrives. FLIP moves the surrounding text
          // smoothly without animating width or squeezing the letters.
          const fitFrame = outgoingFrames.find(frame => parseFloat(frame.transform.slice(11)) <= -element.clientHeight);
          incoming.ready.then(() => {
            if (!animations.includes(incoming)) return;
            fitTimer = setTimeout(() => {
              fitTimer = null;
              if (animations.includes(incoming)) fitWord(words[index], true);
            }, Math.max(0, (fitFrame?.offset || 0) * timing.duration - (incoming.currentTime || 0)));
          }).catch(() => {});
        }
        incoming.finished.then(() => { if (animations.includes(incoming)) settle(); }).catch(() => {});
      }, 2000);
    }
    const rotator = { update };
    rotators.add(rotator);
    document.addEventListener('dipanda:words-ready', update);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(element);
    } else { visible = true; update(); }
  });

  if ('IntersectionObserver' in window) {
    const loopObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.toggleAttribute('data-in-view', entry.isIntersecting));
    });
    document.querySelectorAll('[data-loop-animation]').forEach(element => loopObserver.observe(element));
  }
  document.querySelectorAll('[data-motion-toggle]').forEach(button => {
    button.addEventListener('click', () => setMotionPaused(!pausedByVisitor));
  });
  reducedMotion.addEventListener('change', applyMotionPreference);
  document.addEventListener('visibilitychange', () => {
    document.documentElement.toggleAttribute('data-page-hidden', document.hidden);
    rotators.forEach(rotator => rotator.update());
  });
  applyMotionPreference();
}
