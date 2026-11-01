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
| `docs/` | Guias de manutenção, publicação e testes; fontes das imagens e conteúdos |
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

O servidor usa `127.0.0.1:4173` por omissão. Para acesso pela rede local: `npm run dev -- --host 0.0.0.0`. O comando `preview` usa `dist/`, pelo que exige um build anterior. Com `SITE_URL` configurado para um domínio real, o preview de produção valida esse Host; usar `npm run dev` para navegar normalmente em localhost.

## Verificações e evolução

- [Arquitetura e criação de páginas](docs/architecture.md).
- [Configuração do contacto e publicação na Vercel](docs/deployment.md).
- [Reprodução de testes e auditorias](docs/testing.md).

## Arquivo de auditoria

Os relatórios, capturas, inventários da reorganização e evidências históricas ficam fora do projeto, na pasta vizinha `Dipanda-arquivo-2026-11-01/organizacao-projeto/`. Servem de registo e consulta; não exigem nenhuma ação para executar ou publicar o site.

Os testes e as ferramentas que permitem repetir as verificações continuam no projeto. O build gera `dist/`; a Vercel recebe o código e executa esse build. A configuração real do contacto é fornecida por variáveis de ambiente, conforme o guia de publicação.
