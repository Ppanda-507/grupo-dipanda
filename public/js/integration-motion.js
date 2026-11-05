export function initIntegrationMotion() {
 const marquee = document.querySelector('[data-tool-marquee]');
 if (!marquee) return;
 // CSS also respects reduced motion, visitor preferences and hidden pages.
 if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
   marquee.toggleAttribute('data-in-view', entries[0].isIntersecting);
  }).observe(marquee);
 } else {
  marquee.setAttribute('data-in-view', '');
 }
}
