# Reprodução da auditoria local

Executar na raiz do projeto. Não requer Vercel, domínio público, credenciais de e-mail ou Redis. Não criar `.env` com chaves reais para esta auditoria. A suite só aceita destinos de loopback e envia apenas `{}` inválido ao endpoint real. Nos unitários, os envios válidos são simulados.

## Pré-requisitos

Node 24.22.1 ou posterior corrigido da linha 24; dependências do lock (`npm.cmd ci --ignore-scripts`) e os motores correspondentes ao Playwright 1.58.0:

```powershell
node node_modules/playwright-core/cli.js install chromium firefox webkit
```

Usar uma sessão normal do utilizador que permita ao navegador aceder à encriptação do Windows. Na execução original, a sandbox de processos impediu o Chromium de cifrar cookies (`os_crypt_win.cc`, erro 0x2); não desativar a encriptação para contornar isso. Perfis dedicados novos em TEMP; nunca usar o perfil pessoal. O sistema de aprovação do ambiente pode pedir autorização de execução dos navegadores fora da sandbox.

## Servidores, em terminais separados

HTTP:

```powershell
node scripts/serve.mjs --host 127.0.0.1 --port 4173
```

HTTPS: OpenSSL instalado no PATH, ou a instalação do Git for Windows em `C:/Program Files/Git/mingw64/bin/openssl.exe`. Se a pasta já existir, passar outro `-OutputDirectory` e ajustar caminhos. Chave em TEMP, nunca no Git. Não instala confiança no sistema.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/create-local-tls.ps1
$env:TLS_KEY=Join-Path $env:TEMP 'dipanda-local-tls/localhost-key.pem'
$env:TLS_CERT=Join-Path $env:TEMP 'dipanda-local-tls/localhost-cert.pem'
node scripts/serve.mjs --host 127.0.0.1 --port 4443
```

No ambiente auditado, os servidores/testes usaram o executável oficial Node 24.22.1 portátil em `$env:TEMP/dipanda-node-runtime/node.exe`; o Node global 24.11.1 foi apenas o processo pai que guardou evidências, devido a restrição de escrita do Windows. Num ambiente normal com Node atualizado instalado, basta `node`.

## Executar

```powershell
# Opcional: se o Node atualizado não for o global:
# $env:AUDIT_NODE=Join-Path $env:TEMP 'dipanda-node-runtime/node.exe'
$env:AUDIT_DIAGNOSTICS='1'
node scripts/run-local-consent-audit.mjs
node scripts/capture-local-audit-evidence.mjs
node reports/local-audit-2026-10-29/scan-secrets.mjs
```

O último comando emite o resultado sem valores de possíveis segredos. `npm.cmd audit --json --ignore-scripts` atualiza a consulta de advisories; envolve rede para o registo npm, não publica código nem instala pacotes.

As variáveis `AUDIT_ENGINES=chromium,firefox,webkit` e `AUDIT_TARGETS=http://127.0.0.1:4173,https://127.0.0.1:4443` selecionam os testes. O runner escreve `runs.json`, um JSON/um log por motor/protocolo, e verifica que o código não mudou durante a execução. O script completo também pode ser executado isoladamente com `BROWSER_ENGINE`, `TEST_URL` e `DIPANDA_CONSENT_REPORT`; manter o `code-version.json` atualizado.

O HTTPS de navegador ignora apenas erros do certificado autoassinado no contexto dedicado. O teste `check-local-https.mjs` valida a cadeia com o próprio certificado explícito, sem `rejectUnauthorized=false`. Sem importar a CA, a ligação tem de falhar por certificado autoassinado.

## Reabertura verdadeira

S12, duas vezes por motor/protocolo: criar perfil → escolher pela interface → guardar cookie de controlo independente → fechar o contexto/navegador e aguardar a saída → iniciar outro navegador com o mesmo diretório → visitar outra página → comparar escolha original e cookie de controlo. Não há uso de `storageState` no script atual. Os diretórios constam de `scenarios[].profile`. Não são cookies do site nem dados pessoais reais: são controlos apenas de teste.

`scripts/diagnose-browser-profile.mjs` é o diagnóstico mínimo independente, com controlos adicionais por JavaScript/protocolo e localStorage. `PROFILE_DEBUG=1` com `DEBUG=pw:browser` permite observar erros do serviço de encriptação e a saída normal dos processos Chromium.

## Conferir a versão

```powershell
node scripts/audit-code-version.mjs
```

Comparar `snapshot` com `code-version.json`. Inclui hashes dos bytes dos ficheiros da aplicação, recursos, configuração e testes; relatórios estão excluídos para evitar dependência circular. Os relatórios históricos não têm automaticamente esta versão: consultar a proveniência indicada em `RELATORIO.md`.
