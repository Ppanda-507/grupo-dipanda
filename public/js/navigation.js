const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

export function initNavigation() {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const links = [...header.querySelectorAll('.desktop-nav>a,.mobile-navigation nav>a')];
  const sections = ['home', 'sobre', 'problema', 'solucao', 'processo', 'demonstracao', 'servicos', 'contacto'].map(id => document.getElementById(id)).filter(Boolean);
  const landing = document.body.dataset.page === '/';
  let frame = null, entrance = null, selected = null;
  const motionAllowed = () => !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused');
  function select(id) {
    if (selected === id) return;
    selected = id;
    links.forEach(link => {
      const target = link.getAttribute('href')?.split('#')[1] || 'home';
      if (target === id) link.setAttribute('aria-current', landing ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
  }
  function update() {
    frame = null;
    header.toggleAttribute('data-scrolled', window.scrollY >= 50);
    if (landing) {
      const line = header.getBoundingClientRect().bottom + Math.min(120, window.innerHeight * .12);
      let active = 'home';
      sections.forEach(section => { if (section.getBoundingClientRect().top <= line) active = section.id; });
      select(active);
    } else {
      const route = document.body.dataset.page;
      select(route.startsWith('/servicos') ? 'servicos' : route.startsWith('/demo') ? 'demonstracao' : route.startsWith('/problemas') ? 'problema' : route === '/sobre' ? 'sobre' : route === '/contacto' ? 'contacto' : null);
    }
  }
  update();
  window.addEventListener('scroll', () => { if (frame === null) frame = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('pageshow', update);
  if (motionAllowed()) entrance = header.animate(
    [{ opacity: 0, transform: 'translateY(-32px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 700, easing: 'ease-in-out' }
  );
  function preferenceChanged() { if (!motionAllowed()) { entrance?.cancel(); entrance = null; } }
  document.addEventListener('dipanda:motion-change', preferenceChanged);
  reduced.addEventListener('change', preferenceChanged);
}
