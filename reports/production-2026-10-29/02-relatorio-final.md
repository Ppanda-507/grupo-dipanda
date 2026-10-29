# Auditoria de preparação para produção — Dipanda

> **Âmbito atualizado pelo utilizador:** a fase atual é exclusivamente local. A conclusão técnica, versão exata, testes em três motores e TLS local estão no [relatório local consolidado](../local-audit-2026-10-29/RELATORIO.md). Este documento conserva a auditoria inicial de preparação para publicação; as pendências futuras de domínio/Vercel/certificados públicos não bloqueiam o encerramento da auditoria local. Não houve publicação.

**Decisão: não publicar ainda.** Correções de código e configuração preparadas na branch `audit/production-readiness-2026-10-29`. Não houve deploy, push, alteração de DNS ou de serviços de produção, criação de base de dados, nem envio real de e-mails.

Data: 29/10/2026. As alterações que já existiam no projeto foram preservadas. A branch inclui o estado de trabalho anterior; não foi criado commit que misture esse trabalho com uma publicação.

## Críticos e altos primeiro

Não foi demonstrada vulnerabilidade crítica alcançável na aplicação. Há **runtime desatualizado e bloqueios altos de preparação**, descritos abaixo com o impacto e a evidência original preservada em `baseline-evidence.txt`. Os níveis não são um score CVSS do site.

