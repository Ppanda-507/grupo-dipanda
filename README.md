# Dipanda

Website em Node.js/ESM, HTML gerado no build e JavaScript nativo no navegador. A entrada `api/contact.js` executa o contacto na Vercel. Não existe framework de frontend nem compilação do código privado para o navegador.

## Estrutura

| Diretório | Responsabilidade |
| --- | --- |
| `src/pages/` | Rotas, documento HTML e páginas legais |
| `src/components/` | Componentes HTML partilhados e elementos visuais |
| `src/features/` | Páginas e secções de serviços, situações e demonstrações |
| `src/content/` | Conteúdo e dados editoriais |
| `src/lib/` | Navegação e atributos de imagens |
| `server/contact/` | Validação, limites e envio SMTP/Resend |
| `server/http/` | Servidor local, caminhos públicos e respostas HTTP |
| `server/` | Headers, validação de URLs e versão do runtime |
| `api/` | Entrada serverless da Vercel |
| `public/` | Recursos deliberadamente públicos; conserva os URLs existentes |
| `config/public-assets.json` | Lista explícita dos recursos que podem ser publicados |
| `scripts/` | Comandos de build, desenvolvimento e auditoria |
| `tests/` | Testes unitários, de integração e servidor de auditoria simulado |
| `docs/` | Arquitetura, publicação, segurança, fontes e evidência histórica |
| `dist/` | Artefacto gerado e ignorado pelo Git |

## Desenvolvimento

Usar Node.js 24. A função de contacto preserva o mínimo de runtime já exigido pelo projeto: 24.22.1. Instalar dependências com `npm ci --ignore-scripts`. Nodemailer é dependência de execução; Playwright é apenas dependência de desenvolvimento.

Se ainda não existir `.env`, copiar `.env.example` para `.env`. **Não substituir um `.env` existente.** O exemplo contém dados demonstrativos e contactos desativados. A configuração real é local ou fornecida pela Vercel; nunca deve ser versionada.

```sh
npm run dev
npm run build
npm run preview
npm run build:production
npm test
```

O servidor usa `127.0.0.1:4173` por omissão. Para acesso pela rede local: `npm run dev -- --host 0.0.0.0`. O comando `preview` usa `dist/`, pelo que exige um build anterior.

## Verificações e evolução

- [Arquitetura e criação de páginas](docs/architecture.md).
- [Configuração do contacto e publicação na Vercel](docs/deployment.md).
- [Reprodução de testes e auditorias](docs/testing.md).
- [Auditoria estrutural e decisões](docs/refactor/review.md).
- [Resultados e limites da validação](docs/refactor/validation.md).
- [Proveniência das auditorias anteriores](docs/audits/history/README.md).

Esta refatoração não publica o site, não reintroduz o bloqueio legal de produção e não envia mensagens reais durante os testes.
