# Consolidação da auditoria local — 29/10/2026

**Fase local consolidada.** A correção do executor e os **32 testes aprovados** pertencem à fase posterior aos testes de navegador. Não foram repetidos testes nesta consolidação. **SameSite no WebKit/Windows permanece inconclusivo (UNVERIFIED)**; Safari real não foi executado. Não houve deployment, push, alteração de serviços públicos ou envio real de mensagens.

## Versões e proveniência

| Fase | Versão dos ficheiros (SHA-256) | Evidência e alcance |
|---|---|---|
| Navegadores e HTTPS local, antes da correção do executor | `448cb3b0c7e9aa7128780e3af54ab19dc22f5d42c01ff6d1754be872ad4dd899` | [Manifesto anterior](code-version.browser-tested.json), [relatório histórico](RELATORIO-NAVEGADORES-ANTERIOR.md), runs.json/totals.json e os seis JSON de navegador: 90 cenários, 86 verificados, zero falhas de cenário, 1 inconclusivo, 3 não aplicáveis. Estes resultados não demonstravam a propagação de erros pelo executor. |
| Correção do executor, já testada na tarefa anterior | `fd3031562fa9442aed2a9d0bfd991477a5469f9263d176fcb281614f37dd22e8` | [Manifesto preservado da execução](code-version.runner-tested.json), [32 aprovados e proveniência](executor-fix-tests.json), [nove casos/logs reais de subprocessos simulados](runner-regression/). Zero falhas nos 32 testes. Não é uma nova execução dos testes de navegador. |
| Consolidação documental atual | `fd3031562fa9442aed2a9d0bfd991477a5469f9263d176fcb281614f37dd22e8` | [Manifesto atual](code-version.json), com base Git `da760fcb32971d82d7f89b7f70dc109cb123662f` na branch `audit/production-readiness-2026-10-29`. Os bytes do código coincidem com os da execução dos 32 testes; só documentação/evidências foram consolidadas. Nenhum teste repetido. |

O snapshot é calculado sobre os bytes de aplicação, recursos, configuração e testes; não inclui relatórios, para evitar circularidade. O commit-base do manifesto é o ponto de recolha, não o identificador de um futuro commit que contenha este relatório. As únicas diferenças de código entre as duas fases são **scripts/run-local-consent-audit.mjs** e **tests/consent-audit-runner.test.mjs**; os ficheiros do site e as regras de consentimento não mudaram.

## Correção do executor e testes aprovados

[run-local-consent-audit.mjs](../../scripts/run-local-consent-audit.mjs) termina com código **1** perante falha/sinal/timeout do subprocesso, relatório ausente, JSON inválido, identidade/versão/contagens inconsistentes ou cenários FAIL. Aguarda close para recolher stdout/stderr; conserva JSON inválido sem o reescrever e arquiva relatórios/logs anteriores com sufixo previous. Em runs.json, erros de execução são ERROR, falhas de cenário são FAIL, e resultados inconclusivos continuam UNVERIFIED. Um UNVERIFIED válido não se transforma em PASS nem aumenta a contagem de aprovados.

Os [nove testes de regressão](../../tests/consent-audit-runner.test.mjs) executam o processo principal real com subprocessos simulados: falha sem relatório, saída zero sem relatório, JSON malformado, estrutura inválida, cenário FAIL mesmo com saída zero, relatório válido com saída 17, executável inexistente, UNVERIFIED e PASS. Confirmam o código do processo principal e a preservação dos logs/relatórios. Não usam navegador nem rede.

Comando já executado: `node --test tests/*.test.mjs`, Node **24.22.1**; **32 testes, 32 aprovados, 0 falhas**, incluindo os nove de regressão. O stdout completo não foi guardado naquela execução: [executor-fix-tests.json](executor-fix-tests.json) regista explicitamente o resumo observado na saída da ferramenta, sem inventar TAP. Os logs brutos de subprocessos foram recuperados de TEMP e preservados por caso com o manifesto correspondente. O antigo [unit-tests.txt](unit-tests.txt) contém **23** testes da fase anterior e não foi reescrito para aparentar 32.

## Resultados anteriores preservados

As 12 reaberturas físicas de perfis e os inventários de cookies/LS/SS/IndexedDB/Cache Storage/SW/rede são evidência da versão anterior, descrita no [relatório de navegadores](RELATORIO-NAVEGADORES-ANTERIOR.md). Os resultados brutos, horários, versões, falhas iniciais e diagnósticos não foram alterados. Não se usou storageState para substituir reabertura real.

No [WebKit HTTPS, S13](webkit-https.json), Secure foi verificado, mas a implementação Windows reporta SameSite=None também no controlo independente escrito com Lax. **Não se declara aprovação de SameSite nem de Safari.** O caso UNVERIFIED dos novos testes é uma simulação de regressão da classificação; não resolve nem volta a medir esta limitação de navegador.

## Relatórios, reprodução e entrega

- [Pendências por âmbito](PENDENCIAS.md): local, informações do responsável e verificação após publicação.
- [Segurança/dependências/segredos](SEGURANCA.md), [HTTPS local](HTTPS.md), [matriz legal](MATRIZ-LEGAL.md) e [relatórios iniciais completos](../production-2026-10-29/02-relatorio-final.md): permanecem válidos no alcance e nas versões expressamente indicados, sem atribuição retroativa de novos testes.
- [Reprodução](REPRODUZIR.md), [ficheiros/hashes de entrega](artefactos.json), [pacote atualizado](evidencias-locais.zip) e [SHA-256 do pacote](evidencias-locais.zip.sha256).
- Certificados públicos, domínio e Vercel continuam fora desta fase e não bloqueiam a conclusão local. Requisitos jurídicos e operacionais não confirmados continuam pendentes, sem dados empresariais inventados.
