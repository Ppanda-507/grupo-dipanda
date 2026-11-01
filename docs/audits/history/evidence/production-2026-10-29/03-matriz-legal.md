# Matriz de conformidade — Portugal/UE e Angola

> Matriz da preparação inicial para publicação. A [conclusão e matriz da fase local](../local-audit-2026-10-29/MATRIZ-LEGAL.md) distinguem os controlos técnicos verificados das decisões jurídicas/operacionais pendentes. Domínio, certificados públicos e Vercel foram excluídos da fase local pelo utilizador; não bloqueiam a sua conclusão técnica.

Revisão técnica e documental em 29/10/2026. **Publicação bloqueada; requer validação jurídica.** Não constitui parecer jurídico nem certificação de conformidade. As fontes abaixo são oficiais; confirmar consolidações, alterações e enquadramento final com profissional habilitado antes da disponibilização pública.

## Contexto e pressupostos confirmados

- Responsável indicado: **Paulo Panda**; sociedade ainda não constituída. País de estabelecimento, morada profissional, identificação fiscal e enquadramento de atividade não foram fornecidos.
- Mercados: Portugal/UE e Angola; empresas **e consumidores particulares**.
- Site informativo de serviços, sem checkout nem pagamentos. O formulário recolhe nome, e-mail e mensagem; inclui também honeypot e instante de início para proteção antiabuso. O visitante pode inserir dados adicionais no texto livre, sem que sejam necessários.
- Vercel para alojamento; Hostinger para domínio. Resend já era o serviço previsto no código para e-mail. Redis Upstash é uma preparação técnica adicional para limitação distribuída; ainda não contratado/configurado nesta tarefa.
- Domínio final, plano Vercel, localização dos fornecedores/caixa de correio e contratos ainda desconhecidos. `casaspanda` não pertence a este âmbito.

**Estados:** «cumpre» refere-se apenas ao controlo técnico local indicado; «não cumpre» identifica uma lacuna objetiva no estado atual; «por verificar» exige informação ou atuação externa; «não aplicável» limita-se à funcionalidade e pressupostos descritos, nunca à atividade futura em geral.

