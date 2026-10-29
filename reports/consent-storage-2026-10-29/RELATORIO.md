# Verificação efetiva de cookies e armazenamento

> **Atualização de 29/10/2026:** a conclusão atual e a versão exata do código estão no [relatório local consolidado](../local-audit-2026-10-29/RELATORIO.md). Os dois testes de fechar/reabrir foram resolvidos com perfis reais dedicados, sem `storageState`; foram acrescentados Firefox, WebKit e HTTPS local verdadeiro. Os ficheiros abaixo são preservados como evidência histórica da primeira execução. Os resultados antigos e as suas limitações não representam o estado atual. Vercel/domínio/certificados públicos estão fora desta fase, conforme instrução do utilizador.

Ficheiros para revisão: [diff de consent.js](../local-audit-2026-10-29/consent.js.diff), [script completo](../../scripts/check-consent-storage.mjs), [before-fix.json](before-fix.json), [profile-diagnostic.json](profile-diagnostic.json), [novos testes unitários](../local-audit-2026-10-29/unit-tests.txt), [segurança/dependências/segredos](../local-audit-2026-10-29/SEGURANCA.md), [HTTPS local](../local-audit-2026-10-29/HTTPS.md) e [matriz legal](../local-audit-2026-10-29/MATRIZ-LEGAL.md).

## Execução inicial preservada

**Resultado:** correções verificadas no projeto local; não constitui declaração global de conformidade. Playwright/Edge: **16 cenários, 14 confirmados, 0 falhas finais, 2 inconclusivos**, 62 snapshots de armazenamento e 2.186 pedidos inventariados. Os dois inconclusivos dizem respeito ao fecho/reabertura física de perfis automatizados, não foram convertidos em resultados positivos.

Data: 29/10/2026. Skill utilizada: [compliance-check](C:/Users/DELL/.codex/skills/compliance-check/SKILL.md). Contexto confirmado anteriormente: Paulo Panda, Portugal/UE e Angola, visitantes particulares/empresas, site informativo sem pagamentos nem contas de utilizadores. O domínio/ambiente real Vercel não foi publicado ou alterado nesta tarefa. `casaspanda` está excluído.

## Problemas encontrados e corrigidos

1. **Revogação noutra aba não bloqueava a aba antiga.** Depois de aceitar em A e rejeitar em B, um evento de animação em A recriava `dipanda_preferences`. O código consultava uma cópia antiga de `consent`. Falha reproduzida em navegador, não apenas inferida. Evidência anterior: `before-fix.json`, cenário `other-tab-reject`.
2. **Autorização expirada continuava utilizável numa página aberta.** Ao expirar/substituir por um consentimento inválido, a aba ainda gravava o cookie funcional. Evidência anterior: `before-fix.json`, cenário `expired-consent`.
3. **Prazo do cookie funcional podia ultrapassar a autorização.** A gravação usava sempre mais 180 dias, mesmo que a escolha que a autorizava estivesse perto de expirar. Isso foi corrigido e testado com uma escolha de duração restante controlada.

Correções em `public/js/consent.js`:

- `readConsent`/`reconcile` (linhas 17–33) consultam o cookie atual e validam a sua vigência; nenhuma escrita funcional usa apenas a autorização que existia na abertura da página.
- `savePreference` (linhas 39–43) verifica autorização antes de cada escrita e limita Max-Age ao prazo restante. Sem autorização válida, remove apenas o cookie opcional conhecido.
- Expiração ativa por timer; sincronização por BroadcastChannel, focus, visibilitychange e pageshow (linhas 93–96). O canal comunica apenas a indicação técnica de alteração, sem criar armazenamento ou identificadores adicionais.
- Leitura/aplicação de uma preferência não volta a gravá-la por efeito do próprio evento de animação. Guardar uma escolha exige confirmar que o navegador realmente aceitou o valor; caso contrário, falha fechado nessa página.
- A pausa de animação pode continuar em memória na página atual, mesmo sem cookies, para não prejudicar a escolha de acessibilidade. Isso não autoriza persistência: depois de rejeitar, interagir não cria o cookie funcional e a preferência não é restaurada noutras páginas a partir dele.
- A política passou a indicar que o cookie funcional dura **até** 180 dias, sem ultrapassar a escolha que o autorizou.

Não foram introduzidas novas categorias, ferramentas de analytics, serviços de publicidade ou uma limpeza geral de dados do navegador.

## Método e evidência

