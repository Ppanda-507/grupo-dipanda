import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ headless:true, executablePath:process.env.BROWSER_EXECUTABLE });
const output = path.join(os.tmpdir(),'dipanda-browser-checks'), checks=[], errors=[];
const check = (name,result) => { assert.ok(result,name); checks.push(name); console.log('PASS',name); };
await mkdir(output,{recursive:true});
try {
 const context = await browser.newContext({viewport:{width:1280,height:900}});
 const page = await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.TEST_URL,{waitUntil:'networkidle',timeout:60000});
 if(await page.locator('[data-cookie-banner]').isVisible()) await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
 await page.evaluate(()=>document.fonts.ready);
 for(const width of [1280,960,920,768,640,390,320,960,1280]) {
  await page.setViewportSize({width,height:900});
  await page.locator('.values-card').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  check('all rows cover the full width through the loop at '+width,await page.locator('.values-card').evaluate(card=>{
   return [...card.querySelectorAll('.marquee-row')].every(row=>{
    const track=row.querySelector('.marquee-track'), groups=[...track.children];
    if(groups[0].innerHTML!==groups[1].innerHTML||groups[0].getBoundingClientRect().width+1<row.clientWidth) return false;
    const animation=track.getAnimations()[0];
    if(!animation) return false;
    const time=animation.currentTime,state=animation.playState;
    animation.pause();
    const duration=animation.effect.getTiming().duration;
    const result=[0,.25,.5,.75,.999].every(phase=>{
     animation.currentTime=duration*phase;
     const bounds=row.getBoundingClientRect();
     const visible=[...track.querySelectorAll('span')].map(pill=>pill.getBoundingClientRect()).filter(pill=>pill.right>bounds.left&&pill.left<bounds.right);
     return visible.length>0&&visible[0].left<=bounds.left+9&&visible.at(-1).right>=bounds.right-9&&visible.every((pill,index)=>!index||pill.left-visible[index-1].right<=9);
    });
    animation.currentTime=time;
    if(state==='running')animation.play();
    return result;
   });
  }));
  check('values remain clipped inside the page at '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if([960,390].includes(width))await page.locator('.values-card').screenshot({path:path.join(output,'values-full-width-'+width+'.png')});
 }
 check('loop speed stays proportional to pattern count',await page.locator('.values-card').evaluate(card=>[...card.querySelectorAll('.marquee-row')].every(row=>{
  const track=row.querySelector('.marquee-track'), repeats=track.children[0].children.length/Number(track.dataset.patternLength);
  return Math.abs(parseFloat(getComputedStyle(track).animationDuration)-repeats*(row.classList.contains('marquee-row--reverse')?29:24))<.01;
 })));
 await page.locator('.site-footer').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>[...document.querySelectorAll('.marquee-track')].every(track=>getComputedStyle(track).animationPlayState==='paused'));
 check('value loops pause offscreen',await page.locator('.marquee-track').evaluateAll(tracks=>tracks.every(track=>getComputedStyle(track).animationPlayState==='paused')));
 await context.close();
 for(const options of [{reducedMotion:'reduce'},{javaScriptEnabled:false}]) {
  const fallback=await browser.newContext({viewport:{width:960,height:900},...options});
  const p=await fallback.newPage();
  await p.goto(process.env.TEST_URL,{waitUntil:'networkidle',timeout:60000});
  await p.evaluate(()=>document.fonts.ready);
  check('wide rows also fill with '+(options.javaScriptEnabled===false?'JavaScript disabled':'reduced motion'),await p.locator('.values-card').evaluate(card=>[...card.querySelectorAll('.marquee-row')].every(row=>row.querySelector('.marquee-group').getBoundingClientRect().width>=row.clientWidth)));
  await fallback.close();
 }
 check('no browser errors',errors.length===0);
 await writeFile(path.join(output,'values-marquee-results.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
