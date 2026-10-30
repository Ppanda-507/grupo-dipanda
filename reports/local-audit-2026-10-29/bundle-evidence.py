"""Run from repository root; create a review bundle without private keys or browsers."""
from pathlib import Path
import hashlib
import json
import os
import tempfile
import zipfile

root = Path.cwd().resolve()
out = root / 'reports/local-audit-2026-10-29'
version = json.loads((out / 'code-version.json').read_text(encoding='utf-8'))
files = []
for report_dir in ['production-2026-10-29', 'consent-storage-2026-10-29', 'local-audit-2026-10-29']:
    files += [p for p in (root / 'reports' / report_dir).rglob('*')
              if p.is_file() and p.name != 'artefactos.json' and p.suffix != '.zip' and not p.name.endswith('.zip.sha256')]
for item in version['files']:
    name = item['file']
    if name.startswith(('public/assets/', 'public/fonts/')):
        continue
    files.append(root / name)
files.append(root / 'README.md')
files = sorted(set(files), key=lambda p: p.relative_to(root).as_posix())
manifest = {'snapshot': version['snapshot'], 'scope': 'Source text/config/tests and audit reports; binary assets remain in the project and code-version manifest. No .env, TLS key, browser profile, browser binary or casaspanda.',
            'files': [{'file': p.relative_to(root).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size} for p in files]}
temporary = Path(tempfile.mkdtemp(prefix='dipanda-evidence-'))
manifest_path = temporary / 'artefactos.json'
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
archive = temporary / 'evidencias-locais.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for file in files:
        bundle.write(file, file.relative_to(root).as_posix())
    bundle.write(manifest_path, 'reports/local-audit-2026-10-29/artefactos.json')
print(json.dumps({'archive': str(archive), 'manifest': str(manifest_path), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': len(files), 'bytes': archive.stat().st_size}))