| ID | Gravidade e evidência | Impacto | Correção e estado |
|---|---|---|---|
| SEC-00 | Alta, componente/runtime: Node local original `24.11.1`; [aviso Node de outubro](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) e [boletim Vercel de 29/10](https://vercel.com/kb/bulletin/node-js-security-advisory) | Versão anterior às correções Brotli/TLS. Não há chamada explícita de decompression Brotli na aplicação, nem RCE demonstrada. Aviso do fornecedor não equivale a prova de exploração do site. | Runtime portátil oficial `24.22.1` descarregado/verificado por SHA-256, testes e preview repetidos nele. Produção/função exigem 24.22.1+ da linha 24 (`scripts/runtime-version.mjs:3`, `scripts/production-readiness.mjs:6`, `api/contact.js:9`). Node global não alterado; confirmar versão Vercel real. |
| SEC-01 | Alta, risco condicionado à ativação pública distribuída: `scripts/serve.mjs:20-22,34-35` no snapshot original | Contador por processo perde-se entre instâncias/reinícios; verificação antes de await e incremento posterior permite concorrência com leitura atrasada. Spam/custos/DoS de contactos; honeypot/Origin não autenticam bots. | Reserva antes de leitura/envio (`scripts/contact-handler.mjs:25`), limite local atómico no event loop e Redis EVAL/TTL durável preparado (`scripts/contact-limits.mjs:21,49`). Testes concorrentes passam; Redis real/conta ainda por testar. |
| PROD-01 | Alta funcional: único endpoint original em `scripts/serve.mjs:43-49` do snapshot; não havia `api/`/`vercel.json` | Publicar apenas a saída estática na Vercel não fornece a função que recebe contactos. | `api/contact.js:1` e `vercel.json:1` preparados segundo a [API Node da Vercel](https://vercel.com/docs/functions/runtimes/node-js). Sem deploy; integração real permanece pendente. |
| LEG-01 | Alta legal: `src/site.mjs:7-9` original sem NIF/endereço, marca tratada como entidade; utilizador confirma empresa não constituída | Identificação do prestador/responsável insuficiente para recolha/publicação. O responsável indicado é Paulo Panda, não uma sociedade presumida. | Identidade configurável, texto com nome indicado e gate de produção (`src/site.mjs:7`, `src/policies.mjs:6`, `scripts/production-readiness.mjs:3`). País/endereço/NIF/enquadramento por confirmar. **Bloqueio aberto.** |
| LEG-02 | Alta legal: `src/policies.mjs:22-24` original anuncia revisão de conservação aos 12 meses sem confirmação e fornecedores genéricos | Transparência/compromissos sem base operacional; transferências e eliminação não demonstradas. | Removido prazo não aprovado; textos parametrizados e marcados como minuta (`src/policies.mjs:25-26`). Aprovação real exigida. **Bloqueio aberto.** |

O teste inicial com 12 pedidos completos contra o servidor antigo resultou em seis 503 e seis 429: esse teste rápido **não demonstrou** a corrida de leitura atrasada. O problema foi identificado pela posição da verificação/incremento e pelo estado não partilhado, especialmente relevante ao alvo Vercel. No código novo, testes de 20 pedidos concorrentes verificam seis admissões e 14 rejeições; os envios são simulados ou recusados por não haver fornecedor configurado.

## Stack e âmbito

- Node.js ESM, páginas HTML geradas por `src/pages.mjs` e `scripts/build.mjs`, CSS e JavaScript de navegador próprios; 20 páginas atuais.
- Sem React/Next/Express no site Dipanda. Sem SQL, ORM, base de dados de utilizadores, login, sessão autenticada, upload, checkout ou pagamentos.
- Única dependência npm: `playwright-core@1.58.0`, desenvolvimento/testes, fixada com integridade no lock; nenhuma dependência runtime npm adicional introduzida.
- Formulário público: nome, e-mail, mensagem e dois campos antiabuso; envio previsto por Resend. Vercel é o alojamento confirmado, Hostinger o registrador previsto. Limites duráveis preparados com REST Upstash, ainda não contratados/configurados.
- `casaspanda/` foi excluído por instrução explícita: a stack Next/React/Drizzle desse outro projeto **não** fundamenta achados nesta auditoria. `.vercelignore:1` evita incluí-lo na publicação Vercel.

## Revisão de segurança e correções

| Área pedida | Resultado, evidência e limites |
|---|---|
| SQL Injection/ORM | Não aplicável à Dipanda atual: não há acesso SQL/ORM na raiz. O envio usa JSON para API de e-mail. Nenhuma query fictícia foi criada para “corrigir” um risco inexistente. |
| XSS/escape por contexto | `src/components.mjs:5-6` escapa HTML e atributos; mensagens de API usam textContent/createTextNode em `public/js/app.js:134-140`. Retirado o dashboard HTML dinâmico antigo em trabalho anterior. Não foi encontrado sink HTML de dados de visitante no código atual. `section.html` em políticas é conteúdo estático do repositório, não HTML autorizado do utilizador; avisos `LEGAL_*` passam por paragraphs/escape. Se houver CMS/HTML autorizado no futuro, será necessário sanitizador mantido, não regex caseira. |
| DOM/ficheiros ativos | Revisão de URLs, setters DOM e armazenamento; pesquisa em 25 SVG locais não encontrou script, event handlers, javascript: ou foreignObject. É pesquisa direcionada, não prova universal de ausência. |
| Validação no servidor | Schema rejeita campos inesperados, arrays, tipos inválidos, controlos, honeypot e datas inválidas (`scripts/contact.mjs:3-15`). Método, origem exata, Sec-Fetch-Site, media types e encoding validados; JSON/UTF-8 malformado e campos duplicados de formulário recusados; limite 32 KiB e tempo de leitura. `scripts/contact-handler.mjs:14-50`. Não existe upload. |
| URLs/cabeçalhos/cookies | Produção usa `SITE_URL` HTTPS válida e domínio real. Servidor local limita Host e caminhos ao diretório público (`scripts/serve.mjs:32-49`); Vercel gere ficheiros estáticos. Cookies não são lidos para autorização. `parseConsent` valida estrutura/versão/datas. Não se interpretam cabeçalhos arbitrários como identidade de utilizador. |
| Autenticação/autorização/sessões | Não aplicável a contas de visitantes porque não existem. Identidade da origem não autentica um bot. Não inventar sistema de passwords ou sessões. Contas administrativas dos fornecedores precisam de MFA/acesso mínimo, por verificar externamente. |
| CSRF/CORS | POST só da origem canónica, inclusive esquema; Origin ausente/null/externo e Sec-Fetch-Site cross-site rejeitados. Sem CORS permissivo. Sem ações autenticadas por sessão/cookie, não há token CSRF de sessão a acrescentar; proteger o canal anónimo contra spam continua necessário. |
| CSP/headers | `scripts/security.mjs:1` e `vercel.json` partilham CSP, nosniff, DENY, Referrer-Policy e Permissions-Policy. Scripts self, sem unsafe-eval/unsafe-inline de script; base/object/frame bloqueados. Style unsafe-inline é exceção limitada aos estilos inline já existentes e à animação; remover exigiria refactor visual separado. Navegação/recursos testados sem violações CSP. Cabeçalhos de edge real não verificados. |
| Limites/DoS | Quotas antes do corpo/envio; seis tentativas por IP/rede IPv6 /64/15 min e teto global 100/24h na preparação Redis; 429 com Retry-After, memória local limitada, deadlines para corpo/Redis/e-mail, timeouts de servidor. Falha de Redis/configuração resulta em 503, nunca bypass. O limite global é trade-off de orçamento/disponibilidade; WAF e proteção de custos ainda necessários. |
| Segredos/dependências | Scan por padrões em 109 ficheiros do estado de trabalho e pesquisa de alterações no histórico alcançável, fora de casaspanda: zero candidatos nesses padrões; não garante ausência absoluta. `.env.*` ignorados salvo `.env.example`; não há segredos em HTML ou respostas. `npm audit`: zero advisories reportados no lock atual. Relatório supply-chain original preserva cobertura/um sinal upstream de binários, só dev. O runtime Node foi avaliado separadamente de npm. |
| Erros e logs | Mensagens públicas genéricas; não devolvem stack, chave, payload do fornecedor ou mensagem enviada. Aplicação não regista nome/e-mail/mensagem. Plataforma, correio e eventuais log drains dependem de configuração externa. |
| HTTPS/TLS/certificados | Saídas para endpoints HTTPS fixos/allowlist; redirects recusados para evitar fuga de credenciais. Certificado, cadeia, renovação, redirects HTTP→HTTPS/canónico e políticas de edge dependem de domínio/conta ainda não fornecidos. Nenhuma ligação de produção foi modificada. |
| HSTS/conteúdo misto | Não ativado includeSubDomains/preload no código. Vercel documenta HSTS automático, a confirmar e avaliar antes da publicação. Recursos testados são locais; ligações externas reais usam HTTPS. Mirror HTTPS testa cookies, não TLS real. |
| Encriptação/chaves/passwords | HTTPS nativo; HMAC-SHA-256 da biblioteca Node para chaves de rate limit, não algoritmo próprio. HMAC de IP continua dado pseudonimizado. Não há passwords a hashear nem dados de formulário guardados numa DB local. Encriptação em repouso, backups, retenção e rotação de chaves nos fornecedores/caixas de correio estão por verificar. |

## Infraestrutura preparada

- `api/contact.js`: entrada Web Request/Response para Vercel Node; patch mínimo e IP de header confiável **apenas dentro da Vercel**, sem confiar em headers encaminhados no servidor local.
- `vercel.json`: static output `dist`, build/instalação sem scripts de pacotes e cabeçalhos; `.vercelignore` exclui fontes auxiliares/sensíveis e outro projeto.
- `scripts/production-readiness.mjs`: build de produção bloqueado com domínio, identidade, políticas ou configuração incompletos. Flag de revisão é declaração operacional, não substitui parecer ou validação dos conteúdos.
- `CONTACT_ENABLED=false` até a operação estar pronta; previews Vercel não enviam mensagens, mesmo com ativação indevida.
- `scripts/package.mjs`: entrega em diretório temporário novo, sem reaproveitar ficheiros antigos; inclui api/configurações/documentação e exclui .env/node_modules/casaspanda.
- `.github/workflows/verify.yml`: testes/build/audit, permissões read-only, checkout sem credenciais persistentes e actions fixadas a commits oficiais consultados. **Apenas ficheiro preparado; não executado no GitHub**.
- `deploy/VERCEL.md`: passos externos precisos, variáveis, DNS sem valores inventados, TLS/HSTS, correio, Redis/WAF, contratos, segredos, monitorização, teste e rollback.

O site é comercial mesmo sem pagamento online. Confirmar plano Vercel adequado: [Hobby é não comercial](https://vercel.com/docs/plans/hobby); o [DPA Vercel](https://vercel.com/legal/dpa) consultado descreve a sua aplicação aos planos cobertos. Não foi contratada uma subscrição nesta tarefa.

## Testes e evidência

| Verificação | Resultado |
|---|---|
| Unitários no Node 24.22.1 portátil | **22 passaram**, zero falhas; `unit-tests.txt`. Inclui ataques de origem/esquema/tipo, corpo excessivo/UTF-8, campos/controlo, quotas concorrentes, falha Redis, produção fechada e escape de texto legal. |
| Build de revisão | **20 páginas / 100 recursos locais verificados**, em TEMP; `build.txt`. |
| Build de produção sem dados reais | **Bloqueado como esperado** antes de escrever saída; `production-gate.txt`. Não constitui falha do teste. |
| Navegador com CSP/cookies/layout | **71 controlos passaram** em Edge/Chromium, Node 24.22.1; `browser-checks.json`. Mobile emulado 320/390, desktop 1280; sem pedidos a terceiros nas páginas navegadas. |
| HTTP real no preview local | Métodos/origens/tipos/compressão recusados; 20 pedidos paralelos → seis 503 sem serviço configurado e 14 respostas 429; **nenhum e-mail enviado**. `http-checks.json`. |
| Cookies HTTPS | Secure + SameSite=Lax em mirror HTTPS servido localmente. HttpOnly não é aplicável aos dois cookies lidos por JavaScript, sem autenticação; futura sessão exigiria cookies de sessão próprios e HttpOnly. |
| Supply chain | Coletor oficial executado, um pacote dev, advisories sem ocorrências na versão fixada; dados não avaliáveis e sinal upstream mantidos em `supply-chain-report.md`/JSON. |
| Segredos | Pesquisa por padrões sem candidatos; `secret-scan.json`. Não foi publicado conteúdo sensível nem fornecidas chaves para testes. |
| CodeQL/Semgrep/insecure-defaults | Não executados por incompatibilidade/dependências descritas em `04-skills.md`. Revisão manual não foi rebatizada de SAST completo. |
| Redis/Vercel/Resend reais, TLS/DNS | **Não testados**; não houve conta/endpoint/domínio nem autorização de publicar. A integração Redis foi testada com mocks de contrato/falha; atomicidade distribuída/TTL requer validação real. |
| Acessibilidade | Sem certificação WCAG. Testes de reflow, semântica básica e redução de movimento não substituem contraste/leitor de ecrã/teclado completos e teste em equipamento real. |

Nota de ambiente: o executável portátil corrigido conseguiu correr testes/build em TEMP e servir o preview, mas a gravação direta de relatórios em Documents devolveu EBADF, mesmo após execução escalada. Os resultados foram recolhidos pelo executável existente ou gravados em TEMP e copiados. Não se alteraram permissões Windows nem instalação global. O projeto deve usar uma instalação normal atualizada de Node para desenvolvimento futuro; não depende do binário temporário para ser recuperável do Git.

## Bloqueios à publicação e validações pendentes

1. **Identidade/atividade:** confirmar identificação completa de Paulo Panda, país de estabelecimento, morada profissional, NIF e enquadramento individual/sociedade. Falta domínio final.
2. **Jurídico:** resolver a matriz `03-matriz-legal.md`: privacidade, fundamentos, conservação, destinatários/DPA/transferências, Angola, consumidores, RAL/Livro de Reclamações e acessibilidade. Não preencher com factos inventados.
3. **Fornecedores:** confirmar plano Vercel comercial e contratos, região/segredos/MFA; configurar Resend/domínio remetente/caixa; decidir/contratar Redis e validar limites. São tarefas externas, não efetuadas.
4. **Runtime local e alojamento:** instalação global ainda 24.11.1; usar versão corrigida normalmente instalada. Verificar patch efetivo da Vercel, mesmo com seleção 24.x.
5. **DNS/TLS e ensaio de infraestrutura:** seguir `deploy/VERCEL.md`, validar certificado/renovação/HSTS/redirects, função e contagem entre instâncias. Só após autorização de publicação; não ocorreu nesta tarefa.
6. **Operação:** retenção/eliminação, pedidos de titulares, incidentes, logs sem payload, monitorização/custos, recuperação e acesso mínimo.

## Ficheiros para revisão

Os detalhes iniciais estão em `01-prioridades-iniciais.md`; o modelo de ameaças em `1-threat-model.md`; a conformidade requisito a requisito e fontes oficiais em `03-matriz-legal.md`; a inspeção/compatibilidade das skills em `04-skills.md`; os passos de infraestrutura em `../../deploy/VERCEL.md`.

As cinco skills compatíveis foram instaladas pelo método suportado com commits fixados. As alterações estão na branch, prontas para revisão, **sem commit/push/deploy de produção**. O preview local permanece disponível com runtime portátil corrigido.