Script de regressão: `scripts/check-consent-storage.mjs`; execução: `npm.cmd run test:consent-storage`. Requer servidor local e Edge/Chromium instalado, com opção `BROWSER_EXECUTABLE`. `TEST_URL` restringe estes testes a loopback; não enviam formulários válidos a um serviço real.

Cada cenário normal inicia um contexto novo, sem consentimento prévio. Os testes que verificam continuidade preservam deliberadamente o mesmo contexto ou restauram o estado previamente escolhido; estão identificados. Os perfis persistentes e os dados de controlo são novos, dedicados ao teste, em TEMP. O perfil pessoal do utilizador não foi usado nem limpo.

- Cookies: inventário de todos os cookies do contexto, com domínio, path, validade, flags e classificação de origem; instrumentação de leituras/escritas/remoções por JavaScript.
- localStorage e sessionStorage: snapshots e instrumentação de get/set/remove/clear.
- IndexedDB: nomes/versões, object stores e contagem de registos, sem extrair dados pessoais.
- Cache Storage: nomes, URLs, status, Cache-Control e tamanho dos corpos; não é confundida com a cache HTTP.
- Service workers: registos, scope/script e observação de respostas provenientes deles.
- Rede: URL, método, tipo, origem, status e Cache-Control; CDP para respostas reutilizadas de cache HTTP/prefetch/service worker.
- A página inicial foi observada após interação/scroll e uma janela de oito segundos, antes de escolher; as 19 rotas navegáveis atuais, excluindo `/404`, foram percorridas sem escolha. Reload, navegação, histórico e nova aba foram repetidos nas escolhas principais.

Evidência detalhada: **`after-fix.json`**. Os IDs abaixo correspondem a `scenarios[].id`; os estados completos estão em `snapshots[]`, os acessos em `storageOperations[]`, o tráfego em `network[]` e a cache HTTP em `httpCache[]`. `before-fix.json` preserva as duas falhas reproduzidas antes das correções.

## Tabela de resultados

