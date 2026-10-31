import { escape, paragraphs, tag, button, contact } from './components.mjs';
import { problemDetails } from './problem-details.mjs';

export function renderProblemPage(problem, hero, problems) {
  const detail = problemDetails[problem.slug];
  const cards = (items, kind) => items.map(([title, body], index) => `<article class="problem-detail-card ${kind}" data-reveal>${kind === 'problem-detail-benefit' ? '' : `<span class="problem-detail-marker" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}<h3>${escape(title)}</h3><p>${escape(body)}</p></article>`).join('');
  return `${hero}
  <div class="container"><nav class="problem-detail-nav" aria-label="Nesta página"><a href="#o-problema">O problema</a><a href="#como-ajudamos">Como ajudamos</a><a href="#beneficios">Benefícios</a><a href="#como-trabalhamos">Como trabalhamos</a></nav></div>
  <section class="problem-detail-section" id="o-problema"><div class="container">
    <div class="section-heading section-heading--left" data-reveal><h2>Reconhece estes <em>sinais?</em></h2></div>
    <div class="problem-detail-cards">${cards(detail.signals, 'problem-detail-signal')}</div>
  </div></section>
  <section class="problem-detail-section problem-detail-solution problem-detail-band" id="como-ajudamos"><div class="container${detail.integrationFlow ? ' problem-detail-split' : ' problem-detail-approach-text'}">
    <div data-reveal>${tag('Como ajudamos')}<h2>${escape(detail.approachTitle)}</h2>${button('Pedir um diagnóstico', '#contacto', 'lime')}</div>
    ${detail.integrationFlow ? `<figure class="problem-flow-preview" data-flow-preview data-flow-static="/assets/diagrams/integracao-dados-isometrica-static.png" data-flow-animated="/assets/diagrams/integracao-dados-isometrica.gif"><a href="/assets/diagrams/integracao-dados-isometrica-static.png" target="_blank" rel="noopener" aria-label="Ampliar a ilustração de integração de dados"><img src="/assets/diagrams/integracao-dados-isometrica-static.png" data-flow-image width="1200" height="900" alt="ERP, CRM, Excel, APIs, ficheiros e portais ligados a um servidor central de dados integrados." loading="lazy"></a><figcaption><button type="button" class="plain-button" data-flow-toggle aria-pressed="false">Reproduzir fluxo</button></figcaption></figure>` : ''}
  </div></section>
  <section class="problem-detail-section" id="beneficios"><div class="container">
    <div class="section-heading section-heading--left" data-reveal>${tag('Benefícios')}<h2>O que muda no <em>dia a dia.</em></h2></div>
    <div class="problem-detail-cards">${cards(detail.benefits, 'problem-detail-benefit')}</div>
  </div></section>
  <section class="problem-detail-section problem-detail-process problem-detail-band" id="como-trabalhamos"><div class="container${detail.stepsGrid ? ' problem-detail-process-grid' : ' problem-detail-split'}">
    <div class="section-heading section-heading--left${detail.processImage ? ' problem-detail-process-visual' : ''}" data-reveal>${tag('Como trabalhamos')}<h2>${detail.processTitle ? escape(detail.processTitle) : 'Um caminho claro, <em>em conjunto.</em>'}</h2>${detail.processImage ? `<div class="problem-detail-process-frame"><img class="problem-detail-process-image" src="${detail.processImage}" width="747" height="1120" alt="Profissional sentada à secretária, a analisar informação junto do computador." loading="lazy"></div>` : ''}</div>
    <div class="problem-detail-reading${detail.stepsGrid ? ' problem-detail-reading--grid' : ''}">${detail.steps.map(([title, body]) => `<details><summary><h3>${escape(title)}</h3><span aria-hidden="true">+</span></summary><div>${paragraphs(body)}</div></details>`).join('')}</div>
  </div></section>
  <section class="problem-detail-section related-section"><div class="container">
    <div class="section-heading section-heading--left" data-reveal>${tag('Continue a explorar')}<h2>Outros desafios do <em>seu negócio.</em></h2></div>
    <div class="related-grid">${problems.filter(item => item.slug !== problem.slug).map(item => `<a class="related-card problem-detail-related" href="/problemas/${item.slug}/" data-reveal><img class="problem-related-preview" src="${escape(item.image)}" width="640" height="400" alt="${escape(item.imageAlt || item.label)}" loading="lazy"><h3>${escape(item.label)}</h3><p>${escape(item.summary)}</p><span class="problem-detail-related-link">Saiba mais <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a>`).join('')}</div>
  </div></section>${contact()}`;
}
