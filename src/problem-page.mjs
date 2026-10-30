import { escape, paragraphs, tag, button, contact } from './components.mjs';
import { problemDetails } from './problem-details.mjs';

export function renderProblemPage(problem, hero, problems) {
  const detail = problemDetails[problem.slug];
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>';
  const cards = (items, kind) => items.map(([title, body], index) => `<article class="problem-detail-card ${kind}" data-reveal><span class="problem-detail-marker" aria-hidden="true">${kind === 'problem-detail-benefit' ? check : String(index + 1).padStart(2, '0')}</span><h3>${escape(title)}</h3><p>${escape(body)}</p></article>`).join('');
  return `${hero}
  <div class="container"><nav class="problem-detail-nav" aria-label="Nesta página"><a href="#o-problema">O problema</a><a href="#como-ajudamos">Como ajudamos</a><a href="#beneficios">Benefícios</a><a href="#como-trabalhamos">Como trabalhamos</a></nav></div>
  <section class="problem-detail-section" id="o-problema"><div class="container">
    <div class="section-heading section-heading--left" data-reveal>${tag('O problema')}<h2>Reconhece estes <em>sinais?</em></h2></div>
    <div class="problem-detail-cards">${cards(detail.signals, 'problem-detail-signal')}</div>
  </div></section>
  <section class="problem-detail-section problem-detail-solution" id="como-ajudamos"><div class="container problem-detail-split">
    <div data-reveal>${tag('Como ajudamos')}<h2>${escape(detail.approachTitle)}</h2><p>${escape(detail.approach)}</p>${button('Pedir um diagnóstico', '#contacto', 'lime')}</div>
    <div class="problem-detail-scope" data-reveal><h3>O que trabalhamos consigo</h3><ul>${detail.scope.map(item => `<li>${check}<span>${escape(item)}</span></li>`).join('')}</ul></div>
  </div></section>
  <section class="problem-detail-section" id="beneficios"><div class="container">
    <div class="section-heading section-heading--left" data-reveal>${tag('Benefícios')}<h2>O que muda no <em>dia a dia.</em></h2></div>
    <div class="problem-detail-cards">${cards(detail.benefits, 'problem-detail-benefit')}</div>
  </div></section>
  <section class="problem-detail-section problem-detail-process" id="como-trabalhamos"><div class="container problem-detail-split">
    <div class="section-heading section-heading--left" data-reveal>${tag('Como trabalhamos')}<h2>Um caminho claro, <em>em conjunto.</em></h2></div>
    <div class="problem-detail-reading">${detail.steps.map(([title, body]) => `<details><summary><h3>${escape(title)}</h3><span aria-hidden="true">+</span></summary><div>${paragraphs(body)}</div></details>`).join('')}</div>
  </div></section>
  <section class="problem-detail-section related-section"><div class="container">
    <div class="section-heading section-heading--left" data-reveal>${tag('Continue a explorar')}<h2>Outros desafios do <em>seu negócio.</em></h2></div>
    <div class="related-grid">${problems.filter(item => item.slug !== problem.slug).map(item => `<a class="related-card problem-detail-related" href="/problemas/${item.slug}/" data-reveal><h3>${escape(item.label)}</h3><p>${escape(item.summary)}</p><span class="problem-detail-related-link">Saiba mais <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a>`).join('')}</div>
  </div></section>${contact()}`;
}
