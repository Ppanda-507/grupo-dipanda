import { escape, tag, button, solutionGallery } from './components.mjs';
import { services, processSteps } from './data.mjs';
import { solutions } from './solutions.mjs';
import { serviceImages } from './service-banners.mjs';

const overview = {
  'consultoria-bi': [
    'A consultoria em Business Intelligence ajuda a definir como recolher, organizar e analisar os dados do negócio para apoiar decisões.',
    'Começamos por conhecer os objetivos, as fontes de informação e os processos atuais. Identificamos prioridades e propomos uma arquitetura e um plano de implementação adequados à empresa.',
    'Aplica-se às áreas que precisam de uma visão consistente dos resultados, como gestão, finanças, vendas e operações.'
  ],
  'solucoes-analytics': [
    'Uma solução analítica reúne dados de diferentes fontes e apresenta indicadores, dashboards e relatórios para acompanhar o negócio.',
    'Ligamos as fontes acordadas, preparamos os dados e definimos as regras dos indicadores. Construímos as visualizações e validamos os resultados com os utilizadores.',
    'Pode apoiar o acompanhamento financeiro, comercial e operacional, de acordo com os dados disponíveis e as perguntas de cada equipa.'
  ],
  'atendimento-automacao': [
    'O atendimento e a automação permitem organizar respostas, encaminhar pedidos e reduzir tarefas repetitivas através de fluxos digitais.',
    'Mapeamos as perguntas e tarefas frequentes, definimos as respostas e os encaminhamentos e ligamos as ferramentas necessárias. Testamos os fluxos antes da utilização.',
    'Pode atuar no contacto com clientes, nas marcações, na recolha de pedidos e na passagem de informação entre ferramentas.'
  ],
  'desenvolvimento-saas': [
    'Desenvolvemos sistemas internos à medida para centralizar informação e gerir os processos do negócio, com acessos adequados a cada função.',
    'Levantamos os requisitos, desenhamos os módulos e validamos uma primeira versão com a equipa. O sistema evolui por iterações, com testes e documentação.',
    'Aplica-se à gestão de equipas, pedidos, recursos, componentes e operações que precisam de um sistema comum de trabalho.'
  ],
  'produtos-dipanda': [
    'Os produtos Dipanda são aplicações próprias, pensadas para necessidades comuns da comunidade e com acesso por subscrição. Não são projetos exclusivos de uma empresa.',
    'Identificamos uma necessidade, desenvolvemos e testamos o produto e preparamos a sua disponibilização ao público. Cada produto terá planos e condições próprios quando estiver disponível.',
    'A visão inclui aplicações de fitness e gestão de gastos pessoais. São exemplos de produtos que queremos criar, ainda sem disponibilidade anunciada.'
  ],
  'pedido-personalizado': [
    'Um pedido personalizado é uma experiência digital de âmbito específico, como um convite eletrónico, uma página de evento ou um site de boas-vindas.',
    'Definimos o objetivo e o conteúdo consigo, propomos uma estrutura e desenvolvemos a página. Antes da entrega, verificamos a apresentação nos diferentes ecrãs.',
    'Pode ser utilizado em eventos, celebrações, apresentações e outras necessidades pontuais de pessoas ou negócios.'
  ],
  'desenvolvimento-web': [
    'O desenvolvimento web transforma os objetivos do seu negócio num site ou aplicação acessível através do navegador.',
    'Alinhamos os requisitos, desenhamos a estrutura e a experiência de utilização e desenvolvemos a solução. Testamos a navegação, os formulários e a adaptação aos diferentes ecrãs.',
    'Pode servir a apresentação de uma empresa, a divulgação de serviços, a recolha de contactos ou o apoio a processos através de aplicações web.'
  ]
};

