import { site } from './site.mjs';
import { services, processSteps, figmaText } from './data.mjs';
import { solutions } from './solutions.mjs';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const paragraphs = text => text.trim().split(/\n\s*\n/).map(p => `<p>${escape(p)}</p>`).join('');
export const arrow = (light = false) => `<img src="/assets/figma/${light ? '2-57-aedaf' : '2-687-465eb'}.svg" width="20" height="20" alt="" aria-hidden="true">`;
export const button = (label, href, style = 'dark', attributes = '') => `<a class="button button--${style} button--motion" data-soft-hover href="${escape(href)}" ${attributes}><span class="button-inner"><span class="button-label">${escape(label)}</span><span class="button-arrow" aria-hidden="true">${arrow(style === 'lime')}</span></span></a>`;
export const flowButton = (label, href) => `<a class="flow-button" href="${escape(href)}"><span class="flow-fill" aria-hidden="true"></span><span class="flow-arrow flow-arrow--incoming" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span><span class="flow-label">${escape(label)}</span><span class="flow-arrow flow-arrow--outgoing" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a>`;
export const motionButton = (label, href) => button(label, href, 'lime');
export const tag = text => `<p class="eyebrow"><span aria-hidden="true"></span>${escape(text)}</p>`;
export const icon = (src, type = '') => `<span class="icon-tile ${type}" aria-hidden="true"><img src="${src}" ${src.includes('18db1') ? 'width="19.9067" height="21.8139"' : 'width="24" height="24"'} alt=""></span>`;
export const logo = (dark = false) => `<a class="brand ${dark ? 'brand--dark' : ''}" href="/" aria-label="Dipanda — página inicial"><img class="brand-mark" src="/assets/brand/dipanda-mark.svg" width="36" height="38" alt=""><span>dipanda</span></a>`;

