import { servicePhotoHero } from './service-banners.mjs';
import { renderServiceSections, renderServiceIndex } from './service-page.mjs';
import { demoOverview, demoCards } from './demo-catalog.mjs';
import { solutions } from './solutions.mjs';
import { solutionGallery, solutionImage, businessIntelligenceVisual } from './components.mjs';
import { responsiveImageAttributes } from './responsive-images.mjs';
import { site } from './site.mjs';
import { problems, services, figmaText } from './data.mjs';
import { escape, paragraphs, tag, icon, button, motionButton, header, footer, cookieUI, contact, process as processSection, serviceCard } from './components.mjs';
import { legalContent } from './policies.mjs';
import { integrationStrip } from './integrations.mjs';
import { heroPoster } from './hero-poster.mjs';
import { renderProblemPage } from './problem-page.mjs';

// Repeat the original Figma SVG at its native size, sharing its 1px outer border.
const heroGridCopies = [-1, 0, 1].flatMap(row => [-1, 0, 1].filter(column => row || column).map(column => `<img class="hero-grid-copy" data-grid-repeat="${row},${column}" src="/assets/figma/2-57-13a95.svg" width="1509" height="929" alt="" style="left:${-145 + column * 1508}px;top:${-97.5 + row * 928}px">`)).join('');

const whisperWords = text => text.split(' ').map(word => `<span data-whisper-word>${escape(word)}</span>`).join(' ');

const aboutOpening = whisperWords('Aproximamos');

function aboutSection() {
  const rows = [['Eficiência', 'Cabeça de dono', 'Aprendizagem'], ['Ensinamento', 'Partilha', 'Agilidade', 'Velocidade'], ['Democracia', 'Dados ao alcance de todos'], ['Marcar gerações', 'Eficiência', 'Agilidade']];
  return `<section class="section about-section" id="sobre"><div class="container"><div class="section-heading">${tag('Sobre a dipanda')}<h2 class="about-statement" data-whisper><span class="about-line">${aboutOpening} ${whisperWords('pessoas, negócios e')}</span> <span class="about-line">${whisperWords('dados')} <span class="inline-symbol inline-symbol--blue" data-whisper-icon>${icon('/assets/figma/2-401-43766.svg')}</span> ${whisperWords('desenvolvemos')}</span> <span class="about-line">${whisperWords('soluções')} <span class="inline-symbol" data-whisper-icon>${icon('/assets/figma/2-401-bdfc9.svg')}</span> <span class="word-rotator" data-word-fit data-whisper-word data-word-rotator data-words='["personalizadas","escaláveis","confiáveis","inteligentes","flexíveis"]'><span class="word-width" aria-hidden="true">personalizadas</span><span class="word-current" data-word-current aria-hidden="true">personalizadas</span><span class="word-next" data-word-next aria-hidden="true"></span><span class="sr-only">personalizadas, escaláveis, confiáveis, inteligentes e flexíveis</span></span></span></h2></div>
  <div class="about-grid"><article class="about-card" data-reveal><h3>Quem somos?</h3><p>${escape(figmaText('2:457'))}</p></article><div class="values-card" data-loop-animation data-reveal aria-label="Os nossos valores: eficiência, cabeça de dono, aprendizagem, ensinamento, partilha, agilidade, velocidade, democracia, dados ao alcance de todos e marcar gerações.">${rows.map((row, index) => `<div class="marquee-row ${index % 2 ? 'marquee-row--reverse' : ''}" aria-hidden="true"><div class="marquee-track" data-pattern-length="${row.length}">${[0, 1].map(() => `<div class="marquee-group">${Array.from({ length: 4 }, () => row.map(value => `<span>${value}</span>`).join('')).join('')}</div>`).join('')}</div></div>`).join('')}</div><article class="about-card" data-reveal style="--stagger:120ms"><h3>Como?</h3><p>${escape(figmaText('5564:3278'))}</p></article></div></div></section>`;
}

