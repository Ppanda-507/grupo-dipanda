import { readFileSync } from 'node:fs';
const copy = JSON.parse(readFileSync(new URL('./figma-copy.json', import.meta.url), 'utf8'));
export const figmaText = id => copy[id] ?? '';

export const problems = [
  { slug: 'informacao-dispersa', label: 'Informação dispersa', title: 'Dados sem controlo', description: figmaText('5545:3185'), image: '/assets/figma/5545-3146-3a1d2.png', imageClass: 'problem-dispersed', articleTitle: 'Informação dispersa', article: figmaText('2:2779'), summary: 'Uma visão comum começa por ligar a informação que já existe na sua empresa.' },
  { slug: 'relatorios-manuais', label: 'Relatórios manuais', title: 'Horas em Excel', description: 'Copiar, colar, conferir e repetir. Quando os relatórios dependem de trabalho manual, a equipa dedica mais tempo a preparar a informação do que a perceber o que ela significa.', image: '/assets/figma/2-2597-3ab1e.png', articleTitle: 'Relatórios manuais', summary: 'Deixe de repetir tarefas para começar a acompanhar resultados.', article: [
    ['O relatório não devia ocupar o tempo que precisa para decidir', 'Extrair dados de várias ferramentas, corrigir formatos, copiar fórmulas e conferir totais pode transformar um relatório simples numa tarefa de várias horas. Quando o processo termina, a informação já pode estar desatualizada.'],
    ['O trabalho manual também tem um custo invisível', 'Uma fórmula alterada, uma linha em falta ou um ficheiro antigo podem mudar o resultado sem que a equipa perceba. E, quando só uma pessoa conhece o processo, cada ausência passa a ser um problema.'],
    ['Automatizar começa por compreender o processo', 'Identificamos as fontes de dados, as regras de cálculo e a frequência de atualização de que o negócio precisa. Depois, criamos um fluxo que recolhe, prepara e valida a informação antes de a apresentar.'],
    ['Mais tempo para analisar, menos tempo a preparar', 'A informação fica disponível num dashboard com indicadores claros. A equipa acompanha tendências e desvios, consulta o detalhe e concentra-se nas decisões que fazem a diferença.'],
    ['Comece pelo relatório que mais tempo lhe tira', 'Fale connosco sobre o relatório que a sua equipa repete todas as semanas. Vamos identificar as tarefas que podem ser automatizadas e definir um primeiro passo adequado à sua realidade.']
  ] },
  { slug: 'numeros-duvidosos', label: 'Números duvidosos', title: 'Uma pergunta, várias respostas', description: 'O mesmo indicador apresenta valores diferentes em cada relatório. Sem regras comuns e validação dos dados, a confiança nos números diminui e as decisões ficam à espera.', image: '/assets/figma/2-2597-4b347.png', articleTitle: 'Números duvidosos', summary: 'Indicadores consistentes para decisões em que pode confiar.', article: [
    ['Quando os números não coincidem, a decisão para', 'A faturação pode ter um valor no ERP e outro na folha de cálculo. Vendas podem significar encomendas para uma equipa e faturas emitidas para outra. Sem definições partilhadas, é difícil saber qual dos números usar.'],
    ['A confiança precisa de regras claras', 'Definimos cada indicador com as equipas que o utilizam: origem, fórmula, período, filtros e responsável. Estas definições tornam-se a base para que os relatórios respondam à mesma pergunta da mesma forma.'],
    ['Qualidade dos dados antes da visualização', 'Analisamos campos incompletos, duplicações e diferenças entre sistemas. Criamos verificações para identificar inconsistências e permitir que a equipa acompanhe a origem de cada resultado.'],
    ['Uma fonte de informação partilhada', 'Organizamos os dados num modelo consistente e disponibilizamos indicadores que podem ser explorados até ao detalhe. Assim, uma diferença deixa de ser uma discussão entre ficheiros e passa a ser algo que pode ser explicado.']
  ] },
  { slug: 'dependencia', label: 'Dependência', title: 'O conhecimento não pode ficar numa só pessoa', description: 'Se apenas uma pessoa sabe preparar os relatórios ou encontrar a informação, o negócio fica dependente da sua disponibilidade. Documentação, automação e formação devolvem autonomia à equipa.', image: '/assets/figma/2-2597-1c63e.png', articleTitle: 'Dependência', summary: 'Conhecimento partilhado, processos documentados e equipas autónomas.', article: [
    ['E se a pessoa que prepara o relatório não estiver disponível?', 'Quando processos e regras vivem apenas na experiência de uma pessoa, as férias, uma mudança de função ou a saída de um colaborador podem interromper o acesso à informação.'],
    ['Documentar é tornar o conhecimento utilizável', 'Registamos fontes, regras de cálculo, responsabilidades e procedimentos. A documentação acompanha a solução e permite à equipa compreender como a informação é produzida.'],
    ['Autonomia com a segurança necessária', 'Organizamos acessos de acordo com cada função e disponibilizamos formação para que as pessoas encontrem as respostas de que precisam. A automação reduz tarefas repetitivas sem retirar o controlo sobre o processo.'],
    ['Uma solução que fica na sua empresa', 'A entrega inclui os elementos acordados no projeto, documentação e passagem de conhecimento. O suporte e a evolução são definidos em conjunto, com responsabilidades e objetivos claros.']
  ] }
];

