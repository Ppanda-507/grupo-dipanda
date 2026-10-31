import { initIntegrationMotion } from './integration-motion.js';
import { initSectionMotion } from './section-motion.js';
import { initAboutMotion } from './about-motion.js';
import { initMotion } from './motion.js';
import { initConsent } from './consent.js';
import { initHeroMotion } from './hero-motion.js';
import { initHeroShader } from './hero-shader.js';
import { initNavigation } from './navigation.js';
import { initTouchFeedback, initFlowPreview } from './touch-feedback.js';

initMotion();
// Draw the background before starting the foreground entrance. Its inline
// initial frame already matches the mesh while modules and WebGL prepare.
initHeroShader();
initAboutMotion();
initSectionMotion();
initConsent();
initNavigation();
initTouchFeedback();
initFlowPreview();
initHeroMotion();
initIntegrationMotion();

const menu = document.querySelector('[data-menu-dialog]');
const menuToggle = document.querySelector('[data-menu-toggle]');
if (menu && menuToggle) {
  menuToggle.addEventListener('click', () => { menuToggle.focus({ preventScroll: true }); menu.showModal(); menuToggle.setAttribute('aria-expanded', 'true'); document.documentElement.dataset.menuOpen = 'true'; });
  const close = () => menu.close();
  menu.querySelector('[data-menu-close]').addEventListener('click', close);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  menu.addEventListener('close', () => { menuToggle.setAttribute('aria-expanded', 'false'); delete document.documentElement.dataset.menuOpen; });
  menu.addEventListener('click', event => {
    if (event.target !== menu) return;
    const rect = menu.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
}

document.querySelectorAll('[data-problem-tabs]').forEach(tablist => {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const section = tablist.closest('.problems-section');
  const surface = section.querySelector('.problem-panels');
  const previous = section.querySelector('[data-problem-prev]');
  const next = section.querySelector('[data-problem-next]');
  const counter = section.querySelector('[data-problem-count]');
  const mobile = matchMedia('(max-width:767px)');
  let current = 0, scrollFrame = null;
  section.dataset.problemReady = '';
  const offset = index => panels[index].offsetLeft - panels[0].offsetLeft;
  function select(index, focus = false, move = true, instant = false) {
    current = index;
    previous.disabled = index === 0;
    next.disabled = index === tabs.length - 1;
    counter.textContent = String(index + 1).padStart(2,'0') + ' \u2014 ' + String(tabs.length).padStart(2,'0');
    counter.setAttribute('aria-label','Problema ' + (index + 1) + ' de ' + tabs.length + ': ' + tabs[index].textContent);
    tabs.forEach((tab,i) => {
      tab.setAttribute('aria-selected',String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = !mobile.matches && i !== index;
    });
    if (mobile.matches && move) {
      const reduced = document.documentElement.hasAttribute('data-motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
      surface.scrollTo({left:offset(index),behavior:instant || focus || reduced ? 'instant' : 'smooth'});
    }
    if (focus) tabs[index].focus({preventScroll:true});
  }
  previous.addEventListener('click',event => select(Math.max(0,current-1),false,true,event.detail===0));
  next.addEventListener('click',event => select(Math.min(tabs.length-1,current+1),false,true,event.detail===0));
  surface.addEventListener('scroll',() => {
    if (!mobile.matches) return;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      const index = panels.reduce((closest,panel,i) => Math.abs(offset(i)-surface.scrollLeft)<Math.abs(offset(closest)-surface.scrollLeft)?i:closest,0);
      if (index !== current) select(index,false,false);
    });
  },{passive:true});
  mobile.addEventListener('change',() => {surface.scrollLeft=0;select(current,false,true,true);});
  new ResizeObserver(() => {if(mobile.matches)select(current,false,true,true);}).observe(surface);
  select(0,false,true,true);
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',event => select(index,false,true,event.detail===0));
    tab.addEventListener('keydown',event => {
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      if(event.key==='Home')next=0;
      if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();select(next,true);}
    });
  });
});

