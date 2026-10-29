# Segurança do código, dependências e segredos — conclusão local

Âmbito: site Dipanda, sem `casaspanda`. Versão dos ficheiros em [code-version.json](code-version.json), incluindo alterações não commitadas; testes atuais em [unit-tests.txt](unit-tests.txt) e respetivos metadados. As linhas abaixo referem-se ao código desta revisão; as linhas das prioridades históricas referem-se ao snapshot indicado no relatório original.

## Críticos/altos e correções

Não foi demonstrada vulnerabilidade crítica explorável na aplicação local. O relatório de preparação mantém problemas altos de operação/publicação separados dos resultados locais.

| Problema / evidência | Impacto | Correção / estado nesta fase |
|---|---|---|
| Autorização antiga em aba já aberta, `before-fix.json`: `other-tab-reject`, `expired-consent`; diff `consent.js.diff` | Preferência funcional podia voltar a ser gravada após recusa noutra aba ou expiração | `public/js/consent.js:17` e `:39`: relê e valida autorização em cada escrita; timer, eventos e BroadcastChannel reconciliam. S07–S09 e S14 dos novos testes. Gravidade limitada à preferência de animação atual; não há tracker nem sessão autenticada. **Verificado** nos cenários indicados. |
| Limitação de pedidos original por processo, sem armazenamento distribuído; relatório inicial SEC-01 | Spam/custo ao disponibilizar formulário em múltiplas instâncias | `scripts/contact-handler.mjs:25` reserva quota antes de ler/enviar; `scripts/contact-limits.mjs` limita memória local e prepara Redis atómico com falha fechada. Concorrência, expiração e indisponibilidade testadas com mocks. **Verificado localmente**; Redis real **pendente**, não necessário para estes testes locais. |
| Node global 24.11.1 anterior às correções identificadas na auditoria inicial | Usar o runtime antigo para servir publicamente deixaria risco de componente aberto | Servidores e processos que executam testes nesta fase usam Node **24.22.1** oficial, previamente verificado por SHA-256. O pai que grava relatórios usa o Node global por limitação de escrita; não serve o site nem executa os casos. **Verificado** nos JSON/metadados. Não foi alterada a instalação global. |
| Identidade/atividade/conservação e contratos incompletos | Impede uma conclusão de conformidade jurídica para publicação | Gate de produção e minutas incompletas mantidos. **Pendente** para publicação; não bloqueia concluir esta auditoria técnica exclusivamente local. Ver matriz legal. |

## Controlos revistos

| Requisito | Estado | Evidência e limite |
|---|---|---|
| SQL Injection e usos do ORM | Não aplicável | Sem SQL/ORM/base de utilizadores no site raiz. `casaspanda` não foi auditado nem publicado. |
| XSS / escape | Verificado no âmbito revisto | `src/components.mjs` escapa HTML/atributos; `src/policies.mjs` escapa variáveis legais; feedback do formulário em `public/js/app.js` usa textContent/createTextNode. Sem HTML do visitante/CMS aceite; não há sanitizador artesanal para conteúdo autorizado. Unitários verificam escape. Revisão estática direcionada, sem alegação de prova de ausência de XSS. |
| Validação servidor | Verificado | Schema, tipos, campos extra/duplicados, UTF-8, controlos, honeypot, instante inicial; JSON/form-urlencoded, 32 KiB, deadline, método/origem/esquema em `scripts/contact.mjs` e `scripts/contact-handler.mjs`. Unitários incluem pedidos rejeitados sem invocar envio. |
| URLs, cabeçalhos e cookies | Verificado localmente | Host/path no servidor, URLs públicas HTTPS validadas para configuração, autorização não depende dos cookies de consentimento; estrutura/versão/datas validadas por `consent-core.js`. |
| Autenticação, autorização entre contas, sessões, passwords | Não aplicável | Não existem contas, dados privados de utilizador, login/logout ou passwords neste projeto. Não foi inventado um teste de logout. |
| CSRF e CORS | Verificado no fluxo atual | POST exige Origin exata e recusa cross-site; sem CORS permissivo. Não há ações autenticadas por cookies. Origin não impede um bot; quotas continuam necessárias. |
| CSP e cabeçalhos | Verificado localmente | `scripts/security.mjs`, JSON de transporte HTTPS e respostas de navegação. `script-src 'self'`, sem unsafe-eval/inline script; base/object/frames bloqueados. `style-src 'unsafe-inline'` permanece para estilos/animações existentes, uma exceção documentada. Cabeçalhos de plataforma fora do âmbito. |
| Rate limit e falha de fornecedores | Verificado por testes locais | 6 pedidos/IP/rede IPv6 por 15 min, concorrência e TTL; preparação Redis com HMAC e quota global. Redis/Resend reais não contactados. Limitação de edge/WAF não foi testada. |
| Erros/logs e respostas privadas | Verificado no código/testes locais | Respostas genéricas e no-store; 200/502/503 simulados não refletem nome/e-mail/mensagem nem Set-Cookie. Logs de fornecedores fora do âmbito. |
| Segredos | Verificado com cobertura limitada | Scan atual: [secret-scan.json](secret-scan.json), script [scan-secrets.mjs](scan-secrets.mjs). Um candidato triado: URL fictício de rejeição em `tests/security.test.mjs:104`; nenhum segredo real identificado pelos padrões usados. Inclui histórico alcançável nos caminhos especificados; não abrange objetos Git inalcançáveis, ficheiros externos ou todos os formatos possíveis. Chave TLS de desenvolvimento apenas em TEMP. |
| Dependências | Verificado com cobertura limitada | `playwright-core@1.58.0` é a única dependência direta, apenas de desenvolvimento; lockfile sem transitivas adicionais. [npm-audit.json](npm-audit.json): zero advisories reportados nesta consulta, não garantia de ausência de vulnerabilidades. [Supply-chain original](../production-2026-10-29/supply-chain-report.md) mantém sinal upstream de binários e cobertura incompleta de publishers; não afirmar tudo seguro. Downloads de motores feitos pela CLI do Playwright; não executados como servidor público. |
| HTTPS e cookies Secure | Verificado / inconclusivo por controlo | TLS real local em [HTTPS.md](HTTPS.md); atributos de navegador nos resultados por motor. SameSite reportado por WebKit/Windows tem limitação explícita, não convertido em aprovação. |
| Criptografia e chaves | Verificado no código / não aplicável | Usa TLS, HMAC-SHA-256 Node e geração X.509 OpenSSL; sem criptografia própria. Sem passwords/DB de visitantes. Gestão de chaves e encriptação em repouso de futuros fornecedores fora do âmbito local. |
| Uploads / pagamentos | Não aplicável | Não implementados. |
| CodeQL/Semgrep / SAST completo | Pendente | Não executados: compatibilidade/dependências descritas em [04-skills.md](../production-2026-10-29/04-skills.md). Revisão manual e pesquisa por padrões não foram apresentados como scan dessas ferramentas. |

Relatórios iniciais completos: [segurança/configuração](../production-2026-10-29/02-relatorio-final.md), [prioridades com evidência original](../production-2026-10-29/01-prioridades-iniciais.md), [modelo de ameaças](../production-2026-10-29/1-threat-model.md), [supply-chain](../production-2026-10-29/supply-chain-report.md), [segredos inicial](../production-2026-10-29/secret-scan.json). São históricos; os novos testes e a versão atual não lhes foram atribuídos retroativamente.