export const demos = [
  { slug: 'dre', title: 'Dashboard DRE', description: figmaText('5595:3228'), image: '/assets/figma/2-510-50797.png', imageClass: 'demo-dre', question: 'A empresa está a gerar lucro?', audience: 'Gestão, direção financeira e equipas que acompanham a rentabilidade do negócio.', capabilities: ['Acompanhar receita, custos e resultado líquido.', 'Comparar períodos e perceber a evolução das margens.', 'Analisar as Margens Bruta, EBITDA e Líquida.', 'Explorar o detalhe que explica cada indicador.'], measures: ['Receita', 'Custos', 'EBITDA', 'Resultado líquido'] },
  { slug: 'balancete', title: 'Dashboard Balancete', description: figmaText('5595:3245'), image: '/assets/figma/2-510-17cda.png', imageClass: 'demo-balancete', question: 'Os saldos contabilísticos estão coerentes?', audience: 'Contabilidade, controlo de gestão e equipas responsáveis pela conferência dos saldos.', capabilities: ['Explorar saldos por conta e período.', 'Comparar débitos, créditos e movimentos.', 'Identificar diferenças que precisam de conferência.', 'Consultar os dados de origem de cada saldo.'], measures: ['Débitos', 'Créditos', 'Saldo', 'Contas analisadas'] },
  { slug: 'operacional', title: 'Dashboard Operacional', description: figmaText('5596:3308'), image: '/assets/figma/2-510-f3abe.png', imageClass: 'demo-operacional', question: 'Como está a operação neste momento?', audience: 'Responsáveis de operação e equipas que precisam de acompanhar a atividade diária.', capabilities: ['Acompanhar volumes de atividade e capacidade.', 'Identificar tarefas pendentes e atrasos.', 'Comparar resultados com os objetivos definidos.', 'Explorar indicadores por equipa, período ou processo.'], measures: ['Pedidos', 'Concluídos', 'Pendentes', 'Taxa de conclusão'] }
];

