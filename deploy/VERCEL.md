# Preparação para Vercel — não publicada

Estas instruções preparam a publicação futura. Nenhum projeto Vercel, DNS, fornecedor ou serviço de produção foi criado/alterado nesta auditoria.

## 1. Resolver primeiro a identificação e os contratos

Paulo Panda foi indicado como responsável. Falta confirmar país de estabelecimento, endereço profissional e identificação fiscal; não substituir estes dados por uma sociedade inexistente. Confirmar com contabilista/jurista o enquadramento da atividade individual ou a constituição de sociedade, a informação exigida para consumidores, RAL e Livro de Reclamações.

Confirmar o domínio final. Não usar `example.com`. Aprovar os textos de conservação e de destinatários/transferências com base na operação real, incluindo caixas de correio e cópias de segurança. As variáveis `LEGAL_*` são texto simples e são escapadas no HTML; não colocar HTML nem segredos nelas.

## 2. Selecionar o plano e preparar um preview protegido

O site promove serviços comerciais, mesmo sem checkout. O plano Hobby da Vercel restringe-se a uso pessoal não comercial; selecionar um plano compatível e verificar o DPA aplicável antes de contratar. Fontes: [Hobby](https://vercel.com/docs/plans/hobby), [fair use](https://vercel.com/docs/limits/fair-use-guidelines), [DPA](https://vercel.com/legal/dpa).

Quando autorizado a publicar: importar o repositório na Vercel com **Root Directory na raiz Dipanda**, nunca `casaspanda`. Framework: Other; Node.js 24.x. A configuração local `vercel.json` define build `node scripts/build.mjs`, saída `dist`, instalação `npm ci --ignore-scripts --omit=dev`, cabeçalhos e a função `api/contact.js`. Não usar apenas um servidor estático externo: o formulário precisa da função. A `.vercelignore` exclui `casaspanda`, `.env`, relatórios e pastas de ferramentas.

Manter previews protegidos por autenticação Vercel; não atribuir o domínio público a um preview com minutas legais. Não fornecer chaves reais Resend/Upstash a previews ou branches de contribuidores. A API recusa envios quando `VERCEL_ENV` não é `production`.

## 3. Configurar variáveis, sem as incluir no Git

| Variável | Ação antes de produção |
|---|---|
| `SITE_URL` | Origem HTTPS canónica exata, por exemplo domínio real sem caminho; ligar o domínio secundário por redirecionamento na Vercel. |
| `LEGAL_CONTROLLER_NAME` | Nome/denominação real: Paulo Panda foi indicado; confirmar identificação completa. |
| `LEGAL_TAX_ID`, `LEGAL_ADDRESS`, `LEGAL_ESTABLISHMENT_COUNTRY` | Informação real aprovada para publicação. |
| `LEGAL_RETENTION_NOTICE` | Texto aprovado com prazos/critérios dos contactos, correio, logs, backups e obrigações contratuais/fiscais. Não existe aprovação de 12 meses. |
| `LEGAL_PROCESSORS_NOTICE` | Fornecedores realmente usados, papéis, destinatários, localização, subcontratantes e garantias internacionais; incluir Resend/Upstash apenas se ativos. |
| `LEGAL_CONSUMER_NOTICE` | Texto aprovado de atendimento a particulares, processo comercial, reclamações e RAL, incluindo eventual fundamento de não aplicação. Não deixar vazio. |
| `LEGAL_COMPLAINTS_URL`, `LEGAL_ADR_URL` | Ligações HTTPS reais ao Livro/entidade RAL, se aplicáveis, depois de registo e confirmação de competência. Surgem nos Termos; o nome/enquadramento deve constar do aviso. Não preencher com exemplos ou entidade escolhida ao acaso. |
| `LEGAL_LAST_REVIEW_DATE` | Data efetiva da revisão, AAAA-MM-DD. |
| `LEGAL_REVIEW_APPROVED` | `true` só após resolver e validar os pontos da matriz legal. É uma declaração operacional, não uma certificação automática. |
| `CONTACT_ENABLED` | `false` para impedir envios; `true` somente após configuração e teste controlado. |
| `CONTACT_FROM_EMAIL` | Remetente em domínio verificado na Resend; texto de exemplo não funciona em produção. |
| `CONTACT_TO_EMAIL` | Caixa real controlada pelo responsável. Não é controlada pelo visitante. |
| `RESEND_API_KEY` | Chave limitada a envio e ao domínio necessário; guardar como segredo na Vercel, MFA na conta. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Criar/contratar Redis REST Upstash adequado à jurisdição e ao DPA. Endpoint HTTPS `*.upstash.io`, sem caminhos ou parâmetros. Token precisa de EVAL, INCR, EXPIRE e TTL; limitar à base dedicada se o fornecedor permitir. |
| `RATE_LIMIT_KEY_SECRET` | Segredo aleatório com pelo menos 32 caracteres, gerado por gestor de segredos ou CSPRNG normalizado. Não publicar o seu valor. |

O formulário sem Redis disponível falha com 503. O limite durável é **6 tentativas por IP/rede IPv6 /64 em 15 minutos**, mais **100 tentativas admitidas globalmente numa janela de 24 horas**. O contador de IP tem TTL de 15 minutos, o global de 24 horas. As chaves usam HMAC-SHA-256 com segredo; são pseudónimos, não dados anónimos. O limite global é uma proteção de orçamento e pode suspender contactos legítimos; aprovar a capacidade pretendida e ajustar código/testes se necessário. Acrescentar WAF/limites e alertas de custo na Vercel: o limitador da função não impede o custo de todas as invocações/consultas Redis.

## 4. Domínio, HTTPS e correio

1. Na publicação autorizada, adicionar o domínio na Vercel e copiar **os valores A/CNAME/TXT efetivamente indicados pelo painel** para a zona DNS Hostinger. Não adivinhar endereços de IP fixos. Preservar MX/TXT já existentes do correio.
2. Verificar propagação, domínio canónico e redirecionamentos permanentes HTTP→HTTPS e domínio secundário→canónico. A API aceita apenas a origem canónica configurada.
3. Confirmar certificado válido, cadeia e renovação automática. A Vercel tenta emitir certificados após validar o DNS; o domínio real ainda não foi testado. Verificar CAA e eventuais conflitos se a emissão falhar. [Certificados Vercel](https://vercel.com/docs/domains/working-with-ssl).
4. Verificar TLS no domínio real e ligações Vercel→Resend/Redis. Rever exigência mínima de TLS suportada pelo plano; não desativar validação de certificados. O código usa HTTPS e recusa redirecionamentos nas duas APIs externas.
5. Configurar DKIM/SPF indicados pela Resend e uma política DMARC adequada ao domínio, sem destruir o SPF existente nem criar dois SPF. Confirmar entrega numa caixa controlada, com consentimento para o teste.
6. HSTS: o código não acrescenta `includeSubDomains` nem `preload`. A Vercel documenta HSTS automático de dois anos; verificar o cabeçalho real e todos os subdomínios relevantes antes da publicação. Não ativar preload nem alterar política sem inventário de subdomínios e decisão de migração/rollback. [Cabeçalhos Vercel](https://vercel.com/docs/headers/response-headers).

## 5. Proteção operacional e dados

- Ativar MFA e acessos mínimos nas contas Vercel, Hostinger, Resend, Upstash, GitHub e correio. Não partilhar contas.
- Verificar DPA e subcontratantes, região da função e do Redis, localização de logs/e-mails e garantias de transferência; uma região UE não prova que todo o tratamento fica na UE.
- Confirmar encriptação em repouso e cópias de segurança nos serviços/caixas de correio. O site não tem base de dados de contactos, contas nem palavras-passe.
- Decidir retenção, responsáveis por eliminação/pedidos de titulares, rotina de revisão, registo de tratamento e incidente; não colocar corpo do formulário ou tokens em logs, analytics, session replay ou log drains.
- Rodar chaves Resend e Redis pelos mecanismos do fornecedor: criar nova chave restrita, atualizar apenas o segredo da função, validar, revogar a antiga. Em incidente revogar imediatamente conforme plano aprovado. Rodar o HMAC após avaliar reset temporário de limites e expiração das chaves antigas. Não criar criptografia própria.
- Configurar monitorização de disponibilidade, 429/503/502 e custos sem payloads pessoais. Redigir e testar procedimento de incidente, avaliação de risco e eventuais notificações às autoridades/titulares.

## 6. Verificações exigidas antes de libertar

Localmente, sem publicar:

```powershell
npm.cmd ci --ignore-scripts
node --test tests/*.test.mjs
npm.cmd audit --audit-level=high
node scripts/build.mjs --output "$env:TEMP\dipanda-site-dist"
node scripts/check-production-browser.mjs
node scripts/build.mjs --production
```

O último comando **deve falhar neste momento**, porque a informação/configuração real está incompleta. A auditoria verificou esta falha esperada. O teste de navegador exige o servidor local ligado e Edge/Chromium instalado.

O Node local inicialmente identificado foi 24.11.1. Usar **Node 24.22.1 ou patch posterior da linha 24**: o build de produção e a função recusam versões anteriores. A seleção Vercel `24.x` recebe patches geridos, mas confirmar a versão efetiva nos logs antes de promover. O [boletim Vercel de 29/10/2026](https://vercel.com/kb/bulletin/node-js-security-advisory) informa que novos deployments já recebem runtime corrigido; isso não foi verificado numa conta/deployment deste projeto.

Depois de autorização específica e preview de infraestrutura, ainda será necessário testar a função Vercel real, EVAL/TTL numa base dedicada, contagem concorrente entre instâncias, falha do Redis, limite global e entrega de uma mensagem de teste. Testar cookies no domínio HTTPS, recusar/retirar consentimento, confirmar que analytics/Speed Insights/pixels não foram ativados pelo painel e testar teclado/leitor de ecrã/contraste. Nenhuma destas verificações num ambiente real foi executada nesta tarefa.

Antes de promover: o responsável e o revisor jurídico resolvem a matriz legal; a pessoa técnica confirma DNS/TLS/cabeçalhos/segredos/limites/entrega e rollback. Um rollback técnico não pode recuperar informação pessoal já enviada; aplicar também os procedimentos dos fornecedores.