const scopeCopy = {
  'consultoria-bi': [
    'Alinhamos os objetivos, as perguntas do negócio e as necessidades de quem vai utilizar a solução.',
    'Analisamos como a informação é recolhida e utilizada e onde existem dificuldades ou tarefas repetidas.',
    'Recomendamos ferramentas e uma arquitetura adequadas às fontes, aos acessos e às prioridades identificadas.',
    'Organizamos as prioridades numa sequência de trabalho, com âmbito e critérios de validação acordados.'
  ],
  'atendimento-automacao': [
    'Definimos os fluxos e as respostas para os pedidos frequentes através das redes sociais, sites ou canais de vendas.',
    'Organizamos o atendimento nas redes sociais, com respostas adequadas ao canal e continuidade da conversa.',
    'Ligamos as ferramentas acordadas para reduzir a introdução repetida de dados.',
    'Encaminhamos as conversas que precisam de intervenção humana para a pessoa ou equipa responsável.',
    'Recolhemos os dados necessários ao pedido e ajudamos a identificar o interesse e o contexto de cada contacto.'
  ],
  'desenvolvimento-saas': [
    'Desenhamos os módulos de acordo com os processos e requisitos da empresa.',
    'Definimos perfis de utilização e permissões de acordo com as responsabilidades.',
    'Analisamos as ligações necessárias e possíveis aos sistemas existentes.',
    'Documentamos o funcionamento e preparamos os utilizadores para a solução.'
  ],
  'produtos-dipanda': [
    'Uma das áreas em que queremos criar aplicações próprias para o acompanhamento do treino.',
    'Uma das áreas em que queremos desenvolver ferramentas para organizar os gastos do dia a dia.',
    'Cada produto terá os seus planos e condições quando estiver disponível.',
    'Produtos pensados para necessidades partilhadas pelo público em geral.'
  ],
  'pedido-personalizado': [
    'Páginas com a informação e a apresentação necessárias para o seu convite.',
    'Uma experiência de apresentação adaptada ao contexto e a quem a vai utilizar.',
    'Conteúdos e informação prática reunidos numa página dedicada ao evento.',
    'Verificamos a leitura e a navegação em computador e telemóvel.',
    'Entregamos a página e explicamos os aspetos necessários à sua utilização.'
  ],
  'desenvolvimento-web': [
    'Organizamos a apresentação do negócio, dos serviços e das formas de contacto.',
    'Desenvolvemos funcionalidades de acordo com os requisitos e os processos definidos.',
    'Ligamos formulários e ferramentas conforme o âmbito e as integrações acordadas.',
    'Desenhamos e testamos a experiência para diferentes tamanhos de ecrã.'
  ]
};

const allServices = () => [...services, {
  slug: 'desenvolvimento-web', title: 'Desenvolvimento web',
  description: solutions[1].description, icon: solutions[1].icon
}];

// Keyed by concept: changes to the display order cannot swap definitions.
export const analyticsScope = {
  'Dashboards e relatórios': 'Apresentam indicadores e resultados em gráficos, tabelas e filtros. Os dashboards permitem acompanhar o negócio de forma resumida; os relatórios permitem explorar o detalhe e responder a perguntas específicas.',
  'Data Warehousing': 'Um data warehouse é um repositório preparado para análise, que reúne dados organizados de diferentes sistemas e pode conservar o histórico. Permite comparar períodos e consultar resultados sem depender de ficheiros dispersos.',
  'Modelação de dados': 'Define as tabelas, as relações e as medidas que dão significado aos dados. Um modelo bem estruturado permite analisar, por exemplo, vendas por cliente, produto ou período, usando regras consistentes.',
  'ETL e pipelines de dados': 'ETL significa extrair, transformar e carregar dados. Os pipelines coordenam estas etapas, com regras de limpeza, validação e atualização, para preparar a informação de forma repetível.',
  'Automação de processos manuais': 'Substitui tarefas repetitivas, como recolher ficheiros, atualizar relatórios e enviar resultados, por fluxos programados. Reduz intervenções manuais e permite acompanhar falhas ou exceções.',
  'Integração de dados': 'Liga fontes como ERP, CRM, bases de dados e ficheiros. Harmoniza formatos e identificadores para que a informação de sistemas diferentes possa ser utilizada em conjunto.'
};
const scopeDescription = (service, title, index) => service.slug === 'solucoes-analytics' ? analyticsScope[title] : scopeCopy[service.slug][index];

export function nextServices(service) {
  const list = allServices();
  const current = list.findIndex(item => item.slug === service.slug);
  return [1,2,3].map(offset => list[(current + offset) % list.length]);
}

function relatedServices(service) {
  return `<section class="section service-related"><div class="container"><div class="section-heading section-heading--left" data-reveal>${tag('Continue a explorar')}<h2>Outros serviços para o <em>seu negócio.</em></h2></div><div class="service-related-grid">${nextServices(service).map(item => {
    const [src,alt] = serviceImages[item.slug];
    const visual = `<img src="${src}" width="640" height="360" alt="${escape(alt)}" loading="lazy">`;
    const summary = item.description.match(/^[\s\S]*?[.!?](?:\s|$)/)?.[0]?.trim() || item.description;
    return `<a class="service-related-card" href="/servicos/${item.slug}/" data-reveal><div class="service-related-image">${visual}</div><h3>${escape(item.title)}</h3><p>${escape(summary)}</p><span class="service-related-link">Saiba mais <span aria-hidden="true">↗</span></span></a>`;
  }).join('')}</div></div></section>`;
}

