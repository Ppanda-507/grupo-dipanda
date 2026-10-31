import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, renderPage } from '../src/pages.mjs';
import { processSteps } from '../src/data.mjs';
import { navigationLinks } from '../src/navigation-links.mjs';
import { analyticsScope, nextServices } from '../src/service-page.mjs';

test('every service has overview, separate scope, shared process titles and related previews before contact', () => {
  const routes = Object.keys(pages).filter(route => route.startsWith('/servicos/'));
  assert.equal(routes.length, 7);
  for (const route of routes) {
    const html = renderPage(route);
    assert.match(html, /O que é\?/);
    assert.match(html, /Como funciona\?/);
    assert.match(html, /Onde atua\?/);
    assert.match(html, /class="section service-audience"/);
    assert.match(html, /class="section service-scope service-band"/);
    assert.match(html, /class="service-scope-grid"><details>/);
    assert.doesNotMatch(html, /Da ideia à utilização|class="detail-grid"|class="check-list"/);
    const delivery = html.match(/<ol class="service-delivery-steps">([\s\S]*?)<\/ol>/)?.[1];
    if (route === '/servicos/pedido-personalizado') assert.equal(delivery, undefined);
    else {
      assert.ok(delivery, route);
      for (const step of processSteps) assert.ok(delivery.includes(step.title), `${route}: ${step.title}`);
      assert.equal((delivery.match(/<li /g) || []).length, 4);
    }
    const related = html.match(/<section class="section service-related">([\s\S]*?)<\/section>/)?.[1];
    assert.ok(related, route);
    assert.equal((related.match(/class="service-related-card"/g) || []).length, 3);
    assert.ok(!related.includes(`href="${route}/"`), `${route}: no self recommendation`);
    assert.ok(html.indexOf('class="section service-related"') < html.indexOf('id="contacto"'));
    assert.ok([...related.matchAll(/href="([^"]+)"/g)].every(([,href]) => pages[href.replace(/\/$/,'')]));
  }
});

test('related services advance through the catalogue without recommending the current page', () => {
  const first = nextServices({slug:'consultoria-bi'}).map(item=>item.slug);
  const second = nextServices({slug:first[0]}).map(item=>item.slug);
  assert.equal(first.length,3);
  assert.equal(new Set(first).size,3);
  assert.ok(!first.includes('consultoria-bi'));
  assert.equal(second[0], first[1]);
  assert.equal(nextServices({slug:'desenvolvimento-web'})[0].slug,'consultoria-bi');
});

test('home navigation scrolls while inner navigation opens real pages', () => {
  assert.equal(navigationLinks(true).find(item=>item.target==='problema').href,'/#problema');
  for(const item of navigationLinks(false)) {
    assert.ok(!item.href.includes('#'));
    assert.ok(pages[item.href==='/' ? '/' : item.href.replace(/\/$/,'')],item.href);
  }
  assert.equal(navigationLinks(false).find(item=>item.target==='problema').href,'/problemas/informacao-dispersa/');
  assert.equal(navigationLinks(false).find(item=>item.target==='servicos').href,'/servicos/');
});

test('analytics definitions remain attached to their concepts and SaaS scope omits component management', () => {
  assert.match(analyticsScope['Data Warehousing'],/repositório/);
  assert.match(analyticsScope['Modelação de dados'],/tabelas, as relações/);
  assert.match(analyticsScope['ETL e pipelines de dados'],/extrair, transformar e carregar/);
  assert.doesNotMatch(renderPage('/servicos/desenvolvimento-saas'),/<h3>Gestão de componentes e recursos<\/h3>/);
  assert.match(renderPage('/servicos/atendimento-automacao'),/através das redes sociais, sites ou canais de vendas/);
});

test('service index presents alternating summaries and the solution index has three entries', () => {
  const html = renderPage('/servicos');
  assert.equal((html.match(/class="section service-summary(?: service-band)?"/g)||[]).length,7);
  assert.doesNotMatch(html,/class="services-grid"/);
  assert.equal((renderPage('/solucoes').match(/class="section service-summary(?: service-band)?"/g)||[]).length,3);
});

test('community products retain their planned status and subscription model', () => {
  const html = renderPage('/servicos/produtos-dipanda');
  assert.match(html, /ainda sem disponibilidade anunciada/);
  assert.match(html, /Planos por produto/);
  assert.match(html, /quando estiver disponível/);
  assert.doesNotMatch(html, /solution-project-card/);
});
