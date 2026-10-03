const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const frameDuration = 1000 / 60;
const motionAllowed = () => !reduced.matches && !document.hidden && !document.documentElement.hasAttribute('data-motion-paused');

export function initHeroMotion() {
  const hero = document.querySelector('.hero-surface');
  if (!hero) return;
  let visible = true;
  const controllers = [];
  let entrance = [];
  const allowed = () => visible && motionAllowed();

  // Hero 01 from the supplied reference: 32px fade-up over one second,
  // with 100ms between heading, supporting copy and calls to action.
  if (allowed()) {
    const animate = (element, delay) => {
      if (element) entrance.push(element.animate(
        [{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { fill: 'backwards', duration: 1000, delay, easing: 'ease-in-out' }
      ));
    };
    hero.querySelectorAll('[data-hero-text]').forEach((element, index) => animate(element, index * 100));
    animate(hero.querySelector('[data-hero-buttons]'), 200);
    const strip = document.querySelector('.integration-strip');
    if (strip && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        if (motionAllowed()) animate(strip, 600);
      });
      observer.observe(strip);
    }
  }

  const grid = hero.querySelector('.hero-grid');
  const canvas = hero.querySelector('.hero-grid-canvas');
  const art = hero.querySelector('.hero-art');
  if (grid && canvas && art) {
    const width = 1509, height = 929, cell = 116;
    const rasterScale = Math.min(1, Math.sqrt(500_000 / (width * height)));
    let context = null, raster = null;
    function prepareRaster() {
      if (raster) return true;
      canvas.width = Math.floor(width * rasterScale);
      canvas.height = Math.floor(height * rasterScale);
      context = canvas.getContext('2d');
      if (!context) return false;
      context.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
      // Rasterise the final SVG once, only when a fine pointer needs it.
      // Repeated drawImage(SVG) calls made every interactive frame expensive.
      const texture = document.createElement('canvas');
      texture.width = canvas.width; texture.height = canvas.height;
      const textureContext = texture.getContext('2d');
      if (!textureContext) return false;
      textureContext.drawImage(grid, 0, 0, width * rasterScale, height * rasterScale);
      raster = texture;
      return true;
    }
    const tiles = [];
    for (let y = 0; y < height; y += cell) for (let x = 0; x < width; x += cell) {
      tiles.push({ ox: x, oy: y, x, y, w: Math.min(cell, width - x), h: Math.min(cell, height - y) });
    }
    let mouse = null, frame = null, lastTime = 0;
    const active = () => allowed() && finePointer.matches && grid.complete && grid.naturalWidth > 0;
    function reset() {
      cancelAnimationFrame(frame); frame = null; lastTime = 0; mouse = null;
      tiles.forEach(tile => { tile.x = tile.ox; tile.y = tile.oy; });
      art.removeAttribute('data-grid-active');
    }
    function draw(time) {
      if (!active()) { reset(); return; }
      if (!prepareRaster()) { reset(); return; }
      const ticks = Math.min(lastTime ? (time - lastTime) / frameDuration : 1, 3);
      const returnRate = 1 - Math.pow(.92, ticks);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      let moving = false, displaced = false;
      tiles.forEach(tile => {
        const previousX = tile.x, previousY = tile.y;
        if (mouse) {
          const dx = tile.x + tile.w / 2 - mouse.x;
          const dy = tile.y + tile.h / 2 - mouse.y;
          const distance = Math.hypot(dx, dy);
          // Larger grid cells need a wider field than the sample's 22px dots.
          const radius = 150;
          if (distance < radius) {
            const force = (radius - distance) / radius * 6 * ticks;
            tile.x += (distance > .001 ? dx / distance : 1) * force;
            tile.y += (distance > .001 ? dy / distance : 0) * force;
          }
        }
        tile.x += (tile.ox - tile.x) * returnRate;
        tile.y += (tile.oy - tile.y) * returnRate;
        moving ||= Math.abs(tile.x - previousX) + Math.abs(tile.y - previousY) > .025;
        displaced ||= Math.abs(tile.x - tile.ox) + Math.abs(tile.y - tile.oy) > .08;
        // Reuse the final Figma grid itself, including its gradient and rounded
        // corners; only its cells' positions respond to the pointer.
        context.drawImage(raster, tile.ox * rasterScale, tile.oy * rasterScale, tile.w * rasterScale, tile.h * rasterScale, tile.x, tile.y, tile.w, tile.h);
      });
      art.toggleAttribute('data-grid-active', displaced);
      if (moving || (!mouse && displaced)) frame = requestAnimationFrame(draw);
      else { frame = null; lastTime = 0; }
    }
    function wake() { if (active() && frame === null) frame = requestAnimationFrame(draw); }
    hero.addEventListener('pointermove', event => {
      if (!active() || event.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      // The original art container is rotated 180°. Undo that rotation when
      // converting the pointer to grid coordinates.
      const imageRect = grid.getBoundingClientRect();
      const bounds = rect.width ? rect : imageRect;
      mouse = { x: width - (event.clientX - bounds.left) * width / bounds.width, y: height - (event.clientY - bounds.top) * height / bounds.height };
      wake();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse = null; wake(); });
    window.addEventListener('resize', reset, { passive: true });
    controllers.push({ update: () => { if (!active()) reset(); } });
  }

  function update() {
    hero.toggleAttribute('data-hero-in-view', allowed());
    if (!motionAllowed()) { entrance.forEach(animation => animation.cancel()); entrance = []; }
    controllers.forEach(controller => controller.update());
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(hero);
  document.addEventListener('dipanda:motion-change', update);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  finePointer.addEventListener('change', update);
  window.addEventListener('pagehide', () => { visible = false; update(); });
  window.addEventListener('pageshow', () => { visible = hero.getBoundingClientRect().bottom > 0; update(); });
  update();
}
