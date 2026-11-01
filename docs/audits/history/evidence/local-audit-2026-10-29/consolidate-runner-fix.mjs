// Consolidate existing evidence only. Never launches a test, browser or deployment.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { codeVersion } from '../../scripts/audit-code-version.mjs';

const directory = 'reports/local-audit-2026-10-29';
const browserManifest = path.join(directory, 'code-version.browser-tested.json');
try { await fs.access(browserManifest); }
catch { await fs.copyFile(path.join(directory, 'code-version.json'), browserManifest); }
const browser = JSON.parse(await fs.readFile(browserManifest, 'utf8'));
const current = await codeVersion();
const candidates = [];
for (const name of await fs.readdir(os.tmpdir())) {
  if (!name.startsWith('dipanda-runner-regression-')) continue;
  const source = path.join(os.tmpdir(), name);
  try {
    const [run] = JSON.parse(await fs.readFile(path.join(source, 'runs.json'), 'utf8'));
    const manifest = JSON.parse(await fs.readFile(path.join(source, 'code-version.json'), 'utf8'));
    const fixture = await fs.readFile(path.join(source, 'fixture.mjs'), 'utf8');
    if (manifest.snapshot !== current.snapshot || !fixture.includes('Synthetic diagnostic stderr')) continue;
    const log = await fs.readFile(path.join(source, 'webkit-https.txt'), 'utf8');
    const mode = log.match(/Synthetic subprocess output: ([\w-]+)/)?.[1] || (run.exit === -4058 ? 'spawn-error' : null);
    if (mode) candidates.push({ source, mode, run, manifest });
  } catch { /* Unfinished or unrelated temporary runs are not evidence. */ }
}
const expected = ['crash', 'missing', 'malformed', 'invalid', 'fail', 'valid-but-crash', 'spawn-error', 'unverified', 'pass'];
const evidence = [];
for (const mode of expected) {
  const found = candidates.filter(c => c.mode === mode).sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt))[0];
  if (!found) throw new Error('Missing existing regression evidence: ' + mode);
  const destination = path.join(directory, 'runner-regression', mode);
  await fs.mkdir(destination, { recursive: true });
  for (const file of await fs.readdir(found.source)) {
    if (!/^(?:runs\.json|fixture\.mjs|code-version\.json|webkit-https(?:\.previous-[\w-]+)?\.(?:json|txt))$/.test(file)) continue;
    await fs.copyFile(path.join(found.source, file), path.join(destination, file));
  }
  evidence.push({ mode, source: found.source, evidence: path.relative(directory, destination).replaceAll('\\', '/'), startedAt: found.run.startedAt, finishedAt: found.run.finishedAt, recordedStatus: found.run.status, childExit: found.run.exit, snapshot: found.manifest.snapshot });
}
const latestPass = candidates.filter(c => c.mode === 'pass').sort((a, b) => b.run.startedAt.localeCompare(a.run.startedAt))[0];
await fs.writeFile(path.join(directory, 'code-version.runner-tested.json'), JSON.stringify(latestPass.manifest, null, 2));
await fs.writeFile(path.join(directory, 'code-version.json'), JSON.stringify(current, null, 2));
const previous = new Map(browser.files.map(file => [file.file, file.sha256]));
const changedFiles = current.files.filter(file => previous.get(file.file) !== file.sha256).map(file => file.file);
const result = {
  date: '2026-10-29', phase: 'Executor correction; prior approved tests, not rerun during consolidation',
  command: 'node --test tests/*.test.mjs', runtime: 'v24.22.1',
  summary: { tests: 32, passed: 32, failed: 0, cancelled: 0, skipped: 0, todo: 0 },
  provenance: '32-test result and parent exit 0 were observed in the previous task tool output (duration_ms 18517.2711). Full stdout was not saved then; this is an explicit summary, not reconstructed TAP. Nine subprocess fixture logs/reports are preserved separately. No tests were rerun to create this record.',
  runnerTestedSnapshot: current.snapshot, browserTestedSnapshot: browser.snapshot, changedFiles,
  browserResults: { scenarios: 90, passed: 86, failed: 0, unverified: 1, notApplicable: 3, status: 'Historical browser run; not rerun after executor correction' },
  knownLimitation: 'SameSite in WebKit/Windows remains UNVERIFIED; synthetic regression evidence is not a new browser measurement.',
  regressions: evidence,
};
await fs.writeFile(path.join(directory, 'executor-fix-tests.json'), JSON.stringify(result, null, 2));
const historicalReport = path.join(directory, 'RELATORIO-NAVEGADORES-ANTERIOR.md');
try { await fs.access(historicalReport); }
catch {
  const old = await fs.readFile(path.join(directory, 'RELATORIO.md'), 'utf8');
  await fs.writeFile(historicalReport, '> Registo histórico anterior à correção do executor. Não atribuir estes resultados à versão mais recente do executor. SameSite WebKit/Windows continua inconclusivo.\n\n' + old.replaceAll('(code-version.json)', '(code-version.browser-tested.json)'));
}
await fs.writeFile(path.join(directory, 'RELATORIO.md'), `# Consolidação da auditoria local — 29/10/2026

**Fase local consolidada.** A correção do executor e os **32 testes aprovados** pertencem à fase posterior aos testes de navegador. Não foram repetidos testes nesta consolidação. **SameSite no WebKit/Windows permanece inconclusivo (UNVERIFIED)**; Safari real não foi executado. Não houve deployment, push, alteração de serviços públicos ou envio real de mensagens.

## Versões e proveniência

| Fase | Versão dos ficheiros (SHA-256) | Evidência e alcance |
|---|---|---|
| Navegadores e HTTPS local, antes da correção do executor | \`${browser.snapshot}\` | [Manifesto anterior](code-version.browser-tested.json), [relatório histórico](RELATORIO-NAVEGADORES-ANTERIOR.md), runs.json/totals.json e os seis JSON de navegador: 90 cenários, 86 verificados, zero falhas de cenário, 1 inconclusivo, 3 não aplicáveis. Estes resultados não demonstravam a propagação de erros pelo executor. |
| Correção do executor, já testada na tarefa anterior | \`${current.snapshot}\` | [Manifesto preservado da execução](code-version.runner-tested.json), [32 aprovados e proveniência](executor-fix-tests.json), [nove casos/logs reais de subprocessos simulados](runner-regression/). Zero falhas nos 32 testes. Não é uma nova execução dos testes de navegador. |
| Consolidação documental atual | \`${current.snapshot}\` | [Manifesto atual](code-version.json), com base Git \`${current.baseCommit}\` na branch \`${current.branch}\`. Os bytes do código coincidem com os da execução dos 32 testes; só documentação/evidências foram consolidadas. Nenhum teste repetido. |

O snapshot é calculado sobre os bytes de aplicação, recursos, configuração e testes; não inclui relatórios, para evitar circularidade. O commit-base do manifesto é o ponto de recolha, não o identificador de um futuro commit que contenha este relatório. As únicas diferenças de código entre as duas fases são **scripts/run-local-consent-audit.mjs** e **tests/consent-audit-runner.test.mjs**; os ficheiros do site e as regras de consentimento não mudaram.

## Correção do executor e testes aprovados

[run-local-consent-audit.mjs](../../scripts/run-local-consent-audit.mjs) termina com código **1** perante falha/sinal/timeout do subprocesso, relatório ausente, JSON inválido, identidade/versão/contagens inconsistentes ou cenários FAIL. Aguarda close para recolher stdout/stderr; conserva JSON inválido sem o reescrever e arquiva relatórios/logs anteriores com sufixo previous. Em runs.json, erros de execução são ERROR, falhas de cenário são FAIL, e resultados inconclusivos continuam UNVERIFIED. Um UNVERIFIED válido não se transforma em PASS nem aumenta a contagem de aprovados.

Os [nove testes de regressão](../../tests/consent-audit-runner.test.mjs) executam o processo principal real com subprocessos simulados: falha sem relatório, saída zero sem relatório, JSON malformado, estrutura inválida, cenário FAIL mesmo com saída zero, relatório válido com saída 17, executável inexistente, UNVERIFIED e PASS. Confirmam o código do processo principal e a preservação dos logs/relatórios. Não usam navegador nem rede.

Comando já executado: \`node --test tests/*.test.mjs\`, Node **24.22.1**; **32 testes, 32 aprovados, 0 falhas**, incluindo os nove de regressão. O stdout completo não foi guardado naquela execução: [executor-fix-tests.json](executor-fix-tests.json) regista explicitamente o resumo observado na saída da ferramenta, sem inventar TAP. Os logs brutos de subprocessos foram recuperados de TEMP e preservados por caso com o manifesto correspondente. O antigo [unit-tests.txt](unit-tests.txt) contém **23** testes da fase anterior e não foi reescrito para aparentar 32.

## Resultados anteriores preservados

As 12 reaberturas físicas de perfis e os inventários de cookies/LS/SS/IndexedDB/Cache Storage/SW/rede são evidência da versão anterior, descrita no [relatório de navegadores](RELATORIO-NAVEGADORES-ANTERIOR.md). Os resultados brutos, horários, versões, falhas iniciais e diagnósticos não foram alterados. Não se usou storageState para substituir reabertura real.

No [WebKit HTTPS, S13](webkit-https.json), Secure foi verificado, mas a implementação Windows reporta SameSite=None também no controlo independente escrito com Lax. **Não se declara aprovação de SameSite nem de Safari.** O caso UNVERIFIED dos novos testes é uma simulação de regressão da classificação; não resolve nem volta a medir esta limitação de navegador.

## Relatórios, reprodução e entrega

- [Pendências por âmbito](PENDENCIAS.md): local, informações do responsável e verificação após publicação.
- [Segurança/dependências/segredos](SEGURANCA.md), [HTTPS local](HTTPS.md), [matriz legal](MATRIZ-LEGAL.md) e [relatórios iniciais completos](../production-2026-10-29/02-relatorio-final.md): permanecem válidos no alcance e nas versões expressamente indicados, sem atribuição retroativa de novos testes.
- [Reprodução](REPRODUZIR.md), [ficheiros/hashes de entrega](artefactos.json), [pacote atualizado](evidencias-locais.zip) e [SHA-256 do pacote](evidencias-locais.zip.sha256).
- Certificados públicos, domínio e Vercel continuam fora desta fase e não bloqueiam a conclusão local. Requisitos jurídicos e operacionais não confirmados continuam pendentes, sem dados empresariais inventados.
`);
console.log(JSON.stringify({ currentSnapshot: current.snapshot, browserSnapshot: browser.snapshot, changedFiles, copiedRegressionCases: evidence.length, testsRerun: false }, null, 2));