| Cenário | Resultado esperado | Resultado observado | Evidência | Estado |
|---|---|---|---|---|
| Antes de qualquer escolha | Sem armazenamento opcional, sem aceitação por scroll/clique/fecho do diálogo | Zero cookies; local/sessionStorage vazios, zero DBs, Cache Storage e service workers. Sem terceiros. Interagir e fechar preferências não concede autorização. | S01; snapshots `initial`, `after-scroll-and-eight-seconds`, `route-*` | Confirmado localmente |
| Rejeitar opcionais | Apenas cookie necessário da escolha, sem gravação de preferência | Só `dipanda_consent` com functional=false; atividade tardia/animação não cria `dipanda_preferences`. Sem outros mecanismos ativos. | S02 | Confirmado localmente |
| Aceitar todos | Apenas os serviços das categorias existentes autorizadas | Dois cookies próprios: escolha e preferência de animação; preferência restaurada corretamente, sem outros armazenamentos ou terceiros. | S03 | Confirmado localmente |
| Personalizar: essenciais | Funcional desmarcado, nenhum opcional ativado | Escolha false guardada e respeitada após navegação e retorno. | S04 | Confirmado localmente |
| Personalizar: funcional | Ativar apenas a categoria escolhida | Só a preferência funcional foi ativada. Não existem categorias de analítica/publicidade nem uma segunda categoria opcional para testar combinações entre opcionais. | S05 | Confirmado no âmbito existente; combinação entre várias opcionais não aplicável |
| Alterar/retirar consentimento | Remover identificador funcional e interromper gravações futuras | Cookie funcional eliminado; não reaparece com interações, reload, navegação, histórico ou nova aba. A escolha false permanece. | S06 | Confirmado; regressão corrigida |
| Revogar noutra aba | Aba antiga não pode reutilizar autorização revogada | Evento tardio na aba antiga não recria o cookie; diálogo apresenta a recusa atual. | S07; comparação com `before-fix.json` | Confirmado; regressão corrigida |
| Expirar numa aba aberta | Expiração exige nova escolha e bloqueia escritas | Cookie funcional removido; banner volta a pedir escolha, sem aceitação automática. | S08 | Confirmado; regressão corrigida |
| Prazo restante/timer | Cookie opcional não dura além do consentimento; expiração é reconciliada sem ação | Fixture com prazo restante curto verificou TTL limitado e remoção após expiração. Não se esperaram 180 dias reais. | S09 | Confirmado com relógio/prazo controlado |
| Recarregar/navegar/voltar ao site | Preservar escolha, sem substituir recusa por aceitação | Timestamp/validade/boolean da escolha mantidos em reload, páginas, histórico e nova aba. Com estado persistente restaurado, tanto recusa como aceitação funcionam. | S02–S06, S12b | Confirmado para navegador em execução e estado restaurado |
| Fechar/reabrir processo: recusa | Cookie persistente e recusa conservados em disco | Perfil automatizado perdeu a escolha **e** um cookie persistente de controlo independente. O site pediu nova escolha e não ativou opcionais. | S12-reopen-browser-reject; `profile-diagnostic.json` | **Inconclusivo** para persistência física |
| Fechar/reabrir processo: aceitação | Cookie persistente e autorização conservados em disco | Mesma perda do cookie de controlo. Não é possível atribuir a perda ao código do site com este perfil automatizado. | S12-reopen-browser-accept; `profile-diagnostic.json` | **Inconclusivo** para persistência física |
| Limpeza seletiva | Retirar consentimento não apaga cache técnica ou dados não relacionados | Sentinelas não pessoais de localStorage, sessionStorage, IndexedDB e Cache Storage sobrevivem; cookie funcional próprio é removido. Sentinelas são fixtures do teste, não mecanismos usados pela aplicação. | S10 | Confirmado com fixtures |
| Formulário/respostas privadas | Não guardar respostas de contacto em caches partilhadas | API local devolve no-store; nenhuma entrada da API em Cache Storage. Teste unitário simula sucesso/erros e confirma no-store e ausência dos dados submetidos na resposta. | S11; `tests/consent-storage.test.mjs` | Confirmado para API; logout não aplicável |
| Cookies HTTPS | Flags adequadas para preferências | Secure e SameSite=Lax em ambos os cookies num mirror HTTPS local. Não são cookies de sessão autenticada, logo a leitura por JS é intencional. | S13 | Confirmado em simulação HTTPS; TLS real não testado |
| Terceiros e uso tardio de armazenamento | Nenhum tratamento não autorizado no âmbito do código existente | 2.186 pedidos próprios, zero pedidos a terceiros; nenhuma utilização pela aplicação de local/sessionStorage, IndexedDB, Cache Storage ou registo de SW. Todas as escritas positivas do cookie funcional observadas tinham autorização válida no instante da escrita. | S14; `network`, `storageOperations` | Confirmado nas ações/janelas testadas |
| Scripts/integrações terceiros carregados tardiamente | Se existissem, teriam de depender da categoria adequada e parar após retirada | Não existe SDK terceiro, embed analítico, publicidade ou integração opcional tardia no código atual. O evento funcional tardio real foi testado. Não se fabricou um SDK de publicidade para afirmar que a integração real passou. | S01, S02, S07; pesquisa no código | Não aplicável às integrações ausentes; futuras integrações por verificar |
| Terminar sessão e acesso posterior | Dados de conta privada não podem reaparecer | O site não tem login, sessão autenticada ou área de conta privada. Não há fluxo de logout a testar e não se usou o outro projeto casaspanda como substituto. | Revisão da stack/rotas | Não aplicável neste site |

## Inventário por finalidade

| Mecanismo | Uso real observado | Finalidade/dados | Tratamento na recusa/retirada |
|---|---|---|---|
| `dipanda_consent` | Após escolha, nunca antes | Necessário para guardar decisão, versão e datas; não é identificador aleatório de publicidade | Preservado para respeitar a recusa; validade de 180 dias, sem renovação automática por simples navegação |
| `dipanda_preferences` | Só com categoria funcional válida | Opcional, booleano da pausa de animação | Removido na retirada/expiração; novas escritas bloqueadas e TTL limitado à autorização |
| Cookies de terceiros | Nenhum | Sem terceiros ativos neste fluxo | Nenhuma remoção possível/necessária observada; origens externas não foram abertas como se pertencessem ao site |
| localStorage/sessionStorage | Não usados pela aplicação | Nenhuma persistência de contacto/identificador nestes mecanismos | Não são limpos globalmente; sentinelas de teste demonstram preservação |
| IndexedDB | Nenhuma DB da aplicação | Sem dados armazenados | Não há deleteDatabase geral; DB fixture não pessoal preservada |
| Cache Storage | Não usada pela aplicação | Sem respostas pessoais; fixture contém recurso estático não pessoal | Não há caches.delete geral; fixture técnica preservada |
| Service workers | Zero registos/respostas | Sem cache offline/worker de tracking | Não há unregistration indiscriminado de workers |
| Cache HTTP | Cinco eventos CDP de reutilização de `/`, HTML público, sem personalização por cookie | Entrega/desempenho de conteúdo público; distinta de cookies e Cache Storage | Não foi apagada ao recusar/retirar. Não é, por si só, armazenamento de tracking que exige opt-in |
| API `/api/contact` | POST sintético inválido no navegador; sucesso/erros simulados em unitário | Comunicação solicitada pelo visitante; não depende do consentimento funcional | Respostas no-store, sem refletir o nome/e-mail/mensagem; nenhuma mensagem real enviada nos testes |
| BroadcastChannel | Apenas sincronização de abas | Sinal técnico efémero de alteração de consentimento, sem identificador ou armazenamento persistente | Serve para aplicar a retirada; não é um serviço de marketing |
| Memória da página | Estado de UI/animação | Funcionamento da interface, sem transmissão/identificador | A recusa não força a retoma de animações; impede guardar/reutilizar a preferência opcional |