export function header(home = false) {
  const links = [['Home', '/'], ['Sobre', '/#sobre'], ['Problema', '/#problema'], ['Nossa solução', '/#solucao'], ['Demonstração', '/#demonstracao'], ['Serviços', '/#servicos']];
  return `<header class="site-header ${home ? 'site-header--hero' : 'site-header--inner'}" data-header>
    <div class="header-shell">
    ${logo(!home)}
    <nav class="desktop-nav" aria-label="Navegação principal">${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}${flowButton('Contacto', '/#contacto')}</nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-navigation" data-menu-toggle><span>Menu</span><span class="menu-lines" aria-hidden="true"><i></i><i></i></span></button>
    </div>
    <dialog class="mobile-navigation" id="mobile-navigation" aria-label="Navegação principal" data-menu-dialog><div class="menu-top">${logo(true)}<button class="close-button" aria-label="Fechar menu" data-menu-close>×</button></div><nav>${links.map(([label, href], i) => `<a href="${href}"><small>0${i + 1}</small>${label}<span class="mobile-menu-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a>`).join('')}${button('Contacto', '/#contacto', 'lime')}</nav></dialog>
  </header>`;
}

const footerIcon = name => {
  const paths = {
    location: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  return '<span class="footer-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg></span>';
};

export function footer() {
  return `<footer class="site-footer"><div class="footer-surface"><div class="footer-grid">
    <div class="footer-brand">${logo()}<a href="/#contacto">Conectar-se</a><button class="motion-toggle" type="button" data-motion-toggle aria-pressed="false"><span class="pause-icon" aria-hidden="true">Ⅱ</span><span data-motion-label>Pausar animações</span></button></div>
    <div><h2>Links principais</h2><a href="/">Home</a><a href="/sobre/">Sobre nós</a><a href="/#problema">Problema</a><a href="/#demonstracao">Demonstração</a><a href="/servicos/">Solução e Serviços</a></div>
    <div><h2>Serviços</h2>${services.map(s => `<a href="/servicos/${s.slug}/">${escape(s.title === 'Desenvolvimento SaaS' ? 'Desenvolvimento Saas' : s.title)}</a>`).join('')}</div>
    <div><h2>Localização</h2><p class="footer-location">${footerIcon('location')}<span>Porto, Portugal</span></p><p class="footer-location">${footerIcon('location')}<span>Luanda, Angola</span></p><p class="footer-location">${footerIcon('location')}<span>Houston, Estados unidos</span></p></div>
  </div><div class="footer-contact"><h2>Contactos</h2><dl><div><dt>E-mail</dt><dd>${footerIcon('mail')}<a href="mailto:${escape(site.email)}">${escape(site.email)}</a></dd></div><div><dt>Telefone</dt><dd>${footerIcon('phone')}<a href="tel:${escape(site.phoneHref)}">${escape(site.phone)}</a></dd></div><div><dt>Horário</dt><dd>${footerIcon('clock')}<span>${escape(site.hours)}</span></dd></div></dl></div><div class="footer-bottom"><div class="footer-legal"><a href="/termos-e-condicoes/">Termos e Condições</a><a href="/politica-de-privacidade/">Políticas de Privacidade</a><a href="/politica-de-cookies/">Políticas de Cookies</a><button type="button" data-cookie-settings>Gerir cookies</button></div><p>© 2025 Grupo dipanda. Todos os direitos reservados.</p></div></div></footer>`;
}

export function cookieUI() {
  return `<section class="cookie-banner" aria-labelledby="cookie-banner-title" data-cookie-banner hidden>
    <div class="cookie-copy"><h2 id="cookie-banner-title">A sua privacidade também conta.</h2><p>Usamos cookies essenciais para guardar a sua escolha. Com a sua autorização, podemos lembrar a sua preferência de animações. <a href="/politica-de-cookies/">Saiba mais</a>.</p><p class="form-status" role="status" data-cookie-status></p></div>
    <div class="cookie-actions"><button class="plain-button" type="button" data-cookie-reject>Rejeitar opcionais</button><button class="plain-button" type="button" data-cookie-accept>Aceitar todos</button><button class="text-button" type="button" data-cookie-settings>Personalizar</button></div>
  </section>
  <dialog class="cookie-dialog" aria-labelledby="cookie-title" aria-describedby="cookie-description" data-cookie-dialog>
    <div class="dialog-heading"><div>${tag('A escolha é sua')}<h2 id="cookie-title">Preferências de cookies</h2></div><button class="close-button" type="button" aria-label="Fechar preferências de cookies" data-cookie-close>×</button></div>
    <p id="cookie-description">Pode usar todo o site sem aceitar cookies opcionais. Altere a sua escolha a qualquer momento em “Gerir cookies”, no rodapé.</p>
    <div class="cookie-category"><div><h3>Essenciais</h3><p>Guardam a sua escolha de cookies durante 180 dias. Estão sempre ativos.</p></div><span class="always-active">Sempre ativos</span></div>
    <label class="cookie-category"><span><strong>Funcionais</strong><span>Lembram se prefere pausar as animações, durante 180 dias.</span></span><input type="checkbox" name="functional" role="switch" aria-label="Cookies funcionais"></label>
    <p class="cookie-note">Este site não utiliza cookies de publicidade nem ferramentas de análise de terceiros.</p>
    <p class="form-status" role="status" data-cookie-status></p>
    <div class="dialog-actions"><button class="plain-button" type="button" data-cookie-reject>Rejeitar opcionais</button><button class="plain-button" type="button" data-cookie-accept>Aceitar todos</button><button class="plain-button plain-button--lime" type="button" data-cookie-save>Guardar escolha</button></div>
    <a class="text-link" href="/politica-de-cookies/">Consultar a política de cookies ↗</a>
  </dialog><noscript><div class="noscript-notice">Os cookies opcionais estão desativados. Ative o JavaScript para usar os formulários e ajustar as preferências.</div></noscript>`;
}

export function contact(section = true, standalone = false) {
  return `<${section ? 'section' : 'div'} class="section contact-section" id="contacto"><div class="container">
    <div class="section-heading" data-reveal>${tag('CONTACTOS')}<${standalone ? 'h1' : 'h2'}>Vamos falar sobre os seus <em>dados.</em></${standalone ? 'h1' : 'h2'}><p>${escape(figmaText('5598:3849'))}</p></div>
    <div class="contact-shell" data-reveal><form class="contact-form" data-contact-form action="/api/contact" method="post">
      <div class="field"><label for="contact-name">Nome</label><input id="contact-name" name="name" placeholder="Nome completo" autocomplete="name" minlength="2" maxlength="120" required></div>
      <div class="field"><label for="contact-email">E-mail</label><input id="contact-email" type="email" name="email" placeholder="Seu melhor e-mail" autocomplete="email" autocapitalize="none" maxlength="254" required></div>
      <div class="field"><label for="contact-message">Mensagem</label><textarea id="contact-message" name="message" placeholder="Escreva aqui a sua mensagem" minlength="10" maxlength="5000" rows="6" required></textarea></div>
      <div class="honeypot" aria-hidden="true"><label>Deixe este campo vazio<input name="website" tabindex="-1" autocomplete="off"></label></div>
      <input type="hidden" name="startedAt" value="" data-started-at>
      <button class="button button--dark button--motion" data-soft-hover type="submit"><span class="button-inner"><span class="button-label" data-submit-label>Enviar</span><span class="button-arrow" aria-hidden="true">${arrow()}</span></span></button>
      <p class="contact-consent">${escape(figmaText('5598:4846'))} <a href="/politica-de-privacidade/">Política de privacidade</a>.</p><div class="form-status" role="status" aria-live="polite" data-contact-status></div>
    </form></div>
  </div></${section ? 'section' : 'div'}>`;
}

export function process() {
  return `<section class="section process-section" id="solucao"><div class="container">
    <div class="section-heading solution-heading" data-reveal>${tag('Nossa solução')}<h2>A nossa especialidade é<br><em>Business Intelligence.</em></h2><p>Complementamos essa capacidade com desenvolvimento web e automação, de acordo com as necessidades da sua empresa.</p></div>
    <div class="solution-grid">${solutions.map(solution => `<a class="solution-card" href="${solution.href}" aria-label="Saiba mais sobre ${escape(solution.title)}" data-reveal>
      <div class="solution-card-heading"><h3>${escape(solution.title)}</h3><span class="solution-arrow" aria-hidden="true">${arrow()}</span></div>
      <div class="solution-images"><span class="solution-cover">${solutionImage(solution.cover || solution.images[0], 'auto, 400px')}</span></div>
      <div class="solution-features">${icon(solution.icon)}${solution.features.map(feature => `<span>${escape(feature)}</span>`).join('')}</div>
      <p class="solution-description">${escape(solution.description)}</p>
    </a>`).join('')}</div>
    <div class="section-heading process-heading" id="processo">${tag('Processo de trabalho')}<h2 data-whisper><span data-whisper-word>Clareza</span> <span data-whisper-word>em</span> <span data-whisper-word>cada</span> <span data-whisper-word>etapa.</span><br><em class="orange-bright"><span class="word-rotator process-rotator" data-whisper-word data-word-rotator data-words='["Valor em cada entrega.","Desde o primeiro dia"]'><span class="word-width" aria-hidden="true">Valor em cada entrega.</span><span class="word-current" data-word-current aria-hidden="true">Valor em cada entrega.</span><span class="word-next" data-word-next aria-hidden="true"></span><span class="sr-only">Valor em cada entrega. Desde o primeiro dia.</span></span></em></h2><p>Da primeira conversa à entrega, alinhamos objetivos, validamos a solução consigo e preparamos a sua equipa para a utilizar.</p></div>
    <div class="workflow-board"><ol class="workflow-list" aria-label="Etapas do processo de trabalho">${processSteps.map((step, index) => `<li class="workflow-row workflow-row--${index + 1}" data-workflow-entry><span class="workflow-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div class="workflow-content"><p class="workflow-kicker">Etapa ${String(index + 1).padStart(2, '0')}</p><h3>${escape(step.title)}</h3><p class="workflow-description">${escape(step.description)}</p><p class="workflow-outcome"><span>O que fica consigo</span>${escape(step.outcome)}</p></div></li>`).join('')}</ol></div>
    <div class="process-cta" data-reveal><div><h3>O próximo passo começa com uma conversa.</h3><p>Conte-nos o desafio do seu negócio. Vamos definir consigo o melhor ponto de partida.</p></div>${motionButton('Agendar consultoria', '/#contacto')}</div></div></section>`;
}

export function serviceCard(service) {
  const summary = service.description.trim().match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim() || service.description;
  return `<article class="service-card ${service.featured ? 'is-featured' : ''}" data-pricing-card>
    ${service.featured ? '<span class="service-badge" data-loop-animation>Comece por aqui</span>' : ''}
    <div class="service-top">${icon(service.icon)}<h3>${escape(service.title)}</h3></div>
    <p class="service-tagline">${escape(summary)}</p>
    <div class="investment"><span>Sob consulta</span><small>Proposta à medida do projeto</small></div>
    ${button('Saiba mais', '/servicos/' + service.slug + '/', service.featured ? 'dark' : 'lime')}
    <h4 class="service-features-title">O que podemos fazer</h4>
    <ul class="service-benefits">${service.benefits.map(b => `<li><img src="/assets/figma/2-687-7b108.svg" width="20" height="20" alt="">${escape(b)}</li>`).join('')}</ul>
    <details class="service-details"><summary>Detalhes e indicação <span aria-hidden="true">+</span></summary><div class="service-copy">${paragraphs(service.description)}<h4>Para quem é indicado?</h4><p>${escape(service.audience)}</p></div></details>
  </article>`;
}

export function solutionImage([file, alt, width, height], sizes, decorative = false) {
  if (file.endsWith('.gif')) {
    const poster = '/assets/process/' + file.replace(/\.gif$/, '.png');
    return `<img src="${poster}" data-animated-src="/assets/process/${file}" data-still-src="${poster}" alt="${decorative ? '' : escape(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;
  }
  const base = file.replace(/\.png$/, '');
  return `<img src="/assets/process/${file}" srcset="${((['bi-cover-campaign-v3.png', 'web-cover-campaign-v4.png', 'chatbot-night-cover-v4.png', 'chatbot-night-photo-v3.png'].includes(file) || file.startsWith('service-')) ? [160, 240, 320, 480, 960, 1280] : [160, 240, 320, 480]).map(size => `/assets/process/responsive/${base}-${size}.png ${size}w`).join(', ')}, /assets/process/${file} ${width}w" sizes="${sizes}" alt="${decorative ? '' : escape(alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;
}

export function solutionGallery(solution, { includeCover = true, title = '', embedded = false } = {}) {
  if (!solution) return '';
  return `<section class="solution-gallery${embedded ? ' solution-gallery--projects' : ''}" aria-label="${escape(title || solution.title)}">${embedded ? '' : '<div class="container">'}${title ? `<div class="section-heading"><h2>${escape(title)}</h2></div>` : ''}${includeCover && solution.cover ? `<figure class="solution-gallery-cover">${solutionImage(solution.cover, 'auto, (min-width: 1280px) 1280px, calc(100vw - 48px)')}</figure>` : ''}<div class="solution-gallery-grid">${solution.images.map(image => `<figure>${solutionImage(image, 'auto, (min-width: 900px) 400px, calc(100vw - 48px)')}</figure>`).join('')}</div>${embedded ? '' : '</div>'}</section>`;
}