function problemSection() {
  return `<section class="section problems-section" id="problema"><div class="container"><div class="section-heading" data-reveal>${tag('Problema')}<h2>Situações que vemos <em>repetir-se</em><br class="desktop-break"> nas empresas.</h2></div><div class="problem-tabs" role="tablist" aria-label="Problemas que resolvemos" data-problem-tabs>${problems.map((p, i) => `<button role="tab" type="button" id="tab-${p.slug}" aria-controls="panel-${p.slug}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab-index="${i}">${escape(p.label)}</button>`).join('')}</div><div class="problem-panels" data-problem-entry>${problems.map((p, i) => `<div class="problem-panel" id="panel-${p.slug}" role="tabpanel" aria-labelledby="tab-${p.slug}" tabindex="0" ${i ? 'hidden' : ''}><div class="problem-image ${p.imageClass || ''}"><img src="${p.image}" ${responsiveImageAttributes(p.image)} alt="${escape(p.imageAlt || p.articleTitle)}" width="450" height="400" loading="lazy"></div><div class="problem-content">${icon('/assets/figma/5545-3146-18db1.svg')}<h3>${escape(p.title)}</h3><div class="problem-description">${paragraphs(p.description)}</div>${motionButton('SAIBA MAIS', `/problemas/${p.slug}/`)}</div></div>`).join('')}</div><div class="carousel-controls problem-controls" aria-label="Navegação dos problemas"><button class="carousel-arrow" type="button" aria-label="Problema anterior" data-problem-prev disabled><img src="/assets/figma/2-687-fb705.svg" width="24" height="24" alt=""></button><span class="carousel-progress" role="status" aria-live="polite" aria-atomic="true" data-problem-count>01 — 04</span><button class="carousel-arrow" type="button" aria-label="Próximo problema" data-problem-next><img src="/assets/figma/2-687-fb705.svg" width="24" height="24" alt=""></button></div></div></section>`;
}

const demoSection = demoOverview;

function serviceSection(all = false) {
  return `<section class="section services-section" id="servicos"><div class="container"><div class="section-heading" data-reveal>${tag('serviços')}${all ? '<h1><em class="orange-bright">Soluções</em> adaptadas à realidade do <em class="orange-bright">seu negócio</em>.</h1>' : ''}${all ? '<p>Escolha o ponto de partida que faz sentido para si. Definimos o âmbito, as entregas e o investimento depois de compreender o seu pedido.</p>' : button('ver todos serviços', '/servicos/')}</div><div class="services-${all ? 'grid' : 'carousel'}" data-pricing-group ${all ? '' : 'data-service-carousel tabindex="0" aria-label="Serviços — deslize para ver mais"'}>${services.map(serviceCard).join('')}</div>${all ? '' : '<div class="carousel-controls"><button class="carousel-arrow" type="button" aria-label="Serviços anteriores" data-carousel-prev><img src="/assets/figma/2-687-fb705.svg" width="24" height="24" alt=""></button><span class="carousel-progress" data-carousel-progress>01 — 06</span><button class="carousel-arrow" type="button" aria-label="Próximos serviços" data-carousel-next><img src="/assets/figma/2-687-fb705.svg" width="24" height="24" alt=""></button></div>'}</div></section>`;
}

function home() {
  return `<section class="hero" id="home">${header(true)}<div class="hero-surface">${heroPoster}<canvas class="hero-shader" data-hero-shader width="1" height="1" aria-hidden="true"></canvas><div class="hero-art" aria-hidden="true"><img class="hero-grid" src="/assets/figma/2-57-13a95.svg" alt="">${heroGridCopies}<canvas class="hero-grid-canvas" width="1509" height="929" aria-hidden="true"></canvas></div><div class="hero-copy"><span class="hero-badge">CONSULTORIA · TECNOLOGIA</span><h1 data-hero-text><span class="hero-text-loop"><span class="hero-text-loop-reveal"><span class="hero-text-loop-word">Transforme</span></span><span class="hero-text-loop-cursor" aria-hidden="true"></span></span> <span class="hero-data-line">dados em</span><br><span class="hero-decisions"><span>Decisões</span> <span>estratégicas</span></span></h1><p data-hero-text>Cruze os dados da tua empresa e descubra exatamente onde está a <span class="hero-highlight hero-highlight--orange">perder</span> tempo e dinheiro para maximizar os seus ganhos</p><div class="hero-buttons" data-hero-buttons>${motionButton('Agendar consultoria', '/#contacto')}<a class="pill-link pill-link--glass" data-soft-hover href="/#demonstracao">ver DEMO</a></div></div><div class="hero-tools"><p>Ferramentas que ligamos aos seus dados</p>${integrationStrip()}</div></div></section>
  ${aboutSection()}${problemSection()}${processSection()}${demoSection()}${serviceSection()}${contact()}`;
}

