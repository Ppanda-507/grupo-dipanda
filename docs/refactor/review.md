# Auditoria estrutural e plano executado

## Estado inicial

Base registada em `baseline.json`, com a lista completa em `structure-before.txt`. A aplicação usa módulos ESM de Node.js, templates HTML e JavaScript nativo no navegador. Há uma dependência de execução: Nodemailer. `src/` tinha 16 módulos/dados sem agrupamento; `scripts/` misturava build, servidor HTTP, contacto e segurança. `api/contact.js` importava diretamente três módulos de `scripts/`.

O build gerava 23 páginas e três documentos de erro e copiava integralmente os 98 ficheiros de `public/`: 124 ficheiros em `dist/`. Não foram encontrados segredos nesse artefacto inicial. Dois ficheiros eram fontes editoriais, quatro eram licenças e 92 eram recursos operacionais alcançáveis. O antigo validador contava apenas 82 recursos por não seguir dez imports JavaScript relativos.

Os testes e mecanismos de auditoria estavam no arquivo externo criado a pedido do utilizador. Alguns contratos eram anteriores às alterações posteriores do site. Esses contratos foram analisados antes de restaurar testes.

## Decisões

- Separar o contacto por funcionalidade em `server/contact/` e o tratamento HTTP em `server/http/`.
- Manter `api/contact.js` como entrada da Vercel e `scripts/serve.mjs` como comando operacional.
- Agrupar módulos de apresentação em `src/pages`, `components`, `features`, `content` e `lib`, sem mudar o HTML nem os URLs.
- Preservar os caminhos de todos os recursos operacionais em `public/`; apenas as duas fontes editoriais foram para `docs/assets/`.
- Tornar explícita a lista de publicação em `config/public-assets.json` e verificar também o resultado completo do build.
- Recuperar testes e ferramentas em `tests/` e `scripts/audit/`, com ambiente e transporte simulados.
- Preservar integralmente a evidência histórica e a sua classificação original. Não executar geradores antigos de conclusões ou o scanner antigo com exceções por número de linha.

`moves.json` identifica as 24 relocalizações do código/conteúdo existente. Os testes restaurados, o fixture e as ferramentas ficam identificados na estrutura final. Os imports relativos e a referência ao JSON editorial foram ajustados aos novos caminhos. `vercel.json` mantém os mesmos comandos e headers. `.vercelignore` passa a excluir também documentação e o `dist/` local, que será reconstruído na plataforma.

## Constatações de segurança e ações

### SEC-01 — Publicação implícita de qualquer conteúdo de public/ — risco moderado

Antes: `scripts/build.mjs` fazia cópia recursiva de toda a pasta. Um ficheiro privado colocado por engano nessa árvore seria publicado. Os dois documentos editoriais já eram copiados, sem serem necessários ao site. Não foi demonstrada exposição de uma credencial existente.

Ação: manifesto positivo, verificação de ficheiros inesperados e conteúdo privado identificável, conservação das licenças e validação exata de `dist/`. Testes com ficheiros privados sintéticos asseguram que o build rejeita o conteúdo sem o repetir em logs.

### SEC-02 — Raiz estática arbitrária e contenção apenas lexical — risco moderado

Antes: `scripts/serve.mjs --output` aceitava qualquer pasta, e a contenção do handler não resolvia symlinks. As pastas padrão atuais eram seguras; os riscos dependiam de configuração incorreta ou introdução posterior de uma ligação.

Ação: raiz limitada a `public/`, `dist/` e ao TEMP dedicado; lista explícita de recursos servidos; resolução de caminhos reais para estáticos e HTML gerado. Testes verificam arquivos privados, caminhos codificados e junctions controlados em Windows.

### SEC-03 — Dependências de navegador não verificadas — risco baixo de integridade

Antes: dez módulos JavaScript transitivos podiam faltar sem o validador assinalar. Ação: análise de imports ESM, imports dinâmicos literais, CSS, SVG, fallbacks e `srcset`. O grafo atual tem 92 recursos.

Mover ficheiros não foi tratado como prova suficiente de segurança. A validação inclui testes HTTP, inspeção dos artefactos e comparação de hashes. Não foi alargada a CSP nem removida qualquer proteção do contacto. Não foram introduzidas novas dependências de execução; Playwright voltou apenas para testes.

## Limites e decisões preservadas

O limitador básico do formulário continua por instância, com estado partilhado Upstash opcional. A configuração legal continua a conter minutas por confirmar. A função preserva o requisito existente de Node 24.22.1 ou posterior da mesma linha. As alterações não verificam infraestrutura, configuração de DNS, HTTPS público, recebimento de correio ou segurança integral de fornecedores.

A revisão usa a skill `security-best-practices`, com a referência de segurança de JavaScript nativo no navegador. Não existe framework de servidor ao qual aplicar uma referência específica de Express/Next.js. Resultados concretos e limites estão em `validation.md`.
