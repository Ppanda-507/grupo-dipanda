# Complemento local: páginas de erro e apresentação

Data: 2026-10-31. Este documento complementa os relatórios anteriores, sem alterar os seus resultados ou manifestos históricos.

Versão: branch `main`, base `c48353bf749475f4ff207588a95a37eb4bb502d3`, **incluindo alterações sem commit**. Snapshot SHA-256 `03d2caa2223a14dc5aa84ece6ecd1b78bc2e04a32bb48240d80742fe2fb2aead`, ficheiros e hashes no [manifesto](code-version.json).

## Lacuna encontrada e correção

A página `/404` e o artefacto `404.html` já existiam. A existência de uma página não demonstrava a validação completa dos erros: faltavam páginas 500/503 e a captura geral do servidor local devolvia 400 para erros internos. O relatório anterior não deve ser interpretado como validação destes casos.

O servidor distingue agora URL inválido (400), recurso inexistente (404) e falha interna (500). `/503` apresenta o estado de indisponibilidade com código 503; a sua existência não significa que o alojamento a utilize automaticamente. APIs mantêm respostas JSON. Os erros não expõem stack traces, têm `Cache-Control: no-store` e as páginas HTML têm `noindex`. Se o próprio template falhar, existe HTML mínimo independente.

O build inclui `404.html`, `500.html` e `503.html`, além das rotas correspondentes. Pedidos HEAD conservam o código e não devolvem corpo. A alteração mantém a validação de host, proteção de caminhos, CSP e restantes cabeçalhos existentes.

## Resultados posteriores à correção

| Controlo | Estado | Evidência |
| --- | --- | --- |
| Página e recurso inexistentes, incluindo HEAD | Verificado localmente | [Testes](tests.txt), [HTTP real](http.json) |
| Exceção interna simulada e falha do template | Verificado localmente | [Testes](tests.txt): HTTP 500 sem detalhes internos |
| Página 503 e noindex | Verificado localmente | [HTTP](http.json), [testes](tests.txt) |
| URL malformado e byte nulo | Verificado localmente | HTTP 400, [HTTP](http.json) |
| Falha inesperada de API | Verificado em teste, sem mensagem real | JSON 500, no-store, [testes](tests.txt) |
| Build | Verificado | [Build](build.txt): 23 páginas e 82 recursos |
| Apresentação e interação em larguras 1440/390 | Verificado em navegador emulado | [Registo](browser-suite.txt); não representa teste em telefone físico |
| Fundo branco de Desenvolvimento web e rodapé “Serviços” | Verificado no navegador | [Estilos computados](browser.json) |
| Acionamento das páginas de erro pela Vercel | Pendente de ambiente publicado | Nenhum deployment criado ou alterado |
| Erros de infraestrutura, DNS e TLS público | Fora do âmbito local | Não foram testados nesta correção |
| Páginas de autenticação 401 | Não aplicável atualmente | O site não tem login nem área privada |

Os testes finais focados totalizam **7 aprovados** (`error-pages` e `contact-navigation`), já com a validação de byte nulo. Foram também executados anteriormente 16 testes de estrutura/navegação/erros durante esta alteração; não são adicionados aos 7 como se fossem casos novos. A suite de navegador passou nas 23 páginas em duas larguras.

Reprodução: `node --test tests/error-pages.test.mjs tests/contact-navigation.test.mjs`; com o servidor local ligado, `node scripts/check-ui-refinements.mjs`. Usar o runtime corrigido indicado no ambiente; ver versão exata no manifesto e nos resultados.

Não houve publicação, alteração de serviços de produção ou envio real pelo formulário. As verificações históricas de cookies e a limitação SameSite do WebKit/Windows não foram repetidas nem reclassificadas.
