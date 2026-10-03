import { initSectionMotion } from './section-motion.js';
import { initAboutMotion } from './about-motion.js';
import { initMotion } from './motion.js';
import { initConsent } from './consent.js';
import { initHeroMotion } from './hero-motion.js';
import { initHeroShader } from './hero-shader.js';
import { initNavigation } from './navigation.js';

initMotion();
// Draw the background before starting the foreground entrance. Its inline
// initial frame already matches the mesh while modules and WebGL prepare.
initHeroShader();
initAboutMotion();
initSectionMotion();
initConsent();
initNavigation();
initHeroMotion();

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
  function select(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
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
      const email = document.createElement('a'); email.href = 'mailto:comercial@grupodipanda.com'; email.textContent = 'comercial@grupodipanda.com'; status.append(email, '.');
      status.dataset.state = 'error';
    } finally { submit.disabled = false; label.textContent = 'Enviar'; }
  });
});

const datasets = {
  dre: { labels: ['Receita', 'Custos', 'EBITDA', 'Resultado líquido'], values: [186000, 121000, 42000, 28500], previous: [169000, 116000, 35000, 23000], types: ['money', 'money', 'money', 'money'], chart: [48, 63, 54, 70, 79, 88] },
  balancete: { labels: ['Débitos', 'Créditos', 'Saldo', 'Contas analisadas'], values: [248000, 219500, 28500, 74], previous: [230000, 207000, 23000, 70], types: ['money', 'money', 'money', 'number'], chart: [52, 68, 64, 75, 72, 86] },
  operacional: { labels: ['Pedidos', 'Concluídos', 'Pendentes', 'Taxa de conclusão'], values: [1240, 1138, 102, 91.8], previous: [1180, 1050, 130, 89], types: ['number', 'number', 'number', 'percent'], chart: [46, 58, 51, 72, 77, 92] }
};
const money = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 1 });
const format = (value, type) => type === 'money' ? money.format(value) : type === 'percent' ? `${number.format(value)}%` : number.format(value);
const safe = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
document.querySelectorAll('[data-dashboard]').forEach(dashboard => {
  const data = datasets[dashboard.dataset.dashboard];
  const period = dashboard.querySelector('[data-demo-period]');
  let rows = [];
  function render() {
    const multiplier = period.value === 'month' ? 1 / 3 : period.value === 'year' ? 4 : 1;
    rows = data.labels.map((label, i) => {
      const fixed = data.types[i] === 'percent' || label === 'Contas analisadas';
      const value = fixed ? data.values[i] : Math.round(data.values[i] * multiplier);
      const previous = fixed ? data.previous[i] : Math.round(data.previous[i] * multiplier);
      return { label, value, previous, type: data.types[i], change: (value / previous - 1) * 100 };
    });
    dashboard.querySelector('[data-demo-metrics]').innerHTML = rows.map(row => `<div class="metric-card"><span class="metric-label">${safe(row.label)}</span><strong class="metric-value">${safe(format(row.value, row.type))}</strong><span class="metric-change">${row.change >= 0 ? '+' : ''}${number.format(row.change)}% face ao período anterior</span></div>`).join('');
    dashboard.querySelector('[data-demo-table]').innerHTML = rows.map(row => `<tr><th scope="row">${safe(row.label)}</th><td>${safe(format(row.value, row.type))}</td><td>${safe(format(row.previous, row.type))}</td><td>${row.change >= 0 ? '+' : ''}${number.format(row.change)}%</td></tr>`).join('');
    const labels = period.value === 'year' ? ['Jan', 'Mar', 'Mai', 'Jul', 'Set', 'Nov'] : period.value === 'month' ? ['S1', 'S2', 'S3', 'S4'] : ['Abr', 'Mai', 'Jun'];
    const points = data.chart.slice(-labels.length);
    const chart = dashboard.querySelector('[data-demo-chart]');
    chart.innerHTML = points.map((value, i) => `<div class="chart-bar-column"><div class="chart-bar" style="--height:${value}%" title="${labels[i]}: índice ${value}"></div><span>${labels[i]}</span></div>`).join('');
    chart.setAttribute('aria-label', `Índice de evolução de exemplo: ${labels.map((label, i) => `${label}, ${points[i]}`).join('; ')}. Valores ilustrativos normalizados de 0 a 100.`);
    dashboard.querySelector('.chart-heading>span').textContent = 'Índice ilustrativo · 0–100';
    dashboard.querySelector('[data-demo-status]').textContent = `Indicadores atualizados: ${period.selectedOptions[0].text}. Dados fictícios.`;
  }
  period.addEventListener('change', render);
  dashboard.querySelector('[data-demo-download]').addEventListener('click', () => {
    const csv = '\uFEFF' + ['Dados fictícios — Dipanda', 'Indicador;Período atual;Período anterior;Variação (%)', ...rows.map(row => [row.label, row.value, row.previous, row.change.toFixed(2)].join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `dipanda-${dashboard.dataset.dashboard}-${period.value}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
});