function innerHero(label, title, description, image = '', extra = '') {
  return `<section class="inner-hero"><div class="container"><a class="breadcrumb" href="/">Home <span aria-hidden="true">↗</span></a><div class="inner-hero-grid ${image ? '' : 'inner-hero-grid--text'}"><div>${tag(label)}<h1>${title}</h1><div class="inner-description">${paragraphs(description)}</div>${extra}</div>${image ? `<div class="inner-hero-image"><img src="${image}" ${responsiveImageAttributes(image, '640px')} width="640" height="620" alt="${escape(label)}" fetchpriority="high"></div>` : ''}</div></div></section>`;
}

function problemArticle(problem) {
  const hero = innerHero('Problema', escape(problem.articleTitle), problem.description, problem.image, button('Pedir um diagnóstico', '#contacto'))
    .replace('class="inner-hero"', 'class="inner-hero problem-detail-hero"')
    .replace(tag('Problema'), '')
    .replace('alt="Problema"', `alt="${escape(problem.imageAlt || problem.articleTitle)}"`);
  return renderProblemPage(problem, hero, problems);
}

function companyPage() {
  return `${innerHero('Sobre a dipanda', 'Pessoas, negócios<br>e <em>dados.</em>', figmaText('2:457'), '', button('Vamos conversar', '/#contacto'))}${aboutSection()}${processSection()}${contact()}`;
}

function solutionServiceHero(service, solution) {
  const hero = solution.hero;
  if (hero.chat || hero.backdrop) {
    const background = solutionImage(hero.image, '100vw', true).replace('loading="lazy"', 'loading="eager" fetchpriority="high"');
    const conversation = hero.chat ? '<div class="service-hero-conversation"><p class="service-hero-time"><time>02:00</time></p><p class="service-hero-question">Ainda posso agendar?</p><p class="service-hero-answer">Sim. Estou aqui para ajudar.</p></div>' : '';
    return `<section class="inner-hero inner-hero--solution inner-hero--night${hero.backdrop ? ' inner-hero--bi' : ''}"><div class="service-hero-backdrop" aria-hidden="true">${background}</div><div class="container"><a class="breadcrumb" href="/">Home <span aria-hidden="true">↗</span></a><div class="service-hero-label">${tag('Nossa solução')}<h1>${escape(solution.title)}</h1></div><div class="service-hero-layout"><div class="service-hero-copy"><h2>${escape(hero.lead)} <em class="service-hero-emphasis service-hero-emphasis--${hero.color}">${escape(hero.highlight)}</em></h2>${conversation}</div></div><div class="service-hero-bottom"><div class="inner-description">${paragraphs(service.description)}</div>${button('Pedir uma proposta', '/#contacto')}</div></div></section>`;
  }
  const image = (solution.coverPhoto ? businessIntelligenceVisual(solution) : solutionImage(hero.image, '(min-width: 900px) 600px, calc(100vw - 40px)')).replace('loading="lazy"', 'loading="eager" fetchpriority="high"');
  const conversation = hero.chat ? '<div class="service-hero-conversation"><p class="service-hero-time"><time>02:00</time></p><p class="service-hero-question">Ainda posso agendar?</p><p class="service-hero-answer">Sim. Estou aqui para ajudar.</p></div>' : '';
  return `<section class="inner-hero inner-hero--solution"><div class="container"><a class="breadcrumb" href="/">Home <span aria-hidden="true">↗</span></a><div class="service-hero-label">${tag('Nossa solução')}<h1>${escape(solution.title)}</h1></div><div class="service-hero-layout"><div class="service-hero-copy"><h2>${escape(hero.lead)} <em class="service-hero-emphasis service-hero-emphasis--${hero.color}">${escape(hero.highlight)}</em></h2>${conversation}</div><div class="service-hero-cutout${hero.framed ? ' service-hero-cutout--photo' : ''}">${image}</div></div><div class="service-hero-bottom"><div class="inner-description">${paragraphs(service.description)}</div>${button('Pedir uma proposta', '/#contacto')}</div></div></section>`;
}

