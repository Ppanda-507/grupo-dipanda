# Conclusão da auditoria local — Dipanda

**Concluída a verificação local dos controlos descritos, com limites explícitos.** 90 execuções de cenários: **86 verificadas, 0 falhas, 1 inconclusiva e 3 não aplicáveis**; 345 snapshots e 11792 pedidos de página inventariados. Os dois antigos inconclusivos de fechar/reabrir estão resolvidos: **12 reaberturas reais verificadas** (2 escolhas × 3 motores × HTTP/HTTPS), sem restauração de storageState.

Fica inconclusivo apenas o atributo SameSite na implementação WebKit/Windows. Isso não é aprovação de Safari. Não há publicação, deployment, alteração de Vercel/DNS nem envio real de mensagens. Certificados públicos, domínio e cache de plataforma foram excluídos pelo utilizador e **não bloqueiam esta conclusão local**. Esta conclusão não é uma certificação global de conformidade legal ou de segurança.

## Versão exata e ambiente

- Base Git: `d96498c6fd35e36c5cf64a7cc6801e31c604fc8e`, branch `audit/production-readiness-2026-10-29`.
- **Código testado inclui alterações não commitadas. A base Git isoladamente não identifica a versão testada.** Snapshot SHA-256: **`448cb3b0c7e9aa7128780e3af54ab19dc22f5d42c01ff6d1754be872ad4dd899`**. [Manifesto de todos os ficheiros/recursos/configurações/testes](code-version.json); cada JSON de navegador inclui o mesmo manifesto, horários e runtime.
- Servidores e executores de testes: Node **24.22.1** portátil oficial. O pai que grava evidências usa Node global 24.11.1 por restrição do Windows; não serve o site nem executa os testes. Ver metadados dos unitários/build/TLS. Reinício do HTTP após suporte TLS seguido de repetição dos testes HTTP; HTTPS já iniciado com a versão atual.
- Playwright **1.58.0**, Windows, motores efetivamente usados: **Chrome for Testing/Chromium 145.0.7632.6 (1208), Firefox 146.0.1 (1509) e WebKit 26.0 (2248/WinCairo)**. São os binários fixados por essa versão da ferramenta; não é uma alegação de testes nos browsers estáveis mais recentes. **Safari Apple/macOS/iOS não executado.** A documentação distingue [motores Playwright e browsers de marca](https://playwright.dev/docs/browsers).
- HTTP loopback 4173 e HTTPS loopback 4443 reais. HTTPS com certificado de desenvolvimento de sete dias; confiança do sistema não modificada. [Relatório HTTPS](HTTPS.md), [transporte observado](https-transport.json).
- Só Dipanda; casaspanda excluído. Dados fictícios e perfis novos dedicados em TEMP. A rede observada é a dos contextos de página, não todo o tráfego do sistema operativo/browser de fundo.

## Resultados por motor e transporte

| Motor / transporte | Verificado | Inconclusivo | Não aplicável | Falhas | Evidência |
|---|---:|---:|---:|---:|---|
| chromium 145.0.7632.6 / http: | 14 | 0 | 1 | 0 | [chromium-http.json](chromium-http.json) |
| firefox 146.0.1 / http: | 14 | 0 | 1 | 0 | [firefox-http.json](firefox-http.json) |
| webkit 26.0 / http: | 14 | 0 | 1 | 0 | [webkit-http.json](webkit-http.json) |
| chromium 145.0.7632.6 / https: | 15 | 0 | 0 | 0 | [chromium-https.json](chromium-https.json) |
| firefox 146.0.1 / https: | 15 | 0 | 0 | 0 | [firefox-https.json](firefox-https.json) |
| webkit 26.0 / https: | 14 | 1 | 0 | 0 | [webkit-https.json](webkit-https.json) |

“Não aplicável” nos três runs HTTP corresponde ao controlo específico de cookies sobre HTTPS, executado separadamente no servidor TLS real. As limitações de CDP fora do Chromium constam de cada JSON: headers e Resource Timing não provam por si sós a origem de cada reutilização de cache de disco.

## Tabela de cenários

| Cenário | Esperado | Observado | Evidência | Estado |
|---|---|---|---|---|
| Antes de escolher | Nenhuma autorização por scroll, cliques ou fecho do diálogo | Zero cookies e outros armazenamentos da aplicação em 19 rotas; scroll e espera de oito segundos sem ativação. | S01-before-choice; seis JSON por motor/protocolo | Verificado |
| Rejeitar | Só guardar escolha necessária | functional=false; preferências não criadas após interações tardias, reload, navegação, histórico ou nova aba. | S02-reject; seis JSON por motor/protocolo | Verificado |
| Aceitar todos | Ativar apenas o opcional existente | Dois cookies, sem outros mecanismos; preferência de animação reposta; autorização original não renovada. | S03-accept-all; seis JSON por motor/protocolo | Verificado |
| Personalizar: só necessários | Sem seleção prévia nem opcional | Grava recusa; persiste nas navegações e reaberturas do contexto. | S04-custom-essential-only; seis JSON por motor/protocolo | Verificado |
| Personalizar: funcional | Ativar só a categoria selecionada | Única categoria opcional ativada. Não há categorias fictícias de publicidade/analytics. | S05-custom-functional; seis JSON por motor/protocolo | Verificado |
| Retirar consentimento | Eliminar opcional e impedir novas escritas | Cookie funcional removido e não recriado; recusa persiste. | S06-withdraw; seis JSON por motor/protocolo | Verificado |
| Retirada noutra aba | Aba antiga respeita nova escolha | Evento tardio não recria preferência e diálogo reflete recusa. | S07-other-tab-revocation; seis JSON por motor/protocolo | Verificado |
| Autorização expirada na aba | Não usar autorização antiga | Fixture expirada bloqueada; preferência retirada e banner regressa. | S08-expiry-open-tab; seis JSON por motor/protocolo | Verificado |
| Expiração sem interação / TTL | Opcional não ultrapassa autorização | Timer reabre banner; cookie expirado inacessível ao JS e ausente do pedido seguinte. Inventário bruto Firefox preserva entradas expiradas. | S09-expiry-timer-and-ttl; seis JSON por motor/protocolo | Verificado |
| Limpeza seletiva | Não apagar cache/armazenamento alheios | Sentinelas não pessoais em LS/SS/IDB/Cache Storage preservadas; opcional eliminado. | S10-selective-cleanup; seis JSON por motor/protocolo | Verificado |
| Formulário / cache | Resposta sem cache nem dados pessoais persistidos | Pedido inválido fictício rejeitado com no-store; sem e-mail nem armazenamento da resposta. | S11-contact-private-cache; seis JSON por motor/protocolo | Verificado |
| Fechar e reabrir: recusa | Mesmo perfil conserva escolha | Fecho real e novo processo com o mesmo diretório; controlo independente e recusa original preservados. | S12-reopen-browser-reject; seis JSON por motor/protocolo | Verificado |
| Fechar e reabrir: aceitação | Mesmo perfil conserva escolha e preferência | Fecho real e novo processo; cookie de controlo, aceitação original e preferência preservados. Sem storageState. | S12-reopen-browser-accept; seis JSON por motor/protocolo | Verificado |
| Cookies sobre HTTPS real | Secure e SameSite=Lax | Secure nos três motores; Lax confirmado Chromium/Firefox. WebKit Windows reporta None, inclusive no controlo independente Lax: limitação não resolvida. HTTP: não aplicável. | S13-https-cookie-attributes; seis JSON por motor/protocolo | Inconclusivo no controlo indicado |
| Rede / integrações tardias | Nenhuma escrita não autorizada/terceiro | Rede de todos os cenários e operações instrumentadas sem pedido a terceiros ou escrita funcional não autorizada. | S14-network-and-write-audit; seis JSON por motor/protocolo | Verificado |

Inventários completos em snapshots (cookies brutos com flags/TTL, documentCookieNames, LS/SS, IndexedDB/object stores/contagens, Cache Storage/entradas e service workers), storageOperations, network (inclui nomes dos cookies efetivamente enviados), httpCache e Resource Timing. Controlos fictícios de S10/S12 são identificados, não atribuídos à aplicação.

## Fechar e reabrir: causa e resolução

A primeira execução na sandbox reproduziu a perda do cookie do site e de controlos independentes, mantendo localStorage. O diagnóstico registou `os_crypt_win.cc:77 Failed to encrypt ... (0x2)`, com saída normal dos processos. [JSON restrito](profile-diagnostic-restricted.json), [log restrito](profile-diagnostic-restricted.txt) e [suite restrita preservada](chromium-http-restricted.json).

Repetição autorizada fora da sandbox, sem alterar a encriptação nem as preferências do browser, conservou os mesmos cookies após novo processo: [JSON com acesso normal ao perfil](profile-diagnostic-unrestricted.json), [log e saída dos processos](profile-diagnostic-unrestricted.txt). A evidência suporta a atribuição da perda à restrição do ambiente de teste, não ao código da página; não se presume comportamento de outros equipamentos. Os novos S12 verificam aceitar e recusar nos três motores e nos dois transportes, mantendo o cookie independente e o timestamp/valor originais.

O script atual **não chama storageState**, nem exporta/importa cookies para simular reabertura. Cada S12 cria um diretório, escolhe pela interface, fecha o navegador, inicia outro processo no mesmo diretório e visita outra página.

## Diferenças entre motores e evidência não ocultada

Firefox devolve na API de inspeção certas entradas já expiradas. O primeiro teste interpretou-as como cookies ativos: [run de diagnóstico preservado](firefox-http-expiry-diagnostic.json), S09. A revisão do harness preservou as entradas brutas e passou a verificar validade, acessibilidade por document.cookie e Cookie do pedido real seguinte; o timer deve igualmente reabrir o banner. Os novos runs passaram. Não foi apagado o inventário para obter aprovação.

WebKit/Windows conserva as escolhas e bloqueia o armazenamento opcional nos testes. Porém reporta SameSite=None para cookies escritos com Lax, também nos controlos independentes. Os atributos enviados pelo JavaScript estão em storageOperations[].operations[].attributes; Secure foi confirmado sobre TLS. Sem prova suficiente para distinguir limitação de reporte de aplicação efetiva do atributo, **SameSite mantém estado inconclusivo neste motor**. Validação Safari real/macOS/iOS fica pendente fora dos motores disponíveis nesta máquina.

## Classificação por finalidade e limites

| Mecanismo | Finalidade / dados | Estado |
|---|---|---|
| dipanda_consent | Escolha necessária: versão, datas e booleano; sem identidade/autenticação | Verificado; necessário à memória da escolha |
| dipanda_preferences | Pausa de animações; opcional funcional | Verificado; só autorizado, TTL limitado pela escolha, eliminado ao retirar |
| localStorage/sessionStorage/IndexedDB/Cache Storage/SW | Nenhum uso pela aplicação atual; sentinelas apenas de teste | Verificado nos cenários; sem limpeza indiscriminada |
| Cache HTTP | Conteúdo público/recursos; não é cookie nem necessariamente rastreio | Verificado com limites de observação; dados de contacto no-store |
| Login/logout/cache após sessão | Não há contas, sessão ou respostas privadas autenticadas | Não aplicável |
| Analytics, publicidade e embeds de terceiros | Não configurados; não foram inventados serviços para testar | Não aplicável no código atual; futuras integrações exigem novos testes |
| Plataforma CDN, domínio, certificado público/renovação | Não existe deployment no âmbito | Não aplicável a esta fase, por instrução expressa |
| Segurança/privacidade jurídica global | Operação, identidade, retenção, contratos, Angola e acessibilidade | Pendente; ver relatórios separados, sem bloquear o fecho técnico local |

## Código, scripts e ficheiros pedidos

- [Diff de consent.js contra a base Git](consent.js.diff); [código atual](../../public/js/consent.js).
- [Suite completa](../../scripts/check-consent-storage.mjs), [orquestrador](../../scripts/run-local-consent-audit.mjs), [diagnóstico de perfil](../../scripts/diagnose-browser-profile.mjs), [gerador de versão](../../scripts/audit-code-version.mjs).
- [Servidor HTTP/HTTPS](../../scripts/serve.mjs), [certificado local via OpenSSL](../../scripts/create-local-tls.ps1), [verificação TLS/cabeçalhos/cache](../../scripts/check-local-https.mjs), [captura de testes/build](../../scripts/capture-local-audit-evidence.mjs).
- [before-fix.json original](../consent-storage-2026-10-29/before-fix.json), [profile-diagnostic.json original](../consent-storage-2026-10-29/profile-diagnostic.json), [after-fix.json anterior](../consent-storage-2026-10-29/after-fix.json). São registos históricos, não novos resultados. before-fix guarda apenas as duas reproduções resumidas, sem trace completo/hash contemporâneo; essa limitação histórica não foi reconstruída artificialmente.
- [23 testes unitários, zero falhas](unit-tests.txt), [metadados/runtime/versão](unit-tests.txt.meta.json), [teste de respostas privadas](../../tests/consent-storage.test.mjs), [restantes testes de segurança](../../tests/security.test.mjs), [build: 20 páginas/100 recursos](build.txt).
- [Segurança do código, dependências e segredos](SEGURANCA.md), [npm audit atual](npm-audit.json), [scan de segredos atual e triagem](secret-scan.json), [HTTPS](HTTPS.md), [matriz legal e ligação à matriz completa](MATRIZ-LEGAL.md).
- Relatórios iniciais completos: [segurança/configuração](../production-2026-10-29/02-relatorio-final.md), [prioridades](../production-2026-10-29/01-prioridades-iniciais.md), [threat model](../production-2026-10-29/1-threat-model.md), [supply chain](../production-2026-10-29/supply-chain-report.md), [matriz legal](../production-2026-10-29/03-matriz-legal.md), [skills/compatibilidade](../production-2026-10-29/04-skills.md). Não atribuir retroativamente o snapshot atual aos scans históricos.
- [Instruções para reproduzir](REPRODUZIR.md). Sem credenciais reais, sem publicação, sem envio válido ao serviço de e-mail. A lista/hash dos artefactos de entrega fica em artefactos.json.

## Enquadramento legal da verificação

Aplicada a skill compliance-check. Os testes verificam os controlos técnicos de escolha/retirada, não a legalidade completa do tratamento. A [CNPD](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf) atribui ao operador responsabilidade pelos cookies que permite; a [Lei 46/2012](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793) estabelece o regime de acesso/armazenamento no terminal e exceções, e o [EDPB](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) trata escolha positiva, recusa e retirada. Fontes consultadas em 29/10/2026. A classificação depende da finalidade e dos dados envolvidos; não foi exigido consentimento nem apagada indiscriminadamente toda a cache HTTP.
