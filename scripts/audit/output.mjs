import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Each normal invocation receives a fresh TEMP directory. An explicit output
// directory can collect one run; evidence files are still created with wx.
export async function auditDirectory(kind) {
  const directory = process.env.AUDIT_OUTPUT_DIR
    ? path.resolve(process.env.AUDIT_OUTPUT_DIR)
    : await fs.mkdtemp(path.join(os.tmpdir(), `dipanda-${kind}-`));
  if (/dipanda-arquivo-|[\\/]reports[\\/](?:local-audit|production|consent-storage|local-error-pages)-2026-10-(?:29|31)(?:[\\/]|$)/i.test(directory)) throw Error('Historical evidence is read-only. Choose a new audit output directory.');
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

export async function writeEvidence(file, contents) {
  await fs.writeFile(file, contents, { flag: 'wx' });
}
