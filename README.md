# Dipanda

Website em português baseado no Figma `DDdNPfbHSwP78FxMAhdpWK`, Home V.1 e About V.1. A landing preserva os textos, as cores e as imagens do design. As páginas que faltavam foram completadas com conteúdo relacionado com os serviços.

## Abrir e construir

Requer Node.js 22 ou superior. O site e a API de contacto não têm dependências de execução.

```sh
npm run dev
# http://127.0.0.1:4173

npm run build
npm run preview
```

Em PowerShell com bloqueio de scripts, utilize `npm.cmd` em vez de `npm`.

O build gera HTML para 21 páginas e copia as imagens, fontes, CSS e JavaScript para `dist/`. Para usar o formulário, execute o servidor Node em produção, atrás de HTTPS, ou adapte `/api/contact` ao alojamento escolhido. Um alojamento exclusivamente estático serve as páginas mas precisa de uma função de servidor para enviar as mensagens.

## Configuração antes de publicar

Em `src/site.mjs`, complete a razão social, o NIF, a morada e as ligações das redes sociais. Os dados de contacto existentes são os que constam do Figma. As políticas estão implementadas, mas a identificação da entidade e os prestadores efetivos devem ser confirmados antes da publicação; a conservação de contactos indicada na política deve ser aplicada na operação da empresa.

Copie `.env.example` para `.env` e configure:

- `SITE_URL`: domínio final, para as ligações canónicas.
- `RESEND_API_KEY`: chave de envio de e-mail, apenas no servidor.
- `CONTACT_FROM_EMAIL`: remetente num domínio verificado.
- `CONTACT_TO_EMAIL`: destino dos pedidos; por defeito, `comercial@grupodipanda.com`.