function serviceCopy(id) {
  const parts = figmaText(id).trim().split(/\n\nPara quem é indicado\?\s*\n\n/);
  return { description: parts[0].trim(), audience: parts[1]?.trim() || '' };
}
export const services = [
  { slug: 'consultoria-bi', title: 'Consultoria BI', ...serviceCopy('2:712'), icon: '/assets/figma/2-687-79994.svg', featured: true, investment: true, benefits: ['2:720', '2:724', '2:728', '2:732'].map(figmaText), deliverables: ['Diagnóstico das fontes e processos atuais.', 'Mapa de necessidades e prioridades do negócio.', 'Recomendação de arquitetura e tecnologias.', 'Plano de implementação por etapas.'] },
  { slug: 'solucoes-analytics', title: 'Soluções analytics', ...serviceCopy('2:744'), icon: '/assets/figma/2-687-3f18a.svg', benefits: ['2:752', '2:760', '2:764', '5597:3388', '5597:3393', '5597:3411'].map(figmaText), deliverables: ['Integração e preparação dos dados.', 'Modelo de dados e regras dos indicadores.', 'Dashboards e relatórios acordados no projeto.', 'Documentação, formação e plano de atualização.'] },
  { slug: 'atendimento-automacao', title: 'Atendimento e Automação', ...serviceCopy('2:776'), icon: '/assets/figma/2-687-5a02c.svg', investment: true, benefits: ['2:784', '2:788', '2:792', '2:796', '5597:3406'].map(figmaText), deliverables: ['Mapa do fluxo de atendimento.', 'Respostas e encaminhamentos acordados.', 'Integrações com as ferramentas do negócio.', 'Testes, documentação e formação da equipa.'] },
  { slug: 'desenvolvimento-saas', title: 'Desenvolvimento SaaS', description: 'Criamos sistemas internos à medida para centralizar a informação, gerir os seus componentes e acompanhar os processos do negócio num só lugar.', audience: 'Empresas que precisam de um sistema interno para gerir equipas, componentes, pedidos, recursos ou operações, com acessos adequados a cada função.', icon: '/assets/figma/2-687-3f18a.svg', investment: true, benefits: ['Sistemas de gestão internos', 'Gestão de componentes e recursos', 'Perfis de acesso e permissões', 'Integrações com sistemas existentes', 'Documentação e formação'], deliverables: ['Definição dos processos e requisitos.', 'Protótipo e validação com os utilizadores.', 'Sistema funcional com os módulos acordados.', 'Documentação e plano de suporte e evolução.'] },
  { slug: 'produtos-dipanda', title: 'Produtos dipanda', description: 'Conheça soluções desenvolvidas pela Dipanda para transformar dados em informação útil e simplificar a gestão do dia a dia.', audience: 'Equipas que procuram um ponto de partida para acompanhar os resultados financeiros, contabilísticos ou operacionais da empresa.', icon: '/assets/figma/2-687-79994.svg', benefits: ['Dashboard DRE', 'Dashboard Balancete', 'Dashboard Operacional', 'Adaptação à realidade do negócio'], deliverables: ['Apresentação da solução e avaliação de adequação.', 'Definição das fontes e dos indicadores necessários.', 'Configuração dos elementos acordados.', 'Formação e orientação para utilização.'] },
  { slug: 'pedido-personalizado', title: 'Pedido personalizado', description: 'Uma ideia simples também merece uma boa execução. Criamos convites eletrónicos, sites de boas-vindas e pequenas experiências digitais à medida.', audience: 'Quem quer algo simples e específico, como um convite eletrónico, um site de boas-vindas, uma página para um evento ou uma apresentação digital.', icon: '/assets/figma/2-687-3f18a.svg', investment: true, benefits: ['Convites eletrónicos', 'Sites de boas-vindas', 'Páginas para eventos', 'Design adaptado a desktop e mobile', 'Entrega e orientação de utilização'], deliverables: ['Definição do objetivo e do conteúdo.', 'Proposta de estrutura e design.', 'Página adaptada a diferentes ecrãs.', 'Entrega e instruções de utilização.'] }
];

export const processSteps = [
  {
    title: 'Levantamento de requisitos',
    summary: 'Ouvimos a sua equipa e alinhamos as prioridades do negócio.',
    description: 'Mapeamos os objetivos, as fontes de dados e os processos atuais. Definimos consigo os indicadores e os critérios de sucesso, para que a solução responda às necessidades da sua empresa.',
    outcome: 'Requisitos e prioridades acordados.',
    image: 'requirements.png',
    icon: '/assets/figma/2-687-79994.svg'
  },
  {
    title: 'Business blueprint',
    summary: 'Um plano claro e um MVP para validar a solução.',
    description: 'Documentamos a arquitetura, as integrações e as etapas do projeto. Criamos uma primeira versão funcional (MVP) para validar os indicadores e os fluxos com a sua equipa, antes de evoluir a solução.',
    outcome: 'Plano do projeto e MVP validado.',
    image: 'blueprint.png',
    icon: '/assets/figma/2-687-3f18a.svg'
  },
  {
    title: 'Iterações e entrega',
    summary: 'Evoluímos consigo e entregamos uma solução pronta a usar.',
    description: 'Recolhemos feedback e validamos os resultados em cada iteração. A entrega inclui documentação e formação para dar autonomia à sua equipa, com suporte e evolução definidos de acordo com o projeto.',
    outcome: 'Solução, documentação e formação.',
    image: 'delivery.png',
    icon: '/assets/figma/2-401-bdfc9.svg'
  }
];
