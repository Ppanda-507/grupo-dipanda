import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pages,renderPage} from '../../src/pages/index.mjs';
import {createSiteRequestHandler} from '../../server/http/site-request-handler.mjs';
import {assertAssetRoot} from '../../server/http/asset-root.mjs';

async function withServer(options, run) {
  const server=createServer(createSiteRequestHandler({assetRoot:path.resolve('public'),pages,renderPage,contactRequest:async()=>{throw Error('No real contact in this test');},...options}));
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  try{await run(`http://127.0.0.1:${server.address().port}`);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

test('HTTP does not expose server, source, configuration, secrets or audit material',async()=>{
  await withServer({},async origin=>{
    for(const route of ['/.env','/.env.example','/.git/config','/server/contact/service.mjs','/scripts/build.mjs','/src/pages/index.mjs','/tests/fixtures/server.mjs','/config/public-assets.json','/docs/audits/history/manifest.json','/assets/%2e%2e/%2e%2e/.env','/%2eenv']){
      const result=await fetch(origin+route);
      assert.equal(result.status,404,route);
      assert.equal(result.headers.get('cache-control'),'no-store');
      assert.doesNotMatch(await result.text(),/SMTP_PASSWORD=|PRIVATE KEY|RESEND_API_KEY=/);
    }
    const css=await fetch(origin+'/css/site.css'); assert.equal(css.status,200);assert.match(css.headers.get('content-type'),/text\/css/);
  });
});

test('CLI static root cannot be the project, server, or another private folder',async()=>{
  for(const folder of [process.cwd(),path.resolve('server'),path.resolve('tests')])await assert.rejects(assertAssetRoot(folder),/Asset root must/);
  assert.ok(await assertAssetRoot(path.resolve('public')));
});

test('symlinked allowed CSS and generated HTML cannot escape the asset directory',async()=>{
  const temporary=await mkdtemp(path.join(os.tmpdir(),'dipanda-private-file-test-'));
  try{
    const assets=path.join(temporary,'public'); await mkdir(assets,{recursive:true});
    // A junction directory uses an otherwise allowed resource path.
    await mkdir(path.join(temporary,'outside-css'));await writeFile(path.join(temporary,'outside-css','site.css'),'PRIVATE_SENTINEL_OUTSIDE_PUBLIC');
    await symlink(path.join(temporary,'outside-css'),path.join(assets,'css'),'junction');
    await withServer({assetRoot:assets},async origin=>{
      const result=await fetch(origin+'/css/site.css');assert.equal(result.status,403);assert.doesNotMatch(await result.text(),/PRIVATE_SENTINEL/);
    });
    const htmlRoot=path.join(temporary,'html');await mkdir(htmlRoot);
    await mkdir(path.join(temporary,'outside-page'));await writeFile(path.join(temporary,'outside-page','index.html'),'PRIVATE_SENTINEL_OUTSIDE_PUBLIC');
    await symlink(path.join(temporary,'outside-page'),path.join(htmlRoot,'sobre'),'junction');
    await withServer({assetRoot:htmlRoot,production:true},async origin=>{
      const result=await fetch(origin+'/sobre/');assert.equal(result.status,500);assert.doesNotMatch(await result.text(),/PRIVATE_SENTINEL/);
    });
  }finally{await rm(temporary,{recursive:true,force:true});}
});
