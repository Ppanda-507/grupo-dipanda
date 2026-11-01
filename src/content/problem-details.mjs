export const problemDetails = {
  'informacao-dispersa': {
    signals: [
      ['Informação em vários lugares', 'Clientes no CRM, faturação no ERP e custos em folhas de cálculo. Para obter uma resposta, é preciso juntar tudo.'],
      ['Versões que não coincidem', 'Cada equipa trabalha com o seu ficheiro e chega a uma leitura diferente dos resultados.'],
      ['Decisões à espera', 'O tempo que devia servir para analisar o negócio é gasto a procurar e confirmar informação.']
    ],
    approachTitle: 'Integramos os dados num único lugar onde possa confiar',
    integrationFlow: true,
    processImage: '/assets/problems/go-live-reference.png',
    approach: 'Começamos pelas perguntas que o seu negócio precisa de responder. Ligamos as fontes relevantes e organizamos os dados para que as equipas acompanhem os mesmos indicadores.',
    scope: ['Integração das fontes de dados', 'Regras comuns para os indicadores', 'Dashboards com acesso ao detalhe', 'Documentação e passagem de conhecimento'],
    benefits: [
      ['Uma visão partilhada', 'Acompanhar clientes, vendas, custos e resultados num contexto comum.'],
      ['Menos procura de informação', 'Consultar as respostas sem reunir sucessivas versões de ficheiros.'],
      ['Decisões com contexto', 'Perceber a origem de um resultado e investigar o que mudou.']
    ],
    steps: [
      ['Mapear as fontes', 'Identificamos onde está a informação e quem a utiliza.'],
      ['Ligar os dados', 'Preparamos a recolha e a organização das fontes acordadas.'],
      ['Validar os indicadores', 'Confirmamos as regras e os resultados com a sua equipa.'],
      ['Colocar em utilização', 'Entregamos a solução com documentação e orientação.']
    ]
  },
  'relatorios-manuais': {
    signals: [
      ['Copiar e colar todos os meses', 'A mesma sequência de extrações e ajustes repete-se em cada relatório.'],
      ['Erros difíceis de detetar', 'Uma fórmula alterada ou uma linha em falta pode mudar o resultado.'],
      ['Pouco tempo para analisar', 'Quando a preparação termina, sobra pouco tempo para interpretar os números.']
    ],
    approachTitle: 'Criamos sistemas para automatizar os processos manuais',
    stepsGrid: true,
    approach: 'Analisamos o percurso do relatório, desde a origem dos dados até à sua utilização. Automatizamos as tarefas repetitivas e criamos verificações para acompanhar a qualidade dos resultados.',
    scope: ['Recolha de dados automatizada', 'Tratamento e validação da informação', 'Indicadores e relatórios consistentes', 'Documentação do processo'],
    benefits: [
      ['Menos tarefas repetitivas', 'Reduzir a preparação manual que se repete em cada período.'],
      ['Maior consistência', 'Aplicar as mesmas regras aos dados e conferir os resultados.'],
      ['Mais espaço para analisar', 'Concentrar o trabalho da equipa nas tendências e nos desvios.']
    ],
    steps: [
      ['Conhecer a rotina', 'Mapeamos as fontes, os ficheiros e as tarefas do relatório.'],
      ['Construir o fluxo', 'Automatizamos a recolha e as transformações acordadas.'],
      ['Conferir os resultados', 'Comparamos os indicadores com os valores de referência.'],
      ['Preparar a equipa', 'Documentamos o fluxo e orientamos a sua utilização.']
    ]
  },
  'numeros-duvidosos': {
    stepsGrid: true,
    processTitle: 'Trabalhamos em equipa para definir as regras certas',
    signals: [
      ['O mesmo indicador, vários valores', 'As equipas apresentam respostas diferentes para a mesma pergunta.'],
      ['Regras pouco claras', 'Períodos, filtros e fórmulas mudam entre relatórios sem uma definição partilhada.'],
      ['Confiança nos dados em falta', 'As reuniões tornam-se conferências de ficheiros em vez de momentos de decisão.']
    ],
    approachTitle: 'Definir as regras. Recuperar a confiança.',
    approach: 'Trabalhamos com as equipas para definir a origem, a fórmula e os critérios de cada indicador. Analisamos a qualidade dos dados e criamos um modelo que permita explicar os resultados.',
    scope: ['Definição dos indicadores', 'Revisão da qualidade dos dados', 'Modelo de informação consistente', 'Verificações e rastreabilidade'],
    benefits: [
      ['Indicadores comparáveis', 'Usar definições comuns para comparar resultados entre equipas e períodos.'],
      ['Diferenças explicáveis', 'Consultar a origem dos valores e perceber as divergências.'],
      ['Uma base para decidir', 'Discutir o negócio a partir de informação validada em conjunto.']
    ],
    steps: [
      ['Definir os indicadores', 'Alinhamos significado, fórmula, período e responsáveis.'],
      ['Rever a qualidade', 'Identificamos duplicações, lacunas e diferenças entre fontes.'],
      ['Validar o modelo', 'Conferimos os resultados com os utilizadores do negócio.'],
      ['Acompanhar exceções', 'Disponibilizamos verificações e documentação das regras.']
    ]
  },
  dependencia: {
    signals: [
      ['As respostas dependem de alguém', 'Só uma pessoa sabe onde encontrar a informação ou preparar o relatório.'],
      ['Processos sem documentação', 'As regras e os procedimentos ficam na experiência de quem os executa.'],
      ['Ausências que interrompem o trabalho', 'Férias ou mudanças na equipa dificultam o acesso aos resultados.']
    ],
    approachTitle: 'Partilhar o conhecimento. Dar autonomia à equipa.',
    approach: 'Tornamos os processos compreensíveis e utilizáveis por mais pessoas. Documentamos as regras, automatizamos as rotinas adequadas e preparamos os utilizadores para trabalhar com a solução.',
    scope: ['Mapeamento das responsabilidades', 'Documentação de fontes e regras', 'Automatização das rotinas', 'Formação e acessos por função'],
    benefits: [
      ['Conhecimento partilhado', 'Compreender como a informação é preparada e utilizada.'],
      ['Continuidade do trabalho', 'Reduzir a dependência da disponibilidade de uma única pessoa.'],
      ['Autonomia com controlo', 'Dar à equipa os acessos e a preparação de que precisa.']
    ],
    steps: [
      ['Mapear o conhecimento', 'Identificamos os processos críticos e os seus responsáveis.'],
      ['Documentar o processo', 'Registamos fontes, regras e procedimentos de utilização.'],
      ['Simplificar as rotinas', 'Automatizamos o que faz sentido e organizamos os acessos.'],
      ['Formar os utilizadores', 'Fazemos a passagem de conhecimento com a sua equipa.']
    ]
  }
};
