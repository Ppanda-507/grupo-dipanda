# Validação da refatoração

Data de conclusão das verificações: 1 de novembro de 2026. Branch `refactor/estrutura-dipanda`, baseada no commit `ee6eed3d4517646ff2e0dd82afd74d496d140938`. As alterações ainda não foram submetidas num novo commit nem publicadas.

Snapshot efetivamente testado: `bd12ba17087e95f4497088440a93ff98dc1b54184969472c59f6107c7b34458d` (309 ficheiros, incluindo alterações da árvore de trabalho). Este relatório gerado está excluído do hash para evitar autorreferência. Runtime dos testes: Node.js 24.22.1, Windows. Os dados do contacto são sintéticos e os servidores de auditoria usam transporte simulado.

## Resultados funcionais e artefactos

| Verificação | Resultado |
| --- | --- |
| Testes unitários e de integração | 72 aprovados, zero falhas ou omissões |
| Build de produção | Aprovado: 23 páginas, 92 recursos alcançáveis e 122 ficheiros finais |
| Preservação do HTML | As 23 páginas mantêm exatamente o hash do HTML anterior, com o mesmo ambiente público |
| Preservação dos recursos | Os 96 recursos retidos mantêm os bytes anteriores; incluem quatro licenças |
| Auditorias históricas | 138 ficheiros copiados integralmente; zero hashes alterados |
| Fronteiras HTTP | `.env`, servidor, scripts, configuração e testes não são servidos; caminhos desviados e junctions são testados |
| Entrada Vercel | Importa os módulos privados e responde a métodos inválidos/contacto desativado sem enviar mensagens |
| CSP e headers | Mantidos; o teste verifica igualdade entre servidor e configuração Vercel |
| Revisão no navegador | 106 verificações aprovadas: rotas, estados HTTP, headers, navegação, cookies e dimensões móveis |
| Transporte HTTPS local | Sete verificações aprovadas: TLS 1.2/1.3, rejeição de versões antigas, confiança explicitamente local, contacto sintético e cache |
| Preview local após a migração | As 23 páginas e os 96 recursos responderam com os hashes esperados; zero divergências |
| Dependências | `npm audit` devolveu zero avisos de vulnerabilidade nesta execução; resultado válido para a data e versões registadas |
| Segredo SMTP atual | Zero ocorrências em código, testes, documentação e artefactos; `.env` e `dist/` confirmados como ignorados pelo Git |

O build copia uma lista positiva de recursos, não toda a pasta `public/`. Os dois documentos editoriais saíram do artefacto; nenhuma imagem operacional, estilo, módulo do navegador ou licença foi removido. Não foram alterados os slugs, o design ou a lógica de consentimento.

O servidor de preview de produção foi iniciado e verificado com o `Host` canónico de `SITE_URL`: páginas 200, CSS público com cache, ficheiros privados 404 e método GET do contacto 405. Conserva a verificação de Host existente; com um domínio real configurado, o acesso direto pelo Host de localhost pode receber 421. Para navegação de desenvolvimento, permanece disponível `npm run dev`.

## Cookies e consentimento

Primeira matriz, dentro do isolamento:

| Navegador/origem | Resultado |
| --- | --- |
| Chromium / HTTP | 12 PASS, 2 UNVERIFIED, 1 NOT_APPLICABLE |
| Chromium / HTTPS local | 13 PASS, 2 UNVERIFIED |
| WebKit / HTTP | 14 PASS, 1 NOT_APPLICABLE |
| WebKit / HTTPS local | 14 PASS, 1 UNVERIFIED |
| Firefox / HTTP e HTTPS local | ERROR de execução: falha ao criar separadores; timeout e relatório em falta preservados |

Os dois cenários UNVERIFIED de Chromium referem-se à persistência após fechar/reabrir um perfil automatizado, com perda também do cookie de controlo independente. O cenário de atributos SameSite em WebKit/Windows permanece UNVERIFIED; não é apresentado como prova sobre Safari/iPhone.

Repetição completa fora do isolamento, sobre o mesmo snapshot, concluída entre 08:09 e 08:22 UTC:

| Navegador/origem | Resultado |
| --- | --- |
| Chromium / HTTP | 14 PASS, 1 NOT_APPLICABLE |
| Firefox / HTTP | 14 PASS, 1 NOT_APPLICABLE |
| WebKit / HTTP | 14 PASS, 1 NOT_APPLICABLE |
| Chromium / HTTPS local | 15 PASS |
| Firefox / HTTPS local | 15 PASS |
| WebKit / HTTPS local | 14 PASS, 1 UNVERIFIED |

Total: 90 cenários, 86 PASS, zero FAIL, um UNVERIFIED e três NOT_APPLICABLE. Os seis processos terminaram com código zero, sem timeout ou relatório em falta. A persistência dos perfis de Chromium passou nesta execução; Firefox completou ambas as origens. A primeira tentativa permanece preservada com os seus próprios ERROR e UNVERIFIED.

O único cenário por confirmar é `S13-https-cookie-attributes` no WebKit 26.0 para Windows: Secure foi verificado sobre TLS local, mas a ferramenta reporta SameSite como `None`. Este resultado exige validação independente e não é classificado como PASS nem como prova sobre Safari/iPhone.

## Evidência reproduzível

Os comandos e os pressupostos estão em [testing.md](../testing.md). Pastas desta execução:

- Captura de testes, build e transporte TLS: `dipanda-refactor-capture-39836b7b982d431d85836b4037768059`, em TEMP.
- Navegador e 106 verificações: `dipanda-refactor-browser-b9037bda9c8041259c664b882ae29a8d`, em TEMP.
- Matriz dentro do isolamento: `dipanda-refactor-consent-54b99fbb3b6e46fb93c6e5f042deb583`, em TEMP.
- Matriz fora do isolamento: `dipanda-refactor-consent-unrestricted-c2c592d235f641e88b98364366e02959`, em TEMP.

Foi guardada uma cópia local duradoura dos 36 ficheiros de evidência em `reports/refactor-2026-11-01/`, organizada em `capture/`, `browser/`, `consent-restricted/` e `consent-unrestricted/`. Inclui os resultados de dependências e preview. O [manifesto SHA-256](../../reports/refactor-2026-11-01/evidence-manifest.json) regista os hashes e totais; as cópias foram comparadas byte a byte. Esta pasta está ignorada pelo Git e excluída da publicação. Não contém chaves TLS nem perfis de navegador.

O executor guarda stdout/stderr, códigos de saída, cenários não verificados, reports inválidos e identidade do código. Os relatórios sintéticos usados para testar falhas do executor não são resultados de navegador. A evidência histórica está separada em `docs/audits/history/evidence/`, com manifesto SHA-256 próprio.

## Limites e pendências

- Não foi feito deploy, merge ou push. Vercel, domínio, DNS e HTTPS público não foram validados nesta tarefa.
- Não foram enviados e-mails reais durante esta refatoração. A configuração privada existente foi preservada; o SMTP é coberto por transporte simulado.
- As dimensões móveis são emulação, não teste num telefone físico.
- A apresentação de SameSite em WebKit/Windows permanece UNVERIFIED. A persistência de perfis passou na repetição fora do isolamento; a tentativa inicial continua registada separadamente.
- O limite básico de pedidos continua por instância; Upstash partilhado é opcional. Não foi alterado esse contrato.
- O conteúdo legal em minuta foi preservado, sem representar revisão jurídica concluída nem reintroduzir o bloqueio de publicação removido.

Não se apresenta esta reorganização como uma garantia completa de segurança ou como validação de produção.
