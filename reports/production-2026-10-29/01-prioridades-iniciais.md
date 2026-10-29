# Problemas críticos e altos — antes das correções

Data: 29/10/2026. Âmbito: site Dipanda na raiz; `casaspanda/` excluído por confirmação do responsável. Estado original preservado em `baseline-evidence.txt`, com números de linha. Nenhuma vulnerabilidade crítica demonstrada nesta primeira inspeção.

| ID | Gravidade | Evidência inicial | Impacto | Correção prevista |
|---|---|---|---|---|
| SEC-00 | Alta: runtime desatualizado; exploração no site não demonstrada | `node --version` devolveu `v24.11.1`; aviso oficial Node de 21/10/2026 e boletim Vercel de 29/10/2026 | A versão antecede correções de Brotli, TLS e outras dependências internas. A falha Brotli exige descomprimir dados de atacante; não existe chamada Brotli explícita na aplicação. Não confundir a gravidade do componente com RCE demonstrada neste site. | Exigir Node 24.22.1+ da linha 24 no build de produção e na função; confirmar runtime Vercel corrigido e atualizar ferramenta local antes de publicação. [Aviso Node](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), [Vercel](https://vercel.com/kb/bulletin/node-js-security-advisory). |
| PROD-01 | Alta: bloqueio funcional da publicação escolhida | `scripts/serve.mjs:43-49` contém o único endpoint; inexistência de `api/` e `vercel.json` na inspeção | A publicação apenas do diretório estático na Vercel não fornece a API de contactos. O formulário deixa de cumprir a função principal do site. Não é uma vulnerabilidade de execução remota. | Endpoint Vercel que partilha validação e lógica com o servidor local; configuração de build/cabeçalhos e testes da API sem envio real. |
| SEC-01 | Alta, condicionada à ativação do formulário público | `scripts/serve.mjs:20-22,34-35`: contador em memória, incrementado depois da leitura/validação; sem estado partilhado | Em funções distribuídas/reinícios, o limite de seis pedidos não é globalmente conservado. Pedidos concorrentes com leitura atrasada podem passar a mesma verificação. Risco de spam, consumo de quota de e-mail e indisponibilidade. Origem/honeypot não autenticam um remetente automatizado. | Reserva atómica antes de ler/enviar, backend durável para Vercel, limite global e falha fechada quando o limitador não está configurado/disponível. |
| LEG-01 | Alta: bloqueio legal, não CVE | `src/site.mjs:7-9`: marca apresentada como nome legal, NIF e morada vazios; `src/policies.mjs:4,17` não identifica pessoa/entidade responsável | Falta a identificação do prestador/responsável pelos dados. O utilizador confirmou que a empresa ainda não foi constituída; isso não identifica automaticamente quem assume a atividade como pessoa singular. | Não inventar dados. Permitir configurar identificação real, bloquear build de produção com lacunas e exigir validação de quem será prestador e responsável pelo tratamento. RGPD art. 13 e DL 7/2004 art. 10. |
| LEG-02 | Alta: bloqueio de transparência/verificação | `src/policies.mjs:22-24`: revisão aos 12 meses e prestadores/transferências genéricos, sem evidência de decisão operacional | Publicar compromissos de conservação e tratamento não confirmados pode tornar a informação ao titular inexata. Vercel e Resend, e eventual limitador remoto, requerem inventário/DPA/localização/garantias de transferência reais. | Retirar prazo não confirmado, suportar texto aprovado/configurado e manter gate de produção até confirmação dos dados, fornecedores e políticas. |

## Outros pontos em análise

- Ausência de CSP no servidor e de configuração de segurança para Vercel; classificação média enquanto não existir caminho XSS demonstrado.
- Comparação de Origin apenas por host, ausência de allowlist de hosts e tipos de conteúdo permissivos no endpoint.
- Tipos/duplicação de campos, caracteres de controlo, limite do corpo e timeouts; erros genéricos existentes evitam fuga de detalhes.
- Não existe SQL/ORM, login, sessão de utilizador, pagamentos ou upload no site Dipanda. Não se atribuem achados de SQL Injection ou isolamento multiutilizador por semelhança com o projeto `casaspanda`.
- HTTPS, certificados, renovação, DNS, HSTS, encriptação em repouso, permissões e registos dos fornecedores serão distinguidos dos controlos testados localmente.

## Contexto confirmado

Portugal/UE e Angola; site informativo de serviços, sem pagamento online; contactos por nome, e-mail e mensagem; Vercel como alojamento e Hostinger para domínio. Empresa ainda não constituída. Identidade da pessoa responsável, domínio final, contratos e localização efetiva do tratamento continuam pendentes.
