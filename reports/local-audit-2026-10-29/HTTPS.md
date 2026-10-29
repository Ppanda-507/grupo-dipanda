# HTTPS, cabeçalhos e cache — apenas local

Âmbito confirmado pelo utilizador: não existe publicação. Não foi procurado/criado deployment, alterado DNS, nem consultada uma conta Vercel. Domínio, certificados públicos, renovação e configuração da plataforma estão **fora do âmbito**; não bloqueiam a conclusão desta fase local.

Servidor real: `https://127.0.0.1:4443`, Node 24.22.1, `scripts/serve.mjs` com TLS nativo. Certificado autoassinado RSA-2048/SHA-256 de 7 dias, SAN localhost/127.0.0.1/::1, gerado pelo OpenSSL instalado no Git for Windows. Chave em TEMP, não incluída no projeto. Não foi instalado certificado raiz nem alterada a confiança do sistema.

| Controlo | Estado | Evidência |
|---|---|---|
| TLS real, sem mirror/route.fulfill | Verificado | [https-transport.json](https-transport.json): socket TLS, protocolo, cifra, cadeia validada com CA explícita, fingerprint/validade/SAN. |
| TLS 1.2 / 1.3 | Verificado | Ambos negociados com validação de certificado ativa. |
| TLS 1.0 / 1.1 | Verificado | Handshake recusado. Mensagens reais no JSON, sem usar desativação global de TLS. |
| Confiança pública | Não aplicável | Certificado de desenvolvimento deliberadamente autoassinado; sem CA explícita o cliente Node recusa. Não é um certificado público. |
| Cookies Secure/SameSite | Verificado / inconclusivo por motor | `*-https.json`, S13: Secure em todos os cookies atuais; Lax confirmado onde a API o reporta corretamente. WebKit/Windows reporta None também no controlo independente com Lax: não concluir comportamento Safari nem garantia SameSite a partir do código. |
| HttpOnly | Não aplicável aos cookies atuais | Escolha/preferência são lidas pelo JavaScript e não autenticam nem dão acesso a contas. Não há cookie de sessão. |
| Cabeçalhos | Verificado localmente | CSP, nosniff, DENY, Referrer-Policy e Permissions-Policy em respostas HTTPS reais; endpoint sem Set-Cookie. |
| Respostas do formulário | Verificado localmente | POST `{}` inválido → 400 ou 429, `Cache-Control: no-store`; nenhum envio real. Unitários cobrem também sucesso/falhas simuladas com no-store e sem reflexão dos dados fictícios. |
| Cache HTTP pública | Verificado com limite | HTML SSR é público e não recebe dados do formulário; assets de desenvolvimento com no-store. CDP Chromium observa reutilização de cache HTTP; outros motores fornecem headers/Resource Timing. Não é inventário completo de cache de disco nem teste de CDN partilhada. |
| Cache Storage / SW / IndexedDB | Verificado localmente | Inventário por cenário nos JSON; aplicação não os utiliza. Sentinelas fictícias S10 provam que retirar consentimento não apaga armazenamento não relacionado. |
| Conteúdo misto / terceiros | Verificado nas navegações testadas | Rede completa nos JSON por motor/protocolo: verificar S14 e `network`; sem recursos HTTP/terceiros carregados na suite HTTPS. Sem trackers/iframes de terceiros configurados. |
| HSTS / redirects de produção / CDN Vercel | Não aplicável a esta fase | Não foram ativados HSTS, preload ou redirects globais em localhost. HTTP e HTTPS são servidores locais separados. Plataforma e domínio não existem no âmbito testado. |
| Certificado público, revogação, DNS, renovação, cache da plataforma | Não aplicável a esta fase | Excluídos expressamente pelo utilizador; não são cenários “passados” nem motivo para bloquear o fecho da auditoria local. |

Os contextos dedicados Playwright usam `ignoreHTTPSErrors` para o certificado local. Isso permite testar comportamento de páginas sobre TLS, mas não prova a confiança do certificado. Esta última é verificada independentemente por `scripts/check-local-https.mjs`, sem desligar `rejectUnauthorized`.

Configuração futura de infraestrutura permanece em [deploy/VERCEL.md](../../deploy/VERCEL.md), para uma tarefa posterior. O documento não descreve alterações executadas nesta fase.
