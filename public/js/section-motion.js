const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const compact = window.matchMedia('(max-width: 767px)');
const allowed = () => !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused');

export function initSectionMotion() {
  document.querySelectorAll('[data-animated-src]').forEach(image => {
    let visible = false;
    const update = () => {
      const src = allowed() && visible && !document.hidden ? image.dataset.animatedSrc : image.dataset.stillSrc;
      if (image.getAttribute('src') !== src) image.src = src;
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(image);
    } else { visible = true; }
    document.addEventListener('dipanda:motion-change', update);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    update();
  });
  const animations = new Set();
  document.querySelectorAll('[data-problem-entry]').forEach(surface => {
    if (!allowed() || !('IntersectionObserver' in window)) return;
    if (surface.getBoundingClientRect().top >= innerHeight) surface.dataset.problemPending='';
    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      // Wait until the panel is visibly inside the viewport, not just touching it.
      if (!entry.isIntersecting || entry.intersectionRatio < .12) return;
      observer.disconnect();
      const pending=surface.hasAttribute('data-problem-pending');
      surface.removeAttribute('data-problem-pending');
      if (!pending || !allowed()) return;
      const animation=surface.animate([{opacity:0,transform:'translateY(32px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:550,easing:getComputedStyle(surface).getPropertyValue('--ease').trim(),fill:'backwards'});
      animations.add(animation);
      animation.finished.then(()=>animations.delete(animation)).catch(()=>{});
    },{threshold:.12,rootMargin:'0px 0px -64px 0px'});
    observer.observe(surface);
    const show=()=>{if(!allowed()){observer.disconnect();surface.removeAttribute('data-problem-pending');}};
    document.addEventListener('dipanda:motion-change',show);
    reduced.addEventListener('change',show);
  });

  const demoCards = [...document.querySelectorAll('[data-demo-entry]')];
  if (allowed() && 'IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const card = entry.target, pending = card.hasAttribute('data-demo-pending');
        demoObserver.unobserve(card);
        card.removeAttribute('data-demo-pending');
        if (!pending || !allowed()) return;
        const animation = card.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],
          {duration:350,easing:getComputedStyle(card).getPropertyValue('--ease').trim(),fill:'backwards'});
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
      });
    }, {threshold:.12,rootMargin:'0px 0px -20px 0px'});
    demoCards.forEach(card => {
      if (card.getBoundingClientRect().top >= innerHeight) card.dataset.demoPending = '';
      demoObserver.observe(card);
    });
    const showDemos = () => {
      if (allowed()) return;
      demoObserver.disconnect();
      demoCards.forEach(card => card.removeAttribute('data-demo-pending'));
    };
    document.addEventListener('dipanda:motion-change', showDemos);
    reduced.addEventListener('change', showDemos);
  }

  const workflowRows = [...document.querySelectorAll('[data-workflow-entry]')];
  if (allowed() && 'IntersectionObserver' in window) {
    let workflowScrollDown = true, previousWorkflowScroll = scrollY;
    window.addEventListener('scroll', () => {
      if (scrollY !== previousWorkflowScroll) workflowScrollDown = scrollY > previousWorkflowScroll;
      previousWorkflowScroll = scrollY;
    }, {passive:true});
    const workflowObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const row = entry.target;
        workflowObserver.unobserve(row);
        const pending = row.hasAttribute('data-workflow-pending');
        row.removeAttribute('data-workflow-pending');
        row.dataset.workflowEntered = '';
        if (!pending || !allowed() || !workflowScrollDown) return;
        const phone = matchMedia('(max-width: 767px)').matches;
        const direction = workflowRows.indexOf(row) % 2 === 0 ? 1 : -1;
        const from = phone ? 'translateX(' + (direction * 64) + 'px)' : 'translateY(20px)';
        const animation = row.animate([{opacity:0,transform:from},{opacity:1,transform:'translate(0,0)'}],
          {duration:500,easing:getComputedStyle(row).getPropertyValue('--ease').trim(),fill:'backwards'});
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
      });
    }, {threshold:.18,rootMargin:'0px 0px -24px 0px'});
    workflowRows.forEach(row => {
      if (row.getBoundingClientRect().top >= innerHeight) row.dataset.workflowPending = '';
      workflowObserver.observe(row);
    });
    const showWorkflow = () => {
      if (allowed()) return;
      workflowObserver.disconnect();
      workflowRows.forEach(row => row.removeAttribute('data-workflow-pending'));
    };
    document.addEventListener('dipanda:motion-change', showWorkflow);
    reduced.addEventListener('change', showWorkflow);
  }

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
  function preferenceChanged() {
    if (!allowed()) { animations.forEach(animation => animation.cancel()); animations.clear(); }
  }
  document.addEventListener('dipanda:motion-change', preferenceChanged);
  reduced.addEventListener('change', preferenceChanged);
  document.addEventListener('visibilitychange', () => animations.forEach(animation => document.hidden ? animation.pause() : animation.play()));
}