function serviceDetail(service) {
  const solution = solutions.find(item => item.href === `/servicos/${service.slug}/`);
  const hero = !['consultoria-bi','atendimento-automacao','desenvolvimento-web'].includes(service.slug) ? servicePhotoHero(service) : solution?.hero ? solutionServiceHero(service, solution) : innerHero(service.slug === 'produtos-dipanda' ? 'Produtos Dipanda' : 'Servi\u00e7os', escape(service.title), service.description, '', button('Pedir uma proposta', '#contacto'));
  return `${hero}${renderServiceSections(service, solution)}${contact()}`;
}

function legalPage(type) {
  const content = legalContent(type);
  return `${innerHero('Informação legal', escape(content.title), `Última atualização: ${site.updatedAt}`)}<section class="section legal-section"><div class="container legal-layout"><nav class="legal-nav" aria-label="Índice da política">${content.sections.map((section, i) => `<a href="#legal-${i}">${escape(section.title)}</a>`).join('')}${type === 'cookies' ? '<button class="plain-button" data-cookie-settings>Gerir cookies</button>' : ''}</nav><div class="legal-content">${content.sections.map((section, i) => `<section id="legal-${i}"><h2>${escape(section.title)}</h2>${section.html || paragraphs(section.body)}</section>`).join('')}</div></div></section>`;
}

export const pages = {
  '/500': { title: 'Erro interno \u2014 Dipanda', description: 'N\u00e3o foi poss\u00edvel abrir esta p\u00e1gina.', body: () => innerHero('Erro 500', 'Algo n\u00e3o correu como <em>esperado.</em>', 'Ocorreu um erro ao abrir esta p\u00e1gina. Tente novamente dentro de momentos. Se o problema continuar, contacte-nos.', '', button('Voltar \u00e0 Home', '/')) },
  '/503': { title: 'Temporariamente indispon\u00edvel \u2014 Dipanda', description: 'O servi\u00e7o est\u00e1 temporariamente indispon\u00edvel.', body: () => innerHero('Erro 503', 'Voltamos dentro de <em>momentos.</em>', 'O servi\u00e7o est\u00e1 temporariamente indispon\u00edvel. Tente novamente mais tarde.', '', button('Voltar \u00e0 Home', '/')) },
  '/solucoes': { title: 'Nossa solu\u00e7\u00e3o \u2014 Dipanda', description: 'Conhe\u00e7a as nossas solu\u00e7\u00f5es de Business Intelligence, desenvolvimento web e automa\u00e7\u00e3o.', body: () => renderServiceIndex(true) + contact() },
  '/demos': { title: 'Demos — Dipanda', description: 'Explore as demos de soluções analíticas da Dipanda.', body: () => innerHero('Demonstração', 'Todas as <em>demos.</em>', 'Explore as nossas soluções analíticas. Cada demo disponível abre diretamente na ferramenta em que foi publicada.') + '<section class="section demo-catalog"><div class="container">' + demoCards() + '</div></section>' + contact() },
  '/': { title: 'Dipanda — Transforme dados em decisões estratégicas', description: 'Consultoria tecnológica, dados e Business Intelligence. Ligue informação, acompanhe resultados e tome decisões com mais clareza e confiança.', body: home },
  '/sobre': { title: 'Sobre a Dipanda', description: figmaText('2:457'), body: companyPage },
  '/servicos': { title: 'Soluções e Serviços — Dipanda', description: 'Consultoria BI, soluções analytics, atendimento e automação, desenvolvimento SaaS e pedidos personalizados.', body: () => renderServiceIndex() + contact() },
  '/contacto': { title: 'Contacto — Dipanda', description: 'Vamos falar sobre os seus dados. Contacte a equipa Dipanda.', body: () => contact(true, true) },
  '/termos-e-condicoes': { title: 'Termos e Condições — Dipanda', description: 'Condições de utilização do site e dos serviços da Dipanda.', body: () => legalPage('terms') },
  '/politica-de-privacidade': { title: 'Política de Privacidade — Dipanda', description: 'Como tratamos os seus dados pessoais e como pode exercer os seus direitos.', body: () => legalPage('privacy') },
  '/politica-de-cookies': { title: 'Política de Cookies — Dipanda', description: 'Conheça os cookies do site e controle as suas preferências.', body: () => legalPage('cookies') },
  '/404': { title: 'Página não encontrada — Dipanda', description: 'A página que procura não está disponível.', body: () => innerHero('404', 'Vamos encontrar<br>o caminho <em>certo.</em>', 'A página que procura não está disponível. Pode regressar à página inicial ou falar com a nossa equipa.', '', button('Voltar à Home', '/')) }
};
problems.forEach(problem => { pages[`/problemas/${problem.slug}`] = { title: `${problem.articleTitle} — Dipanda`, description: problem.summary, body: () => problemArticle(problem) }; });
services.forEach(service => { pages[`/servicos/${service.slug}`] = { title: `${service.title} — Dipanda`, description: service.description, body: () => serviceDetail(service) }; });
const webSolution = solutions[1];
pages['/servicos/desenvolvimento-web'] = { title: webSolution.title + ' — Dipanda', description: webSolution.description, body: () => serviceDetail({
  slug: 'desenvolvimento-web', title: webSolution.title, description: webSolution.description,
  audience: 'Empresas que precisam de um site ou aplicação web para apresentar o seu negócio, recolher informação e apoiar os seus processos.',
  benefits: ['Sites institucionais e páginas de apresentação', 'Aplicações web à medida', 'Formulários e integrações', 'Design adaptado a desktop e mobile'],
  deliverables: ['Definição dos objetivos e requisitos.', 'Estrutura e design validados consigo.', 'Desenvolvimento e testes nos diferentes ecrãs.', 'Entrega e orientação para utilização.']
}) };

