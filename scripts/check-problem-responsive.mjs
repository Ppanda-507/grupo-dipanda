import assert from 'node:assert/strict';
import { mkdir,writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const { chromium }=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
const output=path.join(os.tmpdir(),'dipanda-browser-checks'),checks=[],errors=[];
const check=(name,result)=>{assert.ok(result,name);checks.push(name);console.log('PASS',name)};
await mkdir(output,{recursive:true});
try {
 const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const page=await desktop.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TEST_URL,{waitUntil:'networkidle',timeout:60000});
 if(await page.locator('[data-cookie-banner]').isVisible())await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
 await page.evaluate(()=>document.fonts.ready);
 const tabs=page.locator('[data-problem-tabs] [role=tab]');
 check('desktop retains the four problem tabs',await tabs.count()===4&&await page.locator('.problem-tabs').isVisible()&&!await page.locator('.problem-controls').isVisible());
 for(let index=0;index<4;index++){
  await tabs.nth(index).click();
  const panel=page.locator('.problem-panel:not([hidden])');
  check('desktop CTA aligns with the image bottom for problem '+(index+1),await panel.evaluate(element=>{
   const image=element.querySelector('.problem-image').getBoundingClientRect(),copy=element.querySelector('.problem-content').getBoundingClientRect(),button=element.querySelector('.button--motion').getBoundingClientRect();
   return Math.abs(image.bottom-button.bottom)<1&&Math.abs(image.top-copy.top)<1&&button.right<image.left;
  }));
 }
 await tabs.nth(0).focus();await page.keyboard.press('ArrowRight');
 check('desktop keyboard selection still works',await tabs.nth(1).getAttribute('aria-selected')==='true'&&await tabs.nth(1).evaluate(el=>el===document.activeElement));
 await tabs.nth(0).click();
 const image=page.locator('#panel-informacao-dispersa .problem-image img');
 await image.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#panel-informacao-dispersa .problem-image img').complete);
 check('first problem loads the editorial photograph with people without an underlay',await image.evaluate(img=>img.getAttribute('src')==='/assets/problems/informacao-dispersa-pessoas-v1.png'&&img.naturalWidth>0&&getComputedStyle(img).objectFit==='cover')&&await page.locator('.problem-underlay').count()===0);
 await page.locator('.problem-panels').screenshot({path:path.join(output,'problem-desktop-aligned.png')});
 await desktop.close();
 for(const width of [390,320,767]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.TEST_URL,{waitUntil:'networkidle',timeout:60000});
  if(await p.locator('[data-cookie-banner]').isVisible())await p.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await p.evaluate(()=>document.fonts.ready);
  check('mobile replaces tabs with touch-sized arrows at '+width,!await p.locator('.problem-tabs').isVisible()&&await p.locator('.problem-controls').isVisible()&&await p.locator('.problem-controls .carousel-arrow').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().width>=44&&button.getBoundingClientRect().height>=44)));
  for(let index=0;index<4;index++){
   check('image, text and Saiba Mais appear in order at '+width+' slide '+(index+1),await p.locator('.problem-panel:not([hidden])').evaluate(element=>{
    const image=element.querySelector('.problem-image').getBoundingClientRect(),copy=element.querySelector('.problem-content').getBoundingClientRect(),description=element.querySelector('.problem-description').getBoundingClientRect(),button=element.querySelector('.button--motion').getBoundingClientRect();
    return image.bottom<=copy.top&&description.bottom<=button.top&&button.bottom<=element.getBoundingClientRect().bottom&&image.width>0;
   }));
   check('counter and article link follow the selected mobile problem at '+width+' slide '+(index+1),(await p.locator('[data-problem-count]').textContent()).startsWith(String(index+1).padStart(2,'0'))&&await p.locator('.problem-panel:not([hidden]) .button--motion').evaluate(button=>button.textContent.trim()==='SAIBA MAIS'&&button.getAttribute('href').startsWith('/problemas/')));
   if(index<3)await p.locator('[data-problem-next]').tap();
  }
  check('mobile arrows stop at both ends at '+width,await p.locator('[data-problem-next]').isDisabled());
  for(let i=0;i<3;i++)await p.locator('[data-problem-prev]').tap();
  check('previous arrows return to the first problem at '+width,await p.locator('[data-problem-prev]').isDisabled()&&(await p.locator('[data-problem-count]').textContent()).startsWith('01'));
  check('mobile page has no horizontal overflow at '+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390)await p.locator('.problem-panels').screenshot({path:path.join(output,'problem-mobile-image-first.png')});
  await p.locator('[data-problem-next]').focus();await p.keyboard.press('Enter');
  check('mobile keyboard activation works at '+width,(await p.locator('[data-problem-count]').textContent()).startsWith('02'));
  await p.setViewportSize({width:1100,height:900});
  check('selected problem survives return to desktop at '+width,await p.locator('.problem-tabs').isVisible()&&!await p.locator('.problem-controls').isVisible()&&await p.locator('[role=tab][aria-selected=true]').getAttribute('data-tab-index')==='1');
  await context.close();
 }
 check('no browser errors',errors.length===0);
 await writeFile(path.join(output,'problem-responsive-results.json'),JSON.stringify({checks,errors},null,2));
}finally{await browser.close()}
