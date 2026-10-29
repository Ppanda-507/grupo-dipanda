import fs from 'node:fs/promises';
import path from 'node:path';
const directory = 'reports/local-audit-2026-10-29';
// This generator reproduces the historical browser report, not the newer runner phase.
const version = JSON.parse(await fs.readFile(path.join(directory, 'code-version.browser-tested.json'), 'utf8'));
const reports = [];
for (const protocol of ['http', 'https']) for (const engine of ['chromium', 'firefox', 'webkit']) {
  const label = `${engine}-${protocol}`;
  const report = JSON.parse(await fs.readFile(path.join(directory, label + '.json'), 'utf8'));
  if (report.version.snapshot !== version.snapshot || report.summary.failed) throw new Error('Version mismatch or failed run: ' + label);
  reports.push({ label, ...report });
}
const totals = reports.reduce((total, r) => {
  for (const key of ['scenarios', 'passed', 'failed', 'unverified', 'notApplicable', 'snapshots', 'requests']) total[key] = (total[key] || 0) + r.summary[key];
  return total;
}, {});
const state = value => ({ PASS: 'Verificado', FAIL: 'Falha', UNVERIFIED: 'Inconclusivo', NOT_APPLICABLE: 'Não aplicável' })[value] || 'Pendente';
const descriptions = {
  'S01-before-choice': ['Antes de escolher', 'Nenhuma autorização por scroll, cliques ou fecho do diálogo', 'Zero cookies e outros armazenamentos da aplicação em 19 rotas; scroll e espera de oito segundos sem ativação.'],
  'S02-reject': ['Rejeitar', 'Só guardar escolha necessária', 'functional=false; preferências não criadas após interações tardias, reload, navegação, histórico ou nova aba.'],
  'S03-accept-all': ['Aceitar todos', 'Ativar apenas o opcional existente', 'Dois cookies, sem outros mecanismos; preferência de animação reposta; autorização original não renovada.'],
  'S04-custom-essential-only': ['Personalizar: só necessários', 'Sem seleção prévia nem opcional', 'Grava recusa; persiste nas navegações e reaberturas do contexto.'],
  'S05-custom-functional': ['Personalizar: funcional', 'Ativar só a categoria selecionada', 'Única categoria opcional ativada. Não há categorias fictícias de publicidade/analytics.'],
  'S06-withdraw': ['Retirar consentimento', 'Eliminar opcional e impedir novas escritas', 'Cookie funcional removido e não recriado; recusa persiste.'],
  'S07-other-tab-revocation': ['Retirada noutra aba', 'Aba antiga respeita nova escolha', 'Evento tardio não recria preferência e diálogo reflete recusa.'],
  'S08-expiry-open-tab': ['Autorização expirada na aba', 'Não usar autorização antiga', 'Fixture expirada bloqueada; preferência retirada e banner regressa.'],
  'S09-expiry-timer-and-ttl': ['Expiração sem interação / TTL', 'Opcional não ultrapassa autorização', 'Timer reabre banner; cookie expirado inacessível ao JS e ausente do pedido seguinte. Inventário bruto Firefox preserva entradas expiradas.'],
  'S10-selective-cleanup': ['Limpeza seletiva', 'Não apagar cache/armazenamento alheios', 'Sentinelas não pessoais em LS/SS/IDB/Cache Storage preservadas; opcional eliminado.'],
  'S11-contact-private-cache': ['Formulário / cache', 'Resposta sem cache nem dados pessoais persistidos', 'Pedido inválido fictício rejeitado com no-store; sem e-mail nem armazenamento da resposta.'],
  'S12-reopen-browser-reject': ['Fechar e reabrir: recusa', 'Mesmo perfil conserva escolha', 'Fecho real e novo processo com o mesmo diretório; controlo independente e recusa original preservados.'],
  'S12-reopen-browser-accept': ['Fechar e reabrir: aceitação', 'Mesmo perfil conserva escolha e preferência', 'Fecho real e novo processo; cookie de controlo, aceitação original e preferência preservados. Sem storageState.'],
  'S13-https-cookie-attributes': ['Cookies sobre HTTPS real', 'Secure e SameSite=Lax', 'Secure nos três motores; Lax confirmado Chromium/Firefox. WebKit Windows reporta None, inclusive no controlo independente Lax: limitação não resolvida. HTTP: não aplicável.'],
  'S14-network-and-write-audit': ['Rede / integrações tardias', 'Nenhuma escrita não autorizada/terceiro', 'Rede de todos os cenários e operações instrumentadas sem pedido a terceiros ou escrita funcional não autorizada.'],
};
const scenarioRows = Object.entries(descriptions).map(([id, [name, expected, observed]]) => {
  const rows = reports.map(r => r.scenarios.find(s => s.id === id));
  const status = rows.some(s => s.status === 'UNVERIFIED') ? 'Inconclusivo no controlo indicado' : 'Verificado';
  return `| ${name} | ${expected} | ${observed} | ${id}; seis JSON por motor/protocolo | ${status} |`;
});
const runRows = reports.map(r => `| ${r.engine} ${r.browserVersion} / ${new URL(r.origin).protocol} | ${r.summary.passed} | ${r.summary.unverified} | ${r.summary.notApplicable} | ${r.summary.failed} | [${r.label}.json](${r.label}.json) |`);
const text = `# Conclusão da auditoria local — Dipanda

**Concluída a verificação local dos controlos descritos, com limites explícitos.** ${totals.scenarios} execuções de cenários: **${totals.passed} verificadas, ${totals.failed} falhas, ${totals.unverified} inconclusiva e ${totals.notApplicable} não aplicáveis**; ${totals.snapshots} snapshots e ${totals.requests} pedidos de página inventariados. Os dois antigos inconclusivos de fechar/reabrir estão resolvidos: **12 reaberturas reais verificadas** (2 escolhas × 3 motores × HTTP/HTTPS), sem restauração de storageState.

Fica inconclusivo apenas o atributo SameSite na implementação WebKit/Windows. Isso não é aprovação de Safari. Não há publicação, deployment, alteração de Vercel/DNS nem envio real de mensagens. Certificados públicos, domínio e cache de plataforma foram excluídos pelo utilizador e **não bloqueiam esta conclusão local**. Esta conclusão não é uma certificação global de conformidade legal ou de segurança.

## Versão exata e ambiente

- Base Git: \`${version.baseCommit}\`, branch \`${version.branch}\`.
- **Código testado inclui alterações não commitadas. A base Git isoladamente não identifica a versão testada.** Snapshot SHA-256: **\`${version.snapshot}\`**. [Manifesto de todos os ficheiros/recursos/configurações/testes](code-version.json); cada JSON de navegador inclui o mesmo manifesto, horários e runtime.
- Servidores e executores de testes: Node **24.22.1** portátil oficial. O pai que grava evidências usa Node global 24.11.1 por restrição do Windows; não serve o site nem executa os testes. Ver metadados dos unitários/build/TLS. Reinício do HTTP após suporte TLS seguido de repetição dos testes HTTP; HTTPS já iniciado com a versão atual.
- Playwright **1.58.0**, Windows, motores efetivamente usados: **Chrome for Testing/Chromium 145.0.7632.6 (1208), Firefox 146.0.1 (1509) e WebKit 26.0 (2248/WinCairo)**. São os binários fixados por essa versão da ferramenta; não é uma alegação de testes nos browsers estáveis mais recentes. **Safari Apple/macOS/iOS não executado.** A documentação distingue [motores Playwright e browsers de marca](https://playwright.dev/docs/browsers).
- HTTP loopback 4173 e HTTPS loopback 4443 reais. HTTPS com certificado de desenvolvimento de sete dias; confiança do sistema não modificada. [Relatório HTTPS](HTTPS.md), [transporte observado](https-transport.json).
- Só Dipanda; casaspanda excluído. Dados fictícios e perfis novos dedicados em TEMP. A rede observada é a dos contextos de página, não todo o tráfego do sistema operativo/browser de fundo.

## Resultados por motor e transporte

| Motor / transporte | Verificado | Inconclusivo | Não aplicável | Falhas | Evidência |
|---|---:|---:|---:|---:|---|
${runRows.join('\n')}

“Não aplicável” nos três runs HTTP corresponde ao controlo específico de cookies sobre HTTPS, executado separadamente no servidor TLS real. As limitações de CDP fora do Chromium constam de cada JSON: headers e Resource Timing não provam por si sós a origem de cada reutilização de cache de disco.

## Tabela de cenários

| Cenário | Esperado | Observado | Evidência | Estado |
|---|---|---|---|---|
${scenarioRows.join('\n')}

Inventários completos em snapshots (cookies brutos com flags/TTL, documentCookieNames, LS/SS, IndexedDB/object stores/contagens, Cache Storage/entradas e service workers), storageOperations, network (inclui nomes dos cookies efetivamente enviados), httpCache e Resource Timing. Controlos fictícios de S10/S12 são identificados, não atribuídos à aplicação.

## Fechar e reabrir: causa e resolução

A primeira execução na sandbox reproduziu a perda do cookie do site e de controlos independentes, mantendo localStorage. O diagnóstico registou \`os_crypt_win.cc:77 Failed to encrypt ... (0x2)\`, com saída normal dos processos. [JSON restrito](profile-diagnostic-restricted.json), [log restrito](profile-diagnostic-restricted.txt) e [suite restrita preservada](chromium-http-restricted.json).

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
`;
await fs.writeFile(path.join(directory, 'RELATORIO-NAVEGADORES-ANTERIOR.md'), '> Registo histórico anterior à correção do executor; SameSite WebKit/Windows continua inconclusivo.\n\n' + text.replaceAll('(code-version.json)', '(code-version.browser-tested.json)'));
await fs.writeFile(path.join(directory, 'browser-totals.json'), JSON.stringify({ snapshot: version.snapshot, ...totals }, null, 2));
await fs.writeFile(path.join(directory, 'browser-runs.json'), JSON.stringify(reports.map(r => ({ label: r.label, origin: r.origin, engine: r.engine, browserVersion: r.browserVersion, startedAt: r.startedAt, finishedAt: r.finishedAt, summary: r.summary, snapshot: r.version.snapshot })), null, 2));
console.log(JSON.stringify(totals));
