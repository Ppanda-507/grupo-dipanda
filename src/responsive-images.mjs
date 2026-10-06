// Pre-resampled variants keep dense detail smooth at desktop sizes; originals remain available for high-density screens.
export function responsiveImageAttributes(src, fallbackSize = '450px') {
  const name = src.match(/^\/assets\/problems\/(relatorios-manuais-v3|numeros-duvidosos-v2|dependencia-v2|(?:informacao-dispersa|relatorios-manuais|numeros-duvidosos|dependencia)-(?:editorial|pessoas)-v1)\.png$/)?.[1];
  if (!name) return '';
  const base = `/assets/problems/responsive/${name}`;
  return `srcset="${[360, 480, 720, 960].map(width => `${base}-${width}.png ${width}w`).join(', ')}, ${src} 1448w" sizes="auto, (max-width: 767px) calc(100vw - 88px), ${fallbackSize}" decoding="async"`;
}