A integração segue a [API oficial do Resend](https://resend.com/docs/api-reference/emails/send-email). Não é enviada nenhuma mensagem durante os testes. Sem credenciais, o formulário mostra um erro claro e permite contactar por e-mail; nunca apresenta um sucesso falso. Os pedidos têm validação no cliente e no servidor, um campo contra bots, limite de tamanho, verificação de origem e limitação de frequência. O formulário não subscreve comunicações de marketing.

## Páginas e interações

- Landing, Sobre, índice de serviços e Contacto.
- Quatro artigos: Informação dispersa, Relatórios manuais, Números duvidosos e Dependência.
- Seis páginas de serviços, incluindo Desenvolvimento SaaS e Pedido personalizado.
- Três demos: DRE, Balancete e Operacional, com seleção de período, indicadores, tabela e exportação CSV com dados fictícios.
- Termos e Condições, Política de Privacidade, Política de Cookies e página 404.
- Botões com preenchimento e setas, entrada dos blocos ao fazer scroll, serviços com feedback ao passar o rato e linhas de valores em sentidos alternados.
- Hero de altura completa (`100svh`, com as margens do design), como a ResponsiveHeroBanner do anexo, com faixa de ferramentas integrada em cápsula de até 568 px, com logótipos em círculos sobrepostos de 64 px (48 px no telemóvel), como a Integrations 5. Mantém a entrada suave de 32 px durante um segundo e o texto de apoio a 16 px. A imagem dos três cards foi retirada. Ver Demo recebe um movimento discreto; a Consultoria Gratuita permanece fixa e recebe um preenchimento preto interno, com uma borda verde de 4 px sempre visível.
- O menu é uma cápsula centrada de cerca de 684 × 48 px, com links de 14 px e preenchimento de 4 px. Mantém a posição durante o scroll e ganha uma superfície translúcida clara depois de 50 px. O contacto inclui preenchimento radial, troca de setas e profundidade discreta. Todos os botões usam os tempos da FlowButton: 600 ms na superfície, 800 ms no preenchimento e no conteúdo; a resposta ao pressionar continua rápida.
- A grade original da hero afasta as suas células do rato e regressa ao lugar; o efeito pausa fora do ecrã e com movimento reduzido. A faixa apresenta apenas Power BI, Microsoft, Azure e Python, com os logotipos locais. Uma ferramenta de cada vez abre a sua cápsula azul escura e revela o nome, em transições de 500 ms, alternando automaticamente a cada 3 segundos sem depender do rato. O ciclo pausa fora do ecrã, com a página oculta, movimento reduzido ou pausa manual.
- No bloco Sobre a Dipanda, a frase aparece palavra a palavra, com 100 ms entre entradas e 500 ms por palavra (`power2.out`, deslocamento de −20 px), como a WhisperText. Os ícones entram depois de terminar a frase. Só então começa a alternância de personalizadas, escaláveis, confiáveis, inteligentes e flexíveis, a cada 2 segundos, com mola de rigidez 50, massa 1 e amortecimento 10, como a AnimatedHero. O espaço permanece fixo e centrado; o ciclo pausa fora do ecrã e quando a página está oculta.
- O verde foi uniformizado para `#D6FD70`, o `--base--green` do [CSS da Aeline](https://aeline.temlis.workers.dev/_astro/BaseLayout._i1S-wdM.css). Os links recebem verde no hover inicial e `aria-current` conforme a secção visível, incluindo as páginas interiores.
- Os títulos de bloco usam a WhisperText. Os textos de apoio usam 16 px / 24 px; os serviços seguem a Pricing 18, com títulos de 20 px, resumos e benefícios de 14 px e proposta sob consulta. Consultoria BI continua em destaque. “Detalhes e indicação” mantém o texto completo.
- O Processo de trabalho tem três etapas: levantamento de requisitos, Business blueprint com MVP e iterações e entrega. A faixa e a caixa de consulta partilham os mesmos limites, num contentor de até 1280 px. O cartão aberto ocupa metade da faixa e os restantes mostram uma miniatura e um resumo. Hover, foco e toque revelam o contexto e o resultado de cada etapa; a imagem acompanha a expansão para a direita, preenchendo a sua área. A frase alterna entre “Valor em cada entrega.” e “Desde o primeiro dia” com a mesma mola do Sobre. A cópia conserva a largura durante a expansão, para a faixa manter a altura. Sem JavaScript, os detalhes ficam todos visíveis.
- Nossa solução substitui o antigo iceberg. Apresenta Business Intelligence como centro da oferta, desenvolvimento web como complemento digital e chatbots e automação como complemento operacional, com os textos da tabela fornecida. Os três cartões adaptam o AnimatedHikeCard do anexo: três imagens empilhadas por solução, que se abrem em leque no hover e no foco por teclado em 300 ms. O movimento respeita a preferência do sistema e a pausa manual, preservando as posições estáticas da pilha. As nove imagens são as referências originais enviadas pelo utilizador, guardadas sem edição.
- A hero mantém o conteúdo centrado na horizontal e deixa 80 px entre as ações e as ferramentas. O Sobre a Dipanda usa três colunas iguais, de 416 × 307 px num contentor de 1280 px, e adapta a altura ao conteúdo em ecrãs menores. A palavra animada ocupa a sua largura real, mantendo um intervalo curto junto ao ícone. Os separadores de Problema partilham o fundo translúcido, borda, blur e sombra do menu; as opções não selecionadas recebem texto laranja e o fundo de hover do menu. O botão SAIBA MAIS reutiliza o preenchimento preto interno, a seta e o rebordo de 4 px da consulta gratuita.
- As três demonstrações usam o ServiceCard do anexo como referência: a DRE ocupa a coluna maior, com Balancete e Operacional à direita. Os textos completos e as ligações são preservados. As imagens no canto têm deslocamento, rotação e escala suaves no hover; os cartões dão feedback em 300 ms e as imagens em 400 ms, com movimento reduzido e pausa manual. No telemóvel, as imagens ficam depois do texto, para não o cobrir.
- Botões com círculo e seta usam o preenchimento interno da Consultoria, preservando a borda, e os links em cápsula usam o movimento discreto do Ver Demo. Os botões escuros usam as cores invertidas.
- Os serviços entram com 28 px, 500 ms, curva `(.21,.47,.32,.98)` e intervalo de 120 ms no desktop. No telemóvel, cada card entra ao ficar visível. O comportamento dos anexos foi adaptado aos módulos nativos existentes.
- Menu mobile e preferências de cookies usam diálogos nativos, com foco, teclado e Escape. Os separadores dos problemas suportam setas, Home e End.
- A preferência do sistema para reduzir movimento é respeitada. Existe também um botão para pausar animações no rodapé.

## Cookies efetivos

Não são carregados anúncios, analytics, widgets externos ou fontes remotas. As demos funcionam localmente.

| Cookie | Quando é criado | Duração |
| --- | --- | --- |
| `dipanda_consent` | Depois de escolher aceitar, rejeitar ou personalizar | 180 dias |
| `dipanda_preferences` | Apenas depois de aceitar os cookies funcionais | 180 dias |

O segundo cookie guarda a preferência real de pausar animações. Rejeitar ou revogar apaga-o. Consentimento expirado, inválido ou de versão antiga volta a apresentar o pedido. O botão “Gerir cookies” permite mudar a escolha em todas as páginas. Em HTTPS, os cookies usam `Secure`, além de `SameSite=Lax` e `Path=/`.

O consentimento foi estruturado de acordo com as orientações da [CNPD sobre cookies](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf) e o [relatório do EDPB sobre banners](https://www.edpb.europa.eu/documents/task-force-report/report-of-the-work-undertaken-by-the-cookie-banner-taskforce_en). A implementação não substitui a validação das informações jurídicas específicas da empresa.

## Recursos do design

Os comportamentos dos exemplos React foram adaptados à estrutura HTML/CSS/JavaScript existente. Os botões reutilizáveis estão em `src/components.mjs` (`motionButton` e `flowButton`), os estilos finais em `public/css/refinements.css` e os estilos base em `public/css/buttons.css`, `public/css/hero.css`, `public/css/navigation.css` e `public/css/about.css`, e o movimento em `public/js/hero-motion.js`, `public/js/navigation.js`, `public/js/about-motion.js`, `public/js/section-motion.js` e `public/js/motion.js`. As keyframes da rotação usam a equação da mola; as da frase reproduzem a curva cúbica da GSAP, através da Web Animations API, sem novas dependências de execução. A sequência de entrada, o menu translúcido e a pausa da faixa foram consultados no [registo público da Hero 01](https://shadcnspace.com/r/hero-01.json).

O formato e a dimensão da hero seguem a [Responsive Hero Banner](https://21st.dev/@sensewood8/components/responsive-hero-banner) e o código fornecido nos anexos. Os logótipos de SQL Server, PostgreSQL, MySQL e Oracle em `public/assets/tools/` vêm do [Devicon](https://github.com/devicons/devicon), disponibilizado sob licença MIT. O símbolo Microsoft foi desenhado em SVG com as quatro cores da marca; os outros seis são os recursos originais do Figma.

Para reutilizar os TSX numa aplicação React, crie um projeto separado através da [instalação oficial do shadcn/ui para Vite](https://ui.shadcn.com/docs/installation/vite): use `npx shadcn@latest init -t vite`, escolha React com TypeScript e configure Tailwind e o alias `@/*` para `src/*`. Coloque os componentes em `src/components/ui`, com estilos em `src/index.css`; essa pasta faz coincidir os imports `@/components/ui/...` dos exemplos com os caminhos configurados no CLI. Instale os componentes base com `npx shadcn@latest add button sheet input label navigation-menu` e as dependências do exemplo com `npm install clsx lucide-react tailwind-merge motion`. Na versão Vite, adapte os imports específicos de Next.js, como `next/font/google`, para as fontes locais. O site entregue executa os comportamentos adaptados diretamente na sua estrutura atual.

O pacote completo inclui as imagens e os SVG originais em `public/assets/figma/` e as fontes em `public/fonts/`. A lista de importação em `scripts/assets.json` documenta a origem dos recursos; esses URLs do Figma expiram e não são usados pelo site. `scripts/download-assets.mjs` serve apenas para uma nova importação enquanto as ligações forem válidas.

As imagens ativas do processo e das soluções são as três imagens criadas para as etapas do processo e as nove referências originais enviadas pelo utilizador para Business Intelligence, desenvolvimento web e chatbots. Os PNG estão incluídos em `public/assets/process/` no pacote completo. O ficheiro `references.json` regista as dimensões e os hashes dos originais; `prompts.json` documenta as imagens geradas anteriormente. Neste ambiente, a escrita dos PNG na pasta de trabalho foi recusada; a pré-visualização e o build usam `dipanda-process-assets` na pasta temporária permitida. Os estilos desta revisão estão isolados em `public/css/process.css`, carregados apenas nas páginas Home e Sobre, e os dados das soluções estão em `src/solutions.mjs`.

Os cartões de Nossa solução seguem as medidas do componente `card-25` fornecido: largura máxima de 384 px, ou 448 px a partir de 1024 px, padding de 24 px, raio de 16 px, miniaturas com 128 px de altura e descrição a 14 px. O título e a seta são a indicação de navegação; as etiquetas de papel, o CTA repetido e a nota de referências foram removidos. A grelha começa com uma coluna, passa a duas em tablet e a três em desktop. Em toque, as referências ficam abertas sem depender de hover. A animação de 300 ms aplica-se às molduras; os nove PNG originais mantêm os seus bytes e não recebem transformações próprias. Os ajustes globais para texto, áreas seguras e alvos de toque estão no fim de `public/css/refinements.css`. A viewport permite zoom e usa `viewport-fit=cover`; a hero usa `svh` e os campos já têm pelo menos 16 px no telemóvel.

A largura dinâmica da palavra do Sobre usa o texto invisível de medição com a própria fonte, através de `data-word-fit` em `public/js/motion.js`. A largura muda no intervalo entre a saída e a entrada das palavras; as posições acompanham a mudança com FLIP de 300 ms, sem comprimir as letras. A maior altura natural da linha é reservada e recalculada quando as fontes carregam ou a janela muda de tamanho, evitando deslocar os cartões quando o texto passa de duas linhas para uma no telemóvel. A mola de 1600 ms e o intervalo de 2000 ms são preservados. Os tokens visuais comuns ao menu e aos separadores estão em `public/css/navigation.css`.

Neste ambiente restrito, os binários foram descarregados para pastas temporárias. O servidor de desenvolvimento e o build conseguem utilizá-los dali. O pacote entregue reúne todos os recursos nas pastas normais do projeto, para funcionar sem essa alternativa.

## Verificação

O título principal da hero usa 72 px em desktop, 58 px em tablet e 40 px no telemóvel. A descrição usa 18 px em desktop e 16 px no telemóvel; as ações ficam 40 px depois da descrição em desktop, e as ferramentas 80 px depois das ações. O espaçamento segue o ResponsiveHeroBanner fornecido, com o CTA mais acima. O fundo usa o shader “Mesh drift” do anexo, com a paleta `#062b5c`, `#004cd3`, `#6ba5ef` e `#a8d0f3`. O GLSL de forma e a velocidade (0,727) mantêm-se. O granulado passa a uma textura CSS pequena e repetida, presente desde o primeiro paint, evitando recalcular ruído em cada píxel de cada frame. As opções desativadas são compiladas como constantes, para excluir o custo de funcionalidades não usadas, como warp, blur e cursor. O componente React foi adaptado aos módulos JavaScript existentes em `public/js/hero-shader.js`, sem instalar React, Tailwind ou novas dependências. Os estilos continuam em `public/css/hero-refresh.css`.

A faixa “Dados ligados → Análise clara → Decisões melhores” e a imagem fotográfica de fundo foram removidas. A hero inclui no HTML uma versão estática do primeiro frame do próprio shader, com a mesma paleta e projeção. O SVG decorativo está em `src/hero-poster.mjs`, ocupa cerca de 40 KB e usa um WebP codificado localmente, sem um pedido de imagem externo. O fundo animado arranca antes da entrada dos textos, sem esperar pelo carregamento de todas as imagens nem pelo fim da entrada dos botões. A camada azul de leitura está presente desde o primeiro paint, evitando mostrar dois fundos diferentes no refresh. As ferramentas deixam de ser empurradas para o fundo por uma margem automática. Na descrição, “Cruze os dados” e “tempo e dinheiro” ficam sem fundo; “perder” recebe o fundo laranja “#FF6A3D” e “maximizar os seus ganhos” conserva o fundo preto. Os destaques formam caixas inteiras e respeitam a largura disponível.

O shader fica atrás do conteúdo e das grelhas, com uma camada azul para manter a leitura dos textos. Para quando a hero sai do ecrã, o separador fica oculto, o visitante pausa as animações ou prefere movimento reduzido; ao retomar, continua da fase anterior. Em movimento reduzido desenha apenas uma versão estática. O orçamento do canvas é de 320 mil píxeis em desktop e 160 mil com ponteiro coarse, com DPR máximo 1 e movimento até 20 fps. As cores e o movimento vêm do shader; a versão estática é o seu próprio frame inicial. A grelha conserva a repulsão pelo cursor: o SVG é rasterizado uma vez numa textura de até 500 mil píxeis, apenas ao primeiro movimento de um rato; os frames seguintes reutilizam essa textura, sem voltar a rasterizar o SVG. Em toque ou movimento reduzido este trabalho não é iniciado.

Quando WebGL não está disponível, falha a compilação ou o contexto se perde, mantém-se o primeiro frame do mesmo fundo; se o contexto voltar, o shader é recompilado. O controlador trata estes eventos e liberta recursos ao sair da página, seguindo a [documentação de perda de contexto](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event) e as [boas práticas de WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). As verificações específicas estão em `scripts/check-hero-shader.mjs`, incluindo a paleta, movimento real, pausa, saída de ecrã, contexto perdido e recuperado, rotação, orçamento mobile e fallback.

A etiqueta “CONSULTORIA · TECNOLOGIA”, a ordem dos botões e as setas em ciclo de 2400 ms mantêm-se. As animações param fora do ecrã, ao pausar e com movimento reduzido. A faixa de ferramentas tem uma largura máxima de 340 px. Os textos continuam em HTML. O pacote `dipanda-site-hero-ajustada.zip` conserva a versão anterior à correção de carregamento.

O logótipo fornecido está em `public/assets/brand/Dipanda_Logomark_Master.svg`. A versão de apresentação `dipanda-mark.svg` conserva os três caminhos vetoriais originais, removendo apenas o fundo e a margem exterior do master. É usada no menu, no menu mobile e no rodapé, com cor adequada a cada fundo. O favicon reutiliza o mesmo símbolo. Os estilos estão em `public/css/brand.css`.

As imagens `hero-mountain-v1.png` e `hero-sky-v2.png` ficam arquivadas para recuperar versões anteriores; nenhuma é usada na hero atual. O prompt da imagem editada continua em `hero-sky-v2.prompt.md`; foi usada a ferramenta integrada `image_gen` nessa versão anterior. O pacote completo inclui os recursos nas pastas normais. Os backups anteriores também continuam guardados. As imagens dos restantes blocos e o logótipo mantêm-se.

Aproximamos conserva o estilo normal do título. Transforme recebe o efeito TextLoop do anexo: degradê azul, branco e verde da marca, fundo azul translúcido e cursor verde pulsante. A palavra mantém o seu espaço natural no título; a revelação e o recolhimento repetem-se a cada 3 segundos, com fases de 800 ms, usando clip-path e opacity em CSS. O cursor acompanha a revelação com transform. O comportamento foi adaptado ao HTML/CSS existente, sem novas dependências. Perder conserva o fundo laranja #FF6A3D com texto branco, tempo e dinheiro fica sem fundo e maximizar os seus ganhos conserva o fundo preto.

O ícone de rato abaixo das ferramentas indica que a página continua. A roda desce e desvanece num ciclo suave de 2 segundos; a ligação, com alvo de toque de 44 px, leva a Sobre a Dipanda. O ícone ocupa o espaço inferior reservado na hero. Os efeitos de texto e scroll pausam fora do ecrã e em separadores ocultos; com pausa manual, movimento reduzido ou sem JavaScript, Transforme fica completamente legível e o ícone continua utilizável.

Na medição local em Edge sem interface, com Intel HD Graphics 620 e viewport de 1280 × 900, dois segundos de movimento contínuo do rato passaram de 23,9 para 59,9 frames de `requestAnimationFrame` por segundo. A grelha passou de 6174 desenhos do SVG para uma única rasterização inicial, seguida de desenhos da textura. São medições deste equipamento, não uma garantia de FPS em todos os dispositivos; os relatórios antes e depois estão incluídos no pacote.

As verificações incluem a seleção do menu durante o scroll, o carrossel de círculos, o preenchimento interno dos botões, a expansão das três etapas, o hover das demonstrações e dos separadores de Problema, a composição mobile e os detalhes dos serviços. A suíte de primeiro plano usa o frame estático para isolar os controlos da renderização contínua; a suíte específica de shader testa o WebGL real. A suíte `scripts/check-hero-startup.mjs` atrasa o módulo do shader, compara as cores do primeiro paint com o renderizador real em desktop e mobile, repete a verificação no refresh e confirma o arranque antes de `window.load`. `scripts/check-hero-performance.mjs` mede dois segundos de movimento contínuo do rato, regista os frames observados e verifica o reaproveitamento da grelha e os orçamentos de renderização; o resultado de FPS depende do equipamento. `scripts/check-about-highlight.mjs` verifica os marcadores, os pequenos triângulos e as cores, o retorno à secção, a composição em 390 e 320 px, movimento reduzido e leitura sem JavaScript. O preenchimento do botão é amostrado na linha temporal da sua transição CSS, sem depender da latência das chamadas do navegador. A revisão de processo acrescenta verificações de largura e altura durante a expansão, texto completo, imagens, teclado, toque, rotação, redução de movimento e leitura sem JavaScript. Os relatórios incluídos no pacote registam os resultados de cada conjunto, além dos seis testes de cookies e contacto.

```sh
npm test
npm install
npm run test:e2e
npm run test:motion
npm run test:hero
npm run test:hero-shader
npm run test:hero-startup
npm run test:hero-performance
npm run test:about-highlight
npm run test:process
```

Os testes de navegador usam Edge instalado. Para outro navegador Chromium instalado, indique `BROWSER_EXECUTABLE`. Para testar outra instância, indique `TEST_URL`. As capturas e o relatório são escritos na pasta temporária `dipanda-browser-checks`; pode definir `TEST_OUTPUT`.

Os testes cobrem consentimento, persistência, revogação e expiração, todas as páginas e ligações internas, recursos de imagem, navegação por teclado, demos, download CSV, estados do formulário, redução de movimento e ausência de scroll horizontal em 1280, 860, 430, 390 e 360 px. Os testes de movimento verificam também a ordem frase → ícones → rotação, as keyframes da mola, a estabilidade do alinhamento, o contacto e a largura da cápsula durante o scroll. Os ecrãs mobile são emulados; recomenda-se confirmar o resultado no dispositivo real antes de publicar.

A palavra Transforme usa verde uniforme. O fundo e o cursor preenchem o mesmo retângulo, sem espaço entre a revelação e o traço final.

Revisão da hero: removidos o ícone de scroll, as setas decorativas do título e o fundo de maximizar os seus ganhos. A cápsula ativa das ferramentas usa branco com texto escuro e conserva a alternância automática.

As faixas de valores repetem cada sequência conforme a largura real do bloco, através de ResizeObserver e da medição da fonte. Os dois grupos permanecem idênticos, com velocidade preservada ao aumentar as repetições. O HTML inclui quatro sequências por grupo para preencher também sem JavaScript.

A verificação scripts/check-values-marquee.mjs amostra as quatro faixas em cinco pontos do ciclo e nove alterações de largura, incluindo o regresso ao desktop, além da velocidade, pausa fora do ecrã, movimento reduzido e leitura sem JavaScript.
