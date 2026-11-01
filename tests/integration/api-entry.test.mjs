import test from 'node:test';
import assert from 'node:assert/strict';
import api from '../../api/contact.js';

test('Vercel entry imports the private modules and returns safe non-delivery responses',async()=>{
  const enabled=process.env.CONTACT_ENABLED;
  process.env.CONTACT_ENABLED='false';
  try{
    const method=await api.fetch(new Request('https://audit.dipanda.test/api/contact'));
    const disabled=await api.fetch(new Request('https://audit.dipanda.test/api/contact',{method:'POST',body:'{}'}));
    assert.equal(method.status,405);
    assert.equal(disabled.status,503);
    for(const response of [method,disabled]){
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal(typeof (await response.json()).message,'string');
    }
  }finally{if(enabled===undefined)delete process.env.CONTACT_ENABLED;else process.env.CONTACT_ENABLED=enabled;}
});