| Requisito | Estado | Evidência, aplicabilidade e ação necessária | Fonte oficial |
|---|---|---|---|
| Âmbito territorial RGPD | por verificar | Há oferta à UE; confirmar estabelecimento do responsável e, se necessário, representante UE. A localização do alojamento não resolve a questão. | [RGPD art. 3 e 27](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Execução portuguesa do RGPD | por verificar | Relevante se tratamento/estabelecimento tiver conexão portuguesa prevista na lei; confirmar país e operação. | [Lei 58/2019, art. 2](https://diariodarepublica.pt/dr/detalhe/lei/58-2019-123815982) |
| Identificação do responsável na privacidade | não cumpre | Nome indicado, mas identificação/localização completa e contactos juridicamente adequados ainda por validar. A marca não substitui o responsável. | [RGPD art. 13](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Informação no ponto de recolha | por verificar | Formulário liga à privacidade e já não apresenta resposta ao contacto como consentimento obrigatório. A política continua minuta incompleta. | [RGPD art. 12–13](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Fundamentos e finalidades | por verificar | Pré-contrato para propostas solicitadas; interesse legítimo sujeito a ponderação para outros contactos/segurança; cookies opcionais por consentimento. Validar cada finalidade real. | [RGPD art. 5–6](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Minimização e dados sensíveis | cumpre | Campos limitados a nome/e-mail/mensagem; instrução de evitar dados sensíveis/terceiros; não há telefone obrigatório, upload ou recolha de dados de saúde estruturada. Revisitar se o serviço mudar. | [RGPD art. 5 e 25](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Conservação | não cumpre | Prazo de 12 meses sem confirmação removido. Falta decisão para contactos, correio, logs, arquivos e backups. TTL dos contadores de segurança não é prazo dos e-mails. | [Lei 58/2019, art. 21](https://diariodarepublica.pt/dr/detalhe/lei/58-2019-123815982) |
| Exercício de direitos | por verificar | E-mail de contacto e direitos constam da minuta. Faltam responsável operacional, verificação proporcional de identidade, pesquisa nos fornecedores e rotina de resposta/eliminação. | [RGPD art. 12 e 15–22](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Reclamação à autoridade | por verificar | CNPD mencionada; confirmar autoridade competente com o estabelecimento e operação em Angola. | [CNPD](https://www.cnpd.pt/), [APD Angola — direitos](https://apd.ao/ao/direitos-do-cidadao/) |
| Contratos com subcontratantes | por verificar | Vercel, correio, Resend e eventual Upstash: confirmar papéis, DPA aplicável ao plano, subcontratantes e eliminação. Hostinger como registrador pode ter função própria; não classificar todos como subcontratantes sem contrato. | [RGPD art. 28](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679), [DPA Vercel](https://vercel.com/legal/dpa), [DPA Resend](https://resend.com/legal/dpa) |
| Transferências internacionais | por verificar | Região UE não basta: suportes, logs e subcontratantes podem estar noutros países. Confirmar adequação/SCC e análise necessária, incluindo conexão com Angola. | [RGPD cap. V](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Segurança e incidentes | por verificar | Correções de aplicação testadas; MFA, encriptação em repouso, backups, monitorização e procedimento de incidentes dependem do operador/fornecedores. | [RGPD art. 32–34](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Registos de tratamento, DPO e AIPD | por verificar | Preparar registo proporcional; verificar exceções/limiares e risco. Formulário simples não demonstra por si só obrigação de DPO ou AIPD, nem dispensa automática. | [RGPD art. 30, 35 e 37](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Cookies opcionais: consentimento prévio | cumpre | Nas páginas locais testadas não há cookies antes da escolha; funcional só após aceitação. Essencial regista escolha; sem analytics/pixels/embeds ativos. Verificar novamente na Vercel. | [CNPD — cookies](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf), [Lei 46/2012](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793) |
| Recusar/personalizar/retirar cookies | cumpre | Recusa na primeira camada; opcionais sem pré-seleção; “Gerir cookies” permite retirada e elimina cookie funcional. Testes de navegador e unitários. A validade jurídica final depende também da identidade/informação. | [EDPB — relatório sobre banners](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf) |
| Informação de cookies e prova da escolha | por verificar | Política descreve dois cookies/180 dias; cookie guarda versão/data/opção. Confirmar transparência completa e prova adequada à operação; não foi implementado arquivo central de consentimentos pessoais. | [Lei 41/2004 com alteração de 2012](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793), [RGPD art. 7](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679) |
| Marketing não solicitado | não aplicável | Não existe newsletter, campanha ou consentimento de marketing no fluxo auditado. Usar os contactos para publicidade futura exigirá avaliação própria, sem reutilização automática. | [Lei 41/2004, alteração de 2012](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793) |
| Identificação do prestador em linha | não cumpre | Nome parcial confirmado; falta endereço, identificação fiscal e registo/autorização quando aplicáveis. Não exige inventar sociedade; pessoa singular também precisa de enquadramento adequado. | [DL 7/2004, art. 10](https://diariodarepublica.pt/dr/detalhe/decreto-lei/7-2004-240775) |
| Constituição/atividade fiscal e profissional | por verificar | Não há sociedade. Confirmar possibilidade/requisitos de prestação em nome individual, início de atividade, faturação e eventual regulação; um site não regulariza a atividade. | [DL 7/2004, art. 10](https://diariodarepublica.pt/dr/detalhe/decreto-lei/7-2004-240775) |
| Checkout, pagamentos e PCI | não aplicável | Sem encomenda/pagamento no site. Não se recolhem cartões; não foram adicionados pagamentos. | [DL 24/2014, art. 5 e 7](https://diariodarepublica.pt/dr/detalhe/decreto-lei/24-2014-572450) |
| Informação pré-contratual, preços/impostos | por verificar | “Sob consulta” não fecha venda. Proposta a consumidor deve informar preço ou cálculo e termos. Confirmar processo comercial, mesmo fora do site. | [DL 24/2014, art. 4](https://diariodarepublica.pt/dr/detalhe/decreto-lei/24-2014-572450) |
| Cancelamento, livre resolução e garantias | por verificar | Contacto isolado não é contrato; contrato posterior por e-mail pode ser contrato à distância sem pagamento online. Avaliar serviços/digital, exceções e consentimentos para execução antecipada. Não inventar cláusulas. | [DL 24/2014, art. 2, 10 e 17](https://diariodarepublica.pt/dr/detalhe/decreto-lei/24-2014-572450) |
| Livro de Reclamações Eletrónico | por verificar | Há consumidores e serviços; esclarecer enquadramento/atividade e obrigações do operador, proceder ao registo se aplicável e colocar ligação real. Não presumir dispensa por ausência de checkout nem inventar registo. | [ASAE — Livro de Reclamações](https://www.asae.gov.pt/reclamacoes-e-denuncias/livro-de-reclamacoes.aspx) |
| Entidades RAL | por verificar | Se prestador estabelecido em Portugal atender consumidores, verificar entidades competentes/adesão e divulgar sítios reais. Não foi escolhida uma entidade sem dados da atividade/sede. | [Lei 144/2015, art. 2 e 18](https://diariodarepublica.pt/dr/detalhe/lei/144-2015-70215248) |
| Antiga plataforma europeia RLL/ODR | não aplicável | Plataforma descontinuada; não adicionar ligação obsoleta como solução para RAL. | [Regulamento UE 2024/3228](https://eur-lex.europa.eu/legal-content/PT/TXT/PDF/?uri=OJ:L_202403228) |
| Acessibilidade — obrigações específicas | por verificar | Site privado informativo; verificar definição de serviço de comércio eletrónico e eventual exceção de microempresa. Sem certificação WCAG/EN 301 549; realizar teclado, leitor de ecrã, zoom e contraste. | [DL 82/2022, art. 2 e anexos](https://diariodarepublica.pt/dr/detalhe/decreto-lei/82-2022-204379872) |
| Angola — âmbito e legitimidade | por verificar | Mercado confirmado; localização/estabelecimento/meios de recolha determinam aplicação. Não extrapolar RGPD como substituto da lei angolana. | [APD — Lei 22/11, art. 3](https://apd.ao/fotos/frontend_1/editor2/110617_lei_22-11_de_17_junho-proteccao_dados_pessoais.pdf) |
| Angola — informação, direitos e transferências | por verificar | Validar requisitos locais de informação, fundamento, representante/notificação/autorização e transferências se aplicáveis; pedir revisão local. Nome do responsável confirmado, restantes elementos em falta. | [APD — direitos](https://apd.ao/ao/direitos-do-cidadao/), [Lei 22/11](https://apd.ao/fotos/frontend_1/editor2/110617_lei_22-11_de_17_junho-proteccao_dados_pessoais.pdf) |
| Requisitos setoriais | por verificar | Consultoria/BI/web/chatbots neste site; não há operação de saúde, finanças reguladas ou decisões automatizadas sobre visitantes demonstrada. Futuros apps fitness/gastos exigem auditoria própria antes de lançamento. | [RGPD art. 9 e 22](https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679), [Lei 58/2019](https://diariodarepublica.pt/dr/detalhe/lei/58-2019-123815982) |

## Pontos de validação jurídica e do responsável

1. Identidade profissional/fiscal de Paulo Panda, país/sede efetivos e forma de exercício; decidir se aguarda sociedade ou atua em nome individual.
2. Finalidades e fundamentos por atividade; texto final de privacidade, conservação, direitos e resposta a incidentes.
3. Contratos/DPA/transferências e efetiva localização do correio, logs e backups; incluir o limitador apenas se contratado.
4. Processo de contratação de particulares por e-mail/telefone, preços, informação pré-contratual, resolução, garantias e obrigações de RAL/Livro de Reclamações.
5. Angola e eventuais formalidades locais; acessibilidade, microempresa e âmbito do serviço.
6. Confirmar a veracidade de localizações no rodapé (inclui Houston/EUA, não confirmado como mercado nesta auditoria), direitos de imagens/Figma/logótipos e autorização do cliente para apresentar Queluz Cardoso como portefólio. Não foram fabricadas autorizações.

## Aprovações em falta

| Responsável pela validação | Motivo | Estado |
|---|---|---|
| Paulo Panda | Identidade, operação, fornecedores, domínio e decisões documentadas | Pendente |
| Jurista/contabilista em Portugal | Atividade individual/sociedade, consumo e documentos | Pendente |
| Especialista local em Angola | Âmbito e obrigações de dados/atividade naquele mercado | Pendente |
| Pessoa técnica responsável | Vercel/DNS/TLS/e-mail/Redis/segredos e testes reais | Pendente |


Atualização legislativa consultada: o [DL 102/2026, art. 3 e anexo](https://files.diariodarepublica.pt/1s/2026/05/09900/0003400039.pdf) altera o DL 156/2005 para acrescentar gestores de créditos ao Livro de Reclamações. Não foi identificada essa atividade na Dipanda; isso não resolve a aplicação do regime geral ao atendimento de consumidores.
