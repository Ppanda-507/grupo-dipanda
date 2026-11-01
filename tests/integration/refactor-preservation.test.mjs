import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pages,renderPage} from '../../src/pages/index.mjs';
import manifest from '../../config/public-assets.json' with {type:'json'};

test('preserves original pages and public assets except explicitly approved visual updates',()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('../fixtures/refactor-baseline.json',import.meta.url),'utf8'));
  const approved=JSON.parse(fs.readFileSync(new URL('../fixtures/approved-visual-updates.json',import.meta.url),'utf8'));
  const old=process.env.SITE_URL;
  process.env.SITE_URL=baseline.publicEnvironment.SITE_URL;
  const digest=value=>createHash('sha256').update(value).digest('hex');
  try{
    assert.deepEqual(Object.keys(pages).sort(),Object.keys(baseline.pageHashes).sort());
    for(const [route,hash]of Object.entries(baseline.pageHashes))assert.equal(digest(renderPage(route)),approved.pageHashes[route] || hash,route);
    for(const file of manifest.files){
      const bytes=fs.readFileSync(new URL('../../public/'+file,import.meta.url));
      const approvedHash=approved.publicHashes['public/'+file];
      // Approved CSS hashes use LF so Git's Windows checkout conversion is harmless.
      assert.equal(digest(approvedHash ? bytes.toString('utf8').replace(/\r\n/g,'\n') : bytes),approvedHash || baseline.publicHashes['public/'+file],file);
    }
  }finally{if(old===undefined)delete process.env.SITE_URL;else process.env.SITE_URL=old;}
});
