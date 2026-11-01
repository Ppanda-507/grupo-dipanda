# Arquitetura e manutenção

## Fluxos

O build importa `src/pages/index.mjs`, gera cada URL registado e copia apenas os recursos aprovados por `config/public-assets.json`. `scripts/project-assets.mjs` percorre as dependências dos documentos, CSS, SVG e imports JavaScript. `scripts/public-artifacts.mjs` verifica a árvore pública e o resultado final, incluindo ausência de ficheiros inesperados, symlinks e material privado identificável.

No navegador, `/js/app.js` carrega os módulos de navegação, consentimento e animação. Esses URLs não mudaram. Os módulos `src/` executam no build ou no servidor local; não são servidos como código de navegador.

O formulário envia para `/api/contact`. Na Vercel, `api/contact.js` delega em `server/contact/handler.mjs`. O handler valida método, origem, tamanho e conteúdo, reserva a quota e chama o serviço de entrega. O SMTP usa remetente empresarial e o visitante apenas em `Reply-To`. O servidor local usa o mesmo handler.

`scripts/serve.mjs` é a entrada operacional do servidor local: carrega `.env`, interpreta argumentos e inicia HTTP/HTTPS. O tratamento privado de pedidos reside em `server/http/`. A API da Vercel recebe ambiente da plataforma e não carrega `.env` do disco.

## Acrescentar páginas e funcionalidades

1. Registar a rota em `src/pages/index.mjs` ou no conteúdo de um domínio já existente. Não alterar inadvertidamente os slugs atuais.
2. Colocar conteúdo em `src/content/`, componentes comuns em `src/components/` e composição de funcionalidades em `src/features/`.
3. Colocar novos recursos deliberadamente públicos em `public/` e acrescentar os caminhos relativos exatos ao manifesto. Documentação e originais de trabalho ficam em `docs/` ou fora do projeto.
4. Manter serviços, credenciais, integrações privadas e validação no servidor em `server/`. Uma nova função serverless deve ter uma entrada pequena em `api/`.
5. Acrescentar testes adequados em `tests/unit/` ou `tests/integration/`, executar `npm test` e `npm run build`.

Não há aliases de imports, compilador adicional, barrels de compatibilidade antigos nem wrappers com os caminhos anteriores. Os imports locais apontam para os novos módulos. Os componentes partilhados existentes continuam num módulo coeso; não foram divididos em camadas sem necessidade.

## Fronteiras

`dist/` contém apenas HTML gerado, recursos aprovados e licenças de distribuição. Configuração, testes, documentação, dependências e código de servidor não fazem parte do diretório publicado. Os headers continuam definidos no servidor e em `vercel.json`, com um teste que impede divergências.

O servidor só aceita `public/`, `dist/` ou o diretório temporário dedicado `dipanda-site-dist`. Mesmo dentro desses diretórios, só serve recursos aprovados e HTML gerado. Verificações de caminhos reais impedem ligações para ficheiros privados fora da raiz.
