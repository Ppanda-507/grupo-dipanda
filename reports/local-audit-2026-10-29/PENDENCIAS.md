# Pendências da auditoria inicial

Estado de consolidação em 29/10/2026. Esta lista não reabre testes aprovados nem condiciona o fecho técnico local à publicação. Fontes e fundamento jurídico permanecem na [matriz completa](../production-2026-10-29/03-matriz-legal.md); não houve nova avaliação legal nesta consolidação.

## 1. O que ainda podemos resolver localmente

- Completar revisão de acessibilidade: teclado/foco, contraste, leitor de ecrã e interação móvel; corrigir apenas problemas demonstrados. Não há certificação WCAG.
- Completar análise estática e cobertura que ficaram limitadas por ferramentas/dependências; preparar scanners compatíveis, sem apresentar pesquisas por padrões como CodeQL/Semgrep executados.
- Preparar procedimentos e modelos de retenção/eliminação, pedidos de titulares, incidentes e revisão de acessos; preencher factos só depois de confirmados pelo responsável.
- Documentar instalação normal de Node corrigido, em vez de depender do executável temporário; instalar no sistema apenas com autorização adequada. Uma redução adicional de style-src unsafe-inline exigiria refatoração visual e testes específicos, não é vulnerabilidade demonstrada nem bloqueio local atual.

**Limitação que exige outro equipamento:** SameSite continua inconclusivo no WebKit/Windows. Pode ser investigado sem publicação num macOS/Safari real com servidor local, mas esse navegador não está disponível nesta máquina. Não o converter em aprovação nem pressupor que só um deployment o resolverá.

## 2. Informações a fornecer pelo responsável

- País de estabelecimento, morada profissional, NIF/enquadramento de atividade de Paulo Panda e contactos legais; confirmar localizações indicadas no rodapé. A empresa ainda não constituída não foi inventada.
- Domínio final, plano/região de alojamento, fornecedor da caixa de correio e decisões sobre Resend/Redis; confirmar contratos, subcontratantes, transferências e contactos de suporte. Não enviar segredos no chat.
- Finalidades/fundamentos e prazos reais de conservação de contactos/e-mails/logs/backups; responsáveis por direitos dos titulares e incidentes.
- Como serão contratados serviços por particulares, preços/informação pré-contratual e enquadramento de RAL/Livro de Reclamações; validar Portugal/UE e Angola com profissional habilitado. Confirmar direitos de imagens/logótipos e autorização do projeto de portefólio.

## 3. O que só será confirmado no ambiente publicado

- Certificado público/cadeia/renovação, DNS, redirects HTTP→HTTPS/canónico, HSTS e conteúdo misto no domínio efetivo.
- Cabeçalhos/cache CDN reais, runtime efetivo, execução da função de contacto, cookies/rastreadores que a plataforma acrescente e comportamento do consentimento nesse ambiente.
- Rate limit/TTL entre instâncias, WAF e limites de custo; entrega de correio, configuração do remetente e falhas reais de fornecedores em ensaio previamente autorizado.
- Controles operacionais do alojamento/fornecedores: MFA/acessos, encriptação em repouso, logs, retenção, monitorização, backups e recuperação, com documentação/evidência do operador. Alguns podem ser preparados antes, mas não foram confirmados numa operação real.

Nada desta terceira lista foi executado ou autorizado para publicação nesta fase. O checklist técnico futuro está em [deploy/VERCEL.md](../../deploy/VERCEL.md).