export function renderServiceSections(service, solution) {
  const product = service.slug === 'produtos-dipanda';
  const labels = ['O que é?', 'Como funciona?', 'Onde atua?'];
  return `<section class="section service-overview service-band"><div class="service-overview-heading"><div class="container"><div class="section-heading section-heading--left" data-reveal><h2>Uma visão <em>geral.</em></h2></div></div></div><div class="container"><div class="service-overview-rows">${overview[service.slug].map((body,index) => `<article data-reveal><h3>${labels[index]}</h3><p>${escape(body)}</p></article>`).join('')}</div></div></section>
  <section class="section service-audience"><div class="container service-audience-layout"><div data-reveal>${tag('O seu ponto de partida')}<h2>${product ? 'Para quem criamos?' : 'Para quem é indicado?'}</h2></div><p data-reveal>${escape(service.audience)}</p></div></section>
  <section class="section service-scope service-band"><div class="container"><div class="section-heading section-heading--left" data-reveal>${tag('Âmbito da solução')}<h2>${product ? 'Produtos que queremos criar' : 'O que podemos fazer'}</h2></div><div class="service-scope-grid">${service.benefits.map((title,index) => `<details><summary><h3>${escape(title)}</h3><span aria-hidden="true">+</span></summary><p>${escape(scopeDescription(service,title,index) || 'O âmbito é definido na proposta, de acordo com as necessidades do projeto.')}</p></details>`).join('')}</div></div></section>
  ${service.slug === 'pedido-personalizado' ? '' : `<section class="section service-delivery"><div class="container"><div class="section-heading section-heading--left" data-reveal><h2>Uma entrega <em>clara.</em></h2></div><ol class="service-delivery-steps">${processSteps.map((step,index) => `<li data-reveal><span aria-hidden="true">0${index+1}</span><h3>${escape(step.title)}</h3></li>`).join('')}</ol></div></section>`}
  ${solution?.hero ? solutionGallery(solution, { title: 'Projetos' }) : ''}
  <section class="section service-pricing service-band"${product ? ' id="modelo-de-acesso"' : ''}><div class="container service-pricing-layout"><div data-reveal>${tag(product ? 'Modelo de acesso' : 'Investimento')}<h2>${product ? 'Planos por produto.' : 'Sob consulta.'}</h2><p>${product ? 'Os preços e as condições de acesso serão apresentados com cada produto, quando estiver disponível.' : 'O valor depende do âmbito, das integrações e das entregas acordadas. Começamos por uma conversa para compreender o que precisa.'}</p></div>${button(product ? 'Falar com a Dipanda' : 'Consultar a equipa', '#contacto', 'lime')}</div></section>
  ${relatedServices(service)}`;
}

export function renderServiceIndex(onlySolutions = false) {
  const list = onlySolutions ? solutions.map(solution => ({ ...allServices().find(service => solution.href === `/servicos/${service.slug}/`), title: solution.title })) : allServices();
  return `<section class="inner-hero service-index-heading"><div class="container">${tag(onlySolutions ? 'Nossa solução' : 'Serviços')}<h1>Soluções para o <em>seu negócio.</em></h1><div class="inner-description"><p>Conheça ${onlySolutions ? 'as nossas soluções' : 'os nossos serviços'} e encontre o ponto de partida para o que precisa.</p></div></div></section>${list.map((service,index) => {
    const [src,alt,width,height] = serviceImages[service.slug];
    return `<section class="section service-summary${index % 2 === 0 ? ' service-band' : ''}" id="${service.slug}"><div class="container service-summary-layout"><div class="service-summary-image"><img src="${src}" width="${width}" height="${height}" alt="${escape(alt)}" loading="lazy"></div><div class="service-summary-copy" data-reveal><h2>${escape(service.title)}</h2><p>${escape(overview[service.slug][0])}</p><p>${escape(overview[service.slug][2])}</p>${button('Conhecer o serviço', `/servicos/${service.slug}/`, index % 2 === 0 ? 'lime' : 'dark')}</div></div></section>`;
  }).join('')}`;
}
