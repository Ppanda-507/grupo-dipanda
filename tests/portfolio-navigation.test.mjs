import test from 'node:test';
import assert from 'node:assert/strict';
import { demos } from '../src/data.mjs';
import { demoCards, demoOverview } from '../src/demo-catalog.mjs';
import { pages, renderPage } from '../src/pages.mjs';

test('demo catalogue shows an honest empty state and no individual demo pages', () => {
  assert.equal(demos.length, 0);
  assert.match(demoCards(), /Demos em preparação/);
  assert.match(demoOverview(), /href="\/demos\/"/);
  assert.match(demoOverview(), /Ver mais demos/);
  assert.ok(!Object.keys(pages).some(route => route.startsWith('/demo/')));
});

test('published demos link directly to their analytics platform', () => {
  const entry = { slug: 'test', title: 'Test dashboard', description: 'Test', image: '/test.png', platform: 'Power BI', href: 'https://app.powerbi.com/view?r=test' };
  demos.push(entry);
  try {
    assert.match(demoCards(), /href="https:\/\/app.powerbi.com\/view\?r=test"/);
    assert.match(demoOverview(), /data-demo-href="https:\/\/app.powerbi.com\/view\?r=test"/);
    assert.doesNotMatch(demoOverview(), /href="\/demo\//);
    entry.href = '';
    assert.match(demoCards(), /Demos em preparação/);
  } finally { demos.pop(); }
});

test('solution pages select Nossa solução and only show the real web project', () => {
  for (const slug of ['consultoria-bi', 'atendimento-automacao', 'desenvolvimento-web']) {
    const html = renderPage('/servicos/' + slug);
    assert.match(html, /data-nav-section="solucao"/);
    if (slug === 'desenvolvimento-web') {
      assert.match(html, /href="https:\/\/queluzcardoso.com\/"/);
      assert.match(html, /assets\/projects\/queluz-cardoso.jpg/);
    } else {
      assert.match(html, /Projetos em breve/);
      assert.doesNotMatch(html, /solution-project-card/);
    }
  }
});