export function renderPage(route) {
  const page = pages[route] || pages['/404'];
  const homePage = route === '/';
  const navigationSection = route === '/solucoes' ? 'solucao' : solutions.some(solution => solution.href.replace(/\/$/, '') === route) ? 'solucao' : '';
  const body = page.body();
  const contactHref = body.includes('data-contact-form') && body.includes('id="contacto"') ? '#contacto' : '/contacto/';
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const absolute = siteUrl ? `${siteUrl}${route === '/' ? '/' : route + '/'}` : '';
  const html = `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"><meta name="theme-color" content="${homePage ? '#004cd3' : '#131313'}"><title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}">${absolute ? `<link rel="canonical" href="${escape(absolute)}"><meta property="og:url" content="${escape(absolute)}">` : ''}<meta property="og:type" content="website"><meta property="og:locale" content="pt_PT"><meta property="og:site_name" content="Dipanda"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="/assets/brand/dipanda-favicon.svg"><link rel="preload" href="/fonts/plus-jakarta-500.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/site.css"><link rel="stylesheet" href="/css/navigation.css"><link rel="stylesheet" href="/css/buttons.css"><link rel="stylesheet" href="/css/about.css">${homePage ? '<link rel="stylesheet" href="/css/hero.css">' : ''}<link rel="stylesheet" href="/css/refinements.css"><link rel="stylesheet" href="/css/brand.css">${route.startsWith('/problemas/') ? '<link rel="stylesheet" href="/css/problem-detail.css">' : ''}${homePage || route === '/sobre' ? '<link rel="stylesheet" href="/css/process.css">' : ''}${homePage ? '<link rel="stylesheet" href="/css/hero-refresh.css">' : ''}${['/404','/500','/503'].includes(route) ? '<meta name="robots" content="noindex">' : ''}${(route.startsWith('/servicos') || route === '/solucoes') ? '<link rel="stylesheet" href="/css/service-detail.css">' : ''}<link rel="stylesheet" href="/css/typography.css"></head><body data-page="${escape(route)}"${navigationSection ? ` data-nav-section="${navigationSection}"` : ''}><a class="skip-link" href="#main">Saltar para o conteúdo</a>${homePage ? '' : header()}<main id="main">${body}</main>${footer()}${cookieUI()}<script type="module" src="/js/app.js"></script></body></html>`;
  // Resolve contact links in shared menus, footers and page-specific CTAs alike.
  return html.replace(/href="(?:\/#contacto|#contacto)"/g, `href="${contactHref}"`);
}
