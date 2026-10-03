// Pre-resampled variants keep dense detail smooth at desktop sizes; originals remain available for high-density screens.
export function responsiveImageAttributes(src, fallbackSize = '450px') {
  if (src !== '/assets/problems/relatorios-manuais-v3.png') return '';
  const base = '/assets/problems/responsive/relatorios-manuais-v3';
  return `srcset="${[360, 480, 720, 960].map(width => `${base}-${width}.png ${width}w`).join(', ')}, ${src} 1448w" sizes="auto, (max-width: 767px) calc(100vw - 88px), ${fallbackSize}" decoding="async"`;
}