document.querySelectorAll('[data-service-carousel]').forEach(carousel => {
  const container = carousel.closest('.container');
  const prev = container.querySelector('[data-carousel-prev]');
  const next = container.querySelector('[data-carousel-next]');
  const progress = container.querySelector('[data-carousel-progress]');
  const cards = [...carousel.querySelectorAll('.service-card')];
  const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).columnGap);
  function update() {
    prev.disabled = carousel.scrollLeft < 2;
    next.disabled = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 2;
    progress.textContent = `${String(Math.min(cards.length, Math.round(carousel.scrollLeft / step()) + 1)).padStart(2, '0')} — ${String(cards.length).padStart(2, '0')}`;
  }
  function move(direction, keyboard = false) {
    const reduced = document.documentElement.hasAttribute('data-motion-paused');
    carousel.scrollBy({ left: direction * step(), behavior: keyboard || reduced ? 'instant' : 'smooth' });
  }
  prev.addEventListener('click', event => move(-1, event.detail === 0));
  next.addEventListener('click', event => move(1, event.detail === 0));
  carousel.addEventListener('keydown', event => {
    if (event.target !== carousel || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1, true);
  });
  carousel.addEventListener('scroll', update, { passive: true });
  new ResizeObserver(update).observe(carousel);
  update();
});

document.querySelectorAll('[data-contact-form]').forEach(form => {
  const status = form.querySelector('[data-contact-status]');
  const submit = form.querySelector('button[type="submit"]');
  const label = form.querySelector('[data-submit-label]');
  const startedAt = form.querySelector('[data-started-at]');
  startedAt.value = Date.now();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity() || submit.disabled) return;
    status.textContent = 'A enviar a sua mensagem…';
    status.dataset.state = 'pending';
    submit.disabled = true; label.textContent = 'A enviar';
    try {
      const response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Não foi possível enviar a mensagem.');
      status.textContent = result.message;
      status.dataset.state = 'success';
      form.reset(); startedAt.value = Date.now();
    } catch (error) {
      status.replaceChildren(document.createTextNode(error.name === 'TimeoutError' ? 'O envio demorou mais do que o esperado. Contacte-nos por e-mail antes de repetir o pedido.' : error.message || 'Não foi possível enviar a mensagem.'));
      status.append(document.createTextNode(' Pode contactar-nos em '));
      const email = document.createElement('a'); email.href = 'mailto:geral@grupodipanda.com'; email.textContent = 'geral@grupodipanda.com'; status.append(email, '.');
      status.dataset.state = 'error';
    } finally { submit.disabled = false; label.textContent = 'Enviar'; }
  });
});

// Demo explorer: select with touch, mouse or keyboard.
document.querySelectorAll('[data-demo-explorer]').forEach(explorer => {
 const tabs = [...explorer.querySelectorAll('[role="tab"]')];
 const panels = [...explorer.querySelectorAll('[role="tabpanel"]')];
 const preview = explorer.querySelector('[data-demo-preview]');
 const select = (index, focus = false) => {
  tabs.forEach((tab,i) => {tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
  preview.src=tabs[index].dataset.demoImage;
  preview.alt='Pré-visualização de '+tabs[index].dataset.demoTitle;
  const link = explorer.querySelector('[data-demo-link]');
  if (link) {
    link.href = tabs[index].dataset.demoHref;
    link.setAttribute('aria-label', 'Abrir ' + tabs[index].dataset.demoTitle + ' (abre num novo separador)');
  }
  if(focus)tabs[index].focus({preventScroll:true});
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(index));
  tab.addEventListener('keydown',event=>{
   let next=index;
   if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;
   else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;
   else if(event.key==='Home')next=0;
   else if(event.key==='End')next=tabs.length-1;
   else return;
   event.preventDefault();select(next,true);
  });
 });
});
