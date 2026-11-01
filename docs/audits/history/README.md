# Evidência histórica preservada

`evidence/` contém cópias integrais dos 138 ficheiros das auditorias anteriores, conservando o conteúdo e a organização originais. `manifest.json` regista caminho, tamanho e SHA-256 de cada ficheiro. A origem é o arquivo externo `Dipanda-arquivo-2026-10-31/reports`, que não foi alterado.

As auditorias históricas pertencem às versões, commits de base, snapshots, origens, navegadores e runtimes registados nos seus próprios relatórios. Não comprovam automaticamente o estado após esta reorganização. As classificações antigas, incluindo `UNVERIFIED` para limitações de WebKit/Windows, não foram alteradas.

Ficheiros executáveis existentes dentro da evidência são material histórico, não ferramentas atuais. Não executar `make-report`, `consolidate-runner-fix` ou o scanner antigo para gerar conclusões novas. As ferramentas atuais estão em `scripts/audit/`, com instruções em `docs/testing.md`.

Os resultados novos ficam separados em TEMP ou `reports/`, nunca dentro de `evidence/`. Esta documentação é excluída do deployment e não é copiada para `dist/`.
