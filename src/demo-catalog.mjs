import { demos } from './data.mjs';
import { button, escape, tag } from './components.mjs';

// Only published demos with a real destination belong in the catalogue.
export function publishedDemos() {
  return demos.filter(demo => {
    try { return new URL(demo.href).protocol === 'https:'; } catch { return false; }
  });
}

const chart = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="10" width="50" height="44" rx="6"/><path d="M7 22h50M17 43v-9m10 9V29m10 14v-6m10 6V27"/></svg>';

export function demoEmpty() {
  return `<div class="demo-empty"><span class="demo-empty-icon">${chart}</span><h2>Demos em preparação</h2><p>Ainda não existem demos publicadas. Em breve, poderá explorar aqui soluções analíticas em Power BI, Metabase e outras ferramentas.</p></div>`;
}

export function demoCards() {
  const entries = publishedDemos();
  return entries.length ? `<div class="demo-catalog-grid">${entries.map(demo => `<a class="solution-project-card" href="${escape(demo.href)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escape(demo.title)} (abre num novo separador)"><div class="solution-project-image"><img src="${escape(demo.image)}" alt="${escape(demo.title)}" loading="lazy" width="736" height="552"></div><div class="solution-project-copy"><span class="solution-project-status">${escape(demo.platform)}</span><h2>${escape(demo.title)}</h2><p>${escape(demo.description)}</p><span class="solution-project-action">Abrir demo ↗</span></div></a>`).join('')}</div>` : demoEmpty();
}

export function demoOverview() {
  const entries = publishedDemos();
  const preview = entries.length ? `<div class="demo-explorer" data-demo-explorer data-demo-entry><div class="demo-explorer-side"><p class="demo-explorer-label">Demos disponíveis</p><div class="demo-explorer-tabs" role="tablist" aria-label="Demonstrações">${entries.slice(0, 3).map((demo, i) => `<button type="button" role="tab" id="demo-tab-${escape(demo.slug)}" aria-controls="demo-panel-${escape(demo.slug)}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-demo-image="${escape(demo.image)}" data-demo-title="${escape(demo.title)}" data-demo-href="${escape(demo.href)}"><span>${escape(demo.title)}</span><span aria-hidden="true">↗</span></button>`).join('')}</div><div class="demo-explorer-details">${entries.slice(0, 3).map((demo, i) => `<div role="tabpanel" id="demo-panel-${escape(demo.slug)}" aria-labelledby="demo-tab-${escape(demo.slug)}" ${i ? 'hidden' : ''}><p>${escape(demo.description)}</p>${button('Ver mais demos', '/demos/', 'lime')}</div>`).join('')}</div></div><a class="demo-explorer-preview" href="${escape(entries[0].href)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escape(entries[0].title)} (abre num novo separador)" data-demo-link><img src="${escape(entries[0].image)}" alt="${escape(entries[0].title)}" width="736" height="552" loading="lazy" data-demo-preview></a></div>` : `${demoEmpty()}<div class="demo-catalog-more">${button('Ver mais demos', '/demos/', 'lime')}</div>`;
  return `<section class="section demos-section" id="demonstracao"><div class="container"><div class="section-heading" data-reveal>${tag('Demonstração')}</div>${preview}</div></section>`;
}
