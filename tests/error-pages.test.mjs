import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import path from 'node:path';
import { pages, renderPage } from '../src/pages.mjs';
import { createSiteRequestHandler } from '../scripts/site-request-handler.mjs';

async function withServer(options, run) {
  const server = createServer(createSiteRequestHandler({ assetRoot: path.resolve('public'), pages, renderPage, contactRequest: async () => { throw Error('test contact failure'); }, ...options }));
  server.listen(0, '127.0.0.1');
  await once(server,'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
}

test('missing pages and assets return a real uncached 404, including HEAD', async () => {
  await withServer({},async origin=>{
    for(const route of ['/this-page-does-not-exist/','/assets/missing.png','/404/']) {
      const response=await fetch(origin+route);
      assert.equal(response.status,404);
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal(response.headers.get('x-robots-tag'),'noindex');
      assert.match(await response.text(),/Página não encontrada/);
      const head=await fetch(origin+route,{method:'HEAD'});
      assert.equal(head.status,404);
      assert.equal(await head.text(),'');
    }
  });
});

test('error pages use 500/503 statuses and noindex; normal pages remain 200', async () => {
  await withServer({},async origin=>{
    for(const code of [500,503]) {
      const response=await fetch(`${origin}/${code}/`);
      assert.equal(response.status,code);
      const html=await response.text();
      assert.match(html,/<meta name="robots" content="noindex">/);
      assert.match(html,/href="\/contacto\/"/);
      assert.equal(response.headers.get('cache-control'),'no-store');
    }
    assert.equal((await fetch(origin+'/')).status,200);
  });
});

test('unexpected rendering errors return a safe 500 without stack traces', async () => {
  await withServer({renderPage: route=>{if(route==='/')throw Error('PRIVATE_DATABASE_PASSWORD test-stack');return renderPage(route);}},async origin=>{
    const response=await fetch(origin+'/');
    assert.equal(response.status,500);
    const html=await response.text();
    assert.match(html,/Erro interno/);
    assert.doesNotMatch(html,/PRIVATE_DATABASE_PASSWORD|test-stack/);
  });
});

test('a failing error template still has a safe fallback; malformed URLs are 400', async () => {
  await withServer({renderPage:()=>{throw Error('PRIVATE_STACK');}},async origin=>{
    const response=await fetch(origin+'/');
    assert.equal(response.status,500);
    assert.match(await response.text(),/Não foi possível abrir esta página/);
    const malformed=await fetch(origin+'/%E0%A4%A');
    assert.equal(malformed.status,400);
    assert.equal(await malformed.text(),'Pedido inválido.');
    assert.equal((await fetch(origin+'/%00')).status,400);
  });
});

test('unexpected API failures keep JSON and do not cache private responses', async () => {
  await withServer({},async origin=>{
    const response=await fetch(origin+'/api/contact',{method:'POST'});
    assert.equal(response.status,500);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.json()).ok,false);
  });
});
