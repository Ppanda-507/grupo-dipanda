// Minimum patched Node 24 release verified against the October 2026 advisory.
// Vercel selects only a major line; enforce its patch floor in our code too.
export function runtimeIsPatched(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return Boolean(match && Number(match[1]) === 24 && (Number(match[2]) > 22 || Number(match[2]) === 22 && Number(match[3]) >= 1));
}
