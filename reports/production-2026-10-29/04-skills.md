# Inspeção e instalação das skills

Conteúdo obtido do GitHub para diretório temporário, antes de instalar ou executar scripts. Árvores, ficheiros, manifestos, referências e dependências foram inspecionados. Os hashes SHA-256 e commits constam de `skill-review-manifest.json`. Não foram executados hooks de instalação dos repositórios nem instalados plugins Claude.

Instalador suportado utilizado: `C:/Users/DELL/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py`, com `--repo`, `--path` e **`--ref` fixado**. Destino: `C:/Users/DELL/.codex/skills/`. As skills não estavam instaladas no início.

| Pedido | Resultado | Compatibilidade/dependências e uso nesta auditoria |
|---|---|---|
| OpenAI `security-best-practices` | Instalado | Instruções/referências, sem pacote runtime adicional. Aplicadas referências de frontend JavaScript e controlos gerais de servidor; Express não está na stack e não foi presumido. |
| OpenAI `security-threat-model` | Instalado | Instruções/referências sem executável externo obrigatório. Contexto validado com o utilizador; hipóteses restantes explícitas no modelo. |
| Anthropic `compliance-check` | Instalado | Markdown compatível; conectores jurídicos opcionais não requeridos. Contém referência relativa a `CONNECTORS.md` do plugin original, não incluída na pasta da skill: não é necessária para a revisão com fontes oficiais e foi registada como limitação. As generalizações jurídicas da skill foram verificadas em fontes oficiais, não tratadas como lei. |
| Trail of Bits `static-analysis` | Parcial: `sarif-parsing` instalado | O pedido corresponde a plugin, não a uma skill única. O componente SARIF tem utilitários Python standard-library e é compatível. Não houve ficheiro de resultados CodeQL/Semgrep para processar; não foi fabricado um scan SARIF. Dependências opcionais de validação/streaming não instaladas. |
| Trail of Bits CodeQL | Não instalado/executado | CLI CodeQL, Bash e respetivos workflows não estão disponíveis neste ambiente PowerShell. CodeQL tem distribuição Windows, mas a automação inspecionada exige Bash; ainda seria necessário verificar licença de análise de repositório privado. Não se afirmou execução de taint analysis. |
| Trail of Bits Semgrep | Não instalado/executado | CLI e Bash ausentes; workflow inspecionado é shell e depende de ambiente adicional compatível/WSL ou Linux. Não instalar silenciosamente uma stack Linux ou executar comandos adaptados como se fossem o workflow original. |
| Trail of Bits `insecure-defaults` | Incompatível; não instalado | A versão inspecionada é plugin Claude, **sem `SKILL.md`**. O comando exige `Workflow`, `${CLAUDE_PLUGIN_ROOT}` e pipeline JavaScript desse host. Codex não dispõe dessa ferramenta. A revisão manual de defaults foi feita separadamente, sem alegar execução do plugin. |
| Trail of Bits `supply-chain-risk-auditor` | Instalado e executado | Python >=3.11, standard library; Python 3.14 disponível. `uv` ausente, executados os mesmos scripts com Python sem alterar código. `gh` autenticado disponível. O coletor consulta metadados de pacotes/advisories/repositórios, não envia fonte nem dados pessoais do formulário. |

Commits inspecionados/instalados:

- `openai/skills`: `49f948faa9258a0c61caceaf225e179651397431`.
- `anthropics/knowledge-work-plugins`: `2574e29377c7173d0cecffef29a6ecbd7f8ccb5d`.
- `trailofbits/skills`: `2be6433b39e009cd2b6fd3be1895f6b1faa5af9a`.

As cinco skills instaladas ficam disponíveis ao cliente no próximo turno. Os ficheiros já foram lidos nesta sessão para orientar a auditoria. Não foi necessário delegar trabalho a agentes.

## Cobertura e limites

`npm audit`, o coletor supply-chain e revisão manual de entradas/saídas substituem apenas parte do que scanners adicionais poderiam detetar. **Semgrep e CodeQL não correram**; não existe alegação de SAST automático completo nem de ausência de todas as vulnerabilidades. Para complementar, executar futuramente os workflows oficiais num runner Linux autorizado, com regras revistas, métricas Semgrep desativadas e verificação de qualidade da base CodeQL, incluindo avaliação de licenciamento. Nenhum upload de código foi feito para um serviço de scanning nesta tarefa.

O coletor mediu uma dependência direta de desenvolvimento, `playwright-core@1.58.0`. Não encontrou advisories conhecidos nessa versão. A concentração de publicadores ficou não avaliável; OpenSSF sinalizou binários no repositório upstream (6/10), de âmbito build/teste. Isso não foi transformado numa vulnerabilidade de produção. Relatório e JSON originais preservados, incluindo cobertura e limitações Windows do cache.
