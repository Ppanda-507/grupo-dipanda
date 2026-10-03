export function initIntegrationMotion() {
 const strip = document.querySelector('[data-tool-selector]');
 if (!strip) return;
 const tools = [...strip.querySelectorAll('.integration-tool')];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let visible = false, timer = null, index = 0;
 const stop = () => { clearTimeout(timer); timer = null; };
 const allowed = () => visible && !document.hidden && !reduced.matches && !document.documentElement.hasAttribute('data-motion-paused');
 const update = () => {
  stop();
  if (!allowed()) return;
  timer = setTimeout(() => {
   index = (index + 1) % tools.length;
   tools.forEach((tool, i) => tool.classList.toggle('is-active', i === index));
   update();
  }, 3000);
 };
 if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(strip);
 } else { visible = true; update(); }
 document.addEventListener('visibilitychange', update);
 document.addEventListener('dipanda:motion-change', update);
 reduced.addEventListener('change', update);
 window.addEventListener('pagehide', stop);
 window.addEventListener('pageshow', update);
}
