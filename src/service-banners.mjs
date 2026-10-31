import { escape, tag, button } from './components.mjs';

export const serviceImages = {
  'consultoria-bi': ['/assets/process/business-intelligence-dashboard-v3.png', 'Portátil com indicadores e gráficos de análise financeira.', 1672, 941],
  'solucoes-analytics': ['/assets/services/analytics-workstation.jpg', 'Fotografia de um ecrã com gráficos e indicadores de desempenho.', 1920, 1280],
  'atendimento-automacao': ['/assets/process/chatbot-night-photo-v3.png', 'Pessoa consulta o telemóvel durante a noite.', 1881, 836],
  'desenvolvimento-saas': ['/assets/services/team-collaboration.jpg', 'Equipa trabalha em conjunto em computadores portáteis.', 1920, 1281],
  'produtos-dipanda': ['/assets/services/community-fitness.jpg', 'Profissional de fitness num ginásio, uma das áreas dos produtos que queremos criar.', 1920, 1280],
  'pedido-personalizado': ['/assets/services/digital-project.jpg', 'Duas pessoas planeiam um projeto digital com computadores e apontamentos.', 1920, 1280],
  'desenvolvimento-web': ['/assets/process/service-web-cutout-v1.png', 'Profissional apresenta um site num computador portátil.', 1374, 1145]
};

const headlines = {
  'solucoes-analytics': ['Transforme informação em', 'decisões com contexto.'],
  'desenvolvimento-saas': ['Os seus processos,', 'num só sistema.'],
  'produtos-dipanda': ['Produtos para o dia a dia,', 'pensados para todos.'],
  'pedido-personalizado': ['A sua ideia,', 'com uma presença digital.'],
  'desenvolvimento-web': ['Se o nosso site é assim, imagina como será', 'o seu.']
};

export function servicePhotoHero(service) {
  const [src, alt, width, height] = serviceImages[service.slug];
  const [lead, emphasis] = headlines[service.slug];
  return `<section class="inner-hero inner-hero--solution inner-hero--night inner-hero--service-photo" data-service="${escape(service.slug)}"><div class="service-hero-backdrop" aria-hidden="true"><img src="${src}" alt="" width="${width}" height="${height}" fetchpriority="high"></div><div class="container"><a class="breadcrumb" href="/">Home <span aria-hidden="true">↗</span></a><div class="service-hero-label">${tag('Serviços')}<h1>${escape(service.title)}</h1></div><div class="service-hero-layout"><div class="service-hero-copy"><h2>${escape(lead)} <em class="service-hero-emphasis service-hero-emphasis--lime">${escape(emphasis)}</em></h2></div></div><div class="service-hero-bottom"><div class="inner-description"><p>${escape(service.description)}</p></div>${button('Pedir uma proposta', '#contacto')}</div></div></section>`;
}