Nos pedidos registados, 2.127 respostas tinham Cache-Control no-store e 59 não apresentavam esse cabeçalho. A ausência de no-store num recurso **público e não personalizado** não é um achado de tracking. Foram observados cinco eventos de cache HTTP para HTML público, zero respostas de service worker; não foi encontrado contacto privado nessas respostas. Estes números não representam inventário integral da cache de disco nem todos os comportamentos de um CDN futuro.

## Fundamento e limites jurídicos

A qualificação depende da finalidade e dos dados, não apenas de chamar “cookie”, “cache” ou “essencial” ao mecanismo. A CNPD recorda a responsabilidade do operador pelos cookies e o consentimento quando exigido. O EDPB distingue a avaliação da finalidade da simples enumeração e exige retirada acessível. Fontes oficiais consultadas: [CNPD — nota sobre cookies](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf), [Lei 46/2012, alteração do art. 5 da Lei 41/2004](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793), [EDPB — Cookie Banner Taskforce](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf).

Os estados “confirmado” são resultados técnicos das condições testadas. Identidade, informação jurídica, retenção backend/fornecedores, tratamento em Angola e demais bloqueios da [matriz legal anterior](../production-2026-10-29/03-matriz-legal.md) continuam pendentes. O banner visível ou um conjunto de testes verdes não certifica conformidade legal global.

## O que ainda não foi possível verificar

- Persistência física dos cookies depois de terminar/reabrir processo nos perfis automatizados Windows: tanto o cookie do site como um controlo alheio desapareceram; localStorage de controlo sobreviveu. Confirmar num navegador normal sem política de apagar cookies ao sair, também em equipamento real. A restauração explícita do estado foi testada e passou, mas não substitui esta verificação.
- Vercel/CDN, domínio e HTTPS reais; cookies injetados por plataforma, proxies, log drains, analytics ativados fora do repositório e cabeçalhos reais de cache. Não houve deploy nem modificação desses serviços.
- Safari/Firefox, restrições especiais de armazenamento e extensões do utilizador; esta bateria usa Edge/Chromium.
- Logout/área autenticada e dados de conta privada: funcionalidades inexistentes. Qualquer introdução futura exige nova verificação de headers, SW/Cache Storage, limpeza de sessão e back/forward.
- Serviços de terceiros opcionais e combinações entre duas categorias opcionais: inexistentes. Acrescentar serviços exige inventário, bloqueio de carregamento/armazenamento por categoria, rotina de desligar/limpar identificadores próprios e testes específicos. BroadcastChannel e guardas da preferência atual não constituem automaticamente um CMP universal para SDKs futuros.
- Histórico infinito, execução indefinida ou qualquer alteração futura não são cobertos pela janela de observação automatizada.

## Testes e revisão

- `npm.cmd run test:consent-storage`: 14 confirmados, 2 inconclusivos, 0 falhas; evidência JSON detalhada.
- `node --test tests/*.test.mjs`: **23 passaram**, incluindo respostas de contacto 200/502/503 sem cache nem eco de dados privados.
- Build de revisão: **20 páginas e 100 recursos locais verificados**; relatório `build.txt`.
- Nenhum e-mail real enviado, nenhum perfil pessoal limpo, nenhum site publicado. Alterações na branch `audit/production-readiness-2026-10-29`.

O responsável deve validar o inventário e as finalidades antes de publicação; a pessoa técnica deve repetir os testes no ambiente real após autorização; a revisão jurídica dos documentos mantém-se necessária. Estes passos pendentes não foram assinalados como concluídos.
