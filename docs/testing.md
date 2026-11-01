# Testes e auditorias reproduzíveis

## Testes sem serviços externos

`npm test` executa os testes unitários e de integração. Usam dados sintéticos, serviços de envio injetados e servidores de loopback. Não leem `.env`, não autenticam em SMTP e não enviam e-mails reais. Playwright é dependência de desenvolvimento com versão fixada no lockfile.

As verificações cobrem consentimento, cookies, navegação, estrutura de páginas, estados de erro, origem e conteúdo do formulário, limites, SMTP, headers, publicação de recursos e proteção de ficheiros privados. Os cenários do antigo gate de publicação e do bloco “Uma entrega clara” foram substituídos pelos contratos atuais, sem apagar a evidência histórica que descrevia as versões anteriores.

## Navegadores e servidor seguro de auditoria

Instalar os navegadores uma vez com `node node_modules/playwright-core/cli.js install chromium firefox webkit`. Os testes também aceitam `BROWSER_EXECUTABLE` quando apropriado. Um navegador ou cenário não executado não é considerado aprovado.

Usar o fixture, e não o servidor normal com SMTP configurado:

```sh
node tests/fixtures/server.mjs --port 4175
```

O fixture liga apenas em loopback, não carrega `.env`, injeta envio simulado e emite `x-dipanda-audit-fixture: 1`. As ferramentas recusam um servidor sem esse indicador. O servidor normal pode continuar na porta 4173.

No PowerShell, numa segunda consola:

```powershell
$env:TEST_URL = 'http://127.0.0.1:4175'
$env:AUDIT_ENGINES = 'chromium,firefox,webkit'
$env:AUDIT_TARGETS = 'http://127.0.0.1:4175'
npm.cmd run audit:consent
npm.cmd run test:e2e
```

Para HTTPS local, `scripts/audit/create-local-tls.ps1` cria um certificado temporário de desenvolvimento usando OpenSSL, sem instalar confiança no sistema. Iniciar outro fixture com `--port 4445 --key <caminho> --cert <caminho>` e acrescentar `https://127.0.0.1:4445` a `AUDIT_TARGETS`. As exceções de certificado ficam limitadas aos contextos de teste local. Não são prova de TLS público.

## Evidência e resultados

Cada execução usa uma pasta nova em TEMP, ou uma pasta explicitamente escolhida em `AUDIT_OUTPUT_DIR`. Os ficheiros são criados sem sobrescrever resultados anteriores. As ferramentas recusam o arquivo histórico como destino. `audit:snapshot` regista commit de base, branch e hashes dos ficheiros efetivamente testados, incluindo alterações por fazer commit. Um commit de base isolado não identifica uma árvore de trabalho modificada.

Os relatórios distinguem `PASS`, `FAIL`, `UNVERIFIED`, `NOT_APPLICABLE` e erros de execução. Os testes das ferramentas verificam que um crash, relatório inválido ou resultado antigo não seja promovido a aprovação.

A preferência de animação é exercitada através das funções exportadas de `motion.js`, como teste técnico da persistência. O botão removido pelo utilizador não foi reposto nem apresentado como interação de interface existente.

Playwright WebKit em Windows não equivale ao Safari num iPhone. As limitações históricas de persistência/SameSite permanecem `UNVERIFIED` na evidência original. Um resultado novo pertence ao seu próprio runtime, navegador, origem e snapshot.

Os testes de regressão visual executados em dimensões móveis são simulações. Não substituem um dispositivo físico nem validação na Vercel em produção.
