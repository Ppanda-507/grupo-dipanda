# Publicação e contacto

## Vercel

Manter a raiz do repositório como raiz do projeto, Node.js 24 e a configuração de `vercel.json`:

- instalação: `npm ci --ignore-scripts --omit=dev`;
- build: `node scripts/build.mjs`;
- artefacto estático: `dist/`;
- função: `api/contact.js`, máximo de 30 segundos.

`docs/`, testes, `.env`, dependências locais e o build local são excluídos do envio pela `.vercelignore`. Os módulos de `server/`, o conteúdo de `src/` e `config/` continuam disponíveis para a construção e para a função, sem se tornarem ficheiros estáticos públicos. O Nodemailer permanece em `dependencies`.

A compatibilidade aqui foi verificada localmente e por inspeção da configuração. Esta refatoração não cria um deployment nem comprova o comportamento da infraestrutura pública da Vercel.

## Variáveis do contacto

| Variável | Uso |
| --- | --- |
| `SITE_URL` | Origem HTTPS final, por exemplo `https://grupodipanda.com` |
| `CONTACT_ENABLED` | `true` para permitir envios; `false` para desativar |
| `CONTACT_PROVIDER` | `smtp` na configuração atual; `resend` permanece compatível |
| `SMTP_HOST` | `smtp.hostinger.com` para Hostinger Email |
| `SMTP_PORT` | `465` com TLS implícito ou `587` com STARTTLS obrigatório |
| `SMTP_USER` | Endereço completo da caixa empresarial |
| `SMTP_PASSWORD` | Palavra-passe da caixa, apenas em ambiente privado |
| `CONTACT_FROM_EMAIL` | Remetente empresarial autenticado |
| `CONTACT_TO_EMAIL` | Caixa que recebe os pedidos |

Na configuração real atual, a caixa é `geral@grupodipanda.com`. Não copiar a palavra-passe para documentação, código, Git ou chat. O `.env.example` é demonstrativo; o `.env` existente foi preservado. As variáveis locais não são transportadas para a Vercel pelo Git. Configurar os valores no ambiente desejado da plataforma e criar um novo deployment quando forem alterados.

O handler aceita a origem canónica e as origens fornecidas pela Vercel em `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL`. Uma Preview só envia se `CONTACT_ENABLED=true` nesse ambiente. Redirecionar `www` para a origem canónica se também estiver publicado, em vez de alargar arbitrariamente a lista de origens.

O limite básico é por instância e reinicia com a instância. Para quotas partilhadas opcionais, configurar `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` e `RATE_LIMIT_KEY_SECRET` com pelo menos 32 caracteres. Se uma configuração partilhada estiver presente mas inválida ou indisponível, o envio continua bloqueado; não há fallback silencioso.

As variáveis `LEGAL_*` alimentam o conteúdo público das páginas legais. A refatoração preserva as minutas e não as apresenta como validação jurídica concluída. O bloqueio de build retirado por pedido do utilizador não foi restaurado.

## Fontes primárias

- [SMTP Hostinger Email](https://support.hostinger.com/en/articles/1575756-how-to-get-email-account-configuration-details-for-hostinger-email).
- [SMTP em funções Vercel](https://vercel.com/kb/guide/serverless-functions-and-smtp).
- [Variáveis de ambiente na Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).
