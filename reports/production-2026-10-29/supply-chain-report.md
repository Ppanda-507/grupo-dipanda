# Supply Chain Risk Report — `1`

**Scanned:** `C:\Users\DELL\Documents\1`
**Commit:** `d96498c6fd35`
**Manifests read:** `package.json`, `package-lock.json`
**Scanned at:** 2026-10-29T08:23:23+00:00
**Direct dependencies:** 1 (npm 1)

## Summary

- **No known advisory affects any of the 1 direct dependencies**, checked at the versions this project resolves.
- The lockfile resolves no packages beyond the direct dependencies.
- 1 of 1 dependencies carry at least one finding, 0 of which reach production.
- Weakest coverage: **Publisher concentration**, established for 0 of 1; the Coverage section lists every criterion.

## Production dependencies

Every direct dependency is declared as a development dependency, so none
of them ships in the built artifact.

## Findings

No dependency was flagged on these criteria.

## Upstream repository and CI hygiene — OpenSSF Scorecard

These criteria describe each dependency's own repository, not the audited
project. Remediation, where any exists, is upstream.

### Build-time only

Declared as development dependencies. A compromise here reaches build and CI hosts rather than users of the shipped artifact.

| Dependency | Version | Weekly downloads | Findings |
|---|---|---|---|
| `playwright-core` | 1.58.0 | 142,580,703/wk | Binary-Artifacts scores 6/10 (below 10) |

## Transitive advisories

`package-lock.json` resolves no packages beyond the direct dependencies.

## Informational

Measured, not flagged.

- **CI token permissions**: median 0/10 across 1 scored dependencies; 1 score below 6. Not flagged — this measures whether CI workflows declare least-privilege tokens, which tracks project maturity rather than the likelihood of malicious code being published.
- **Changes reviewed by a second person**: median 9/10 across 1 scored dependencies; 0 score below 6. Not flagged — this measures the share of recent commits reviewed by a second person, which is low for most small single-maintainer projects and largely restates publisher concentration.
- **Publish provenance**: 1 of 1 publish with build provenance.
- **Security policy published**: 1 of 1 publish a security policy.
- **Download volume**: established for 1 of 1; median 142,580,703/week. Lowest: `playwright-core` (142,580,703/wk).

## Coverage

What was and was not measured, per criterion.

| Criterion | Tier | Assessed | Flagged | Not assessable |
|---|---|---|---|---|
| Known advisories | A | 1/1 | 0 | 0 |
| Deprecated or yanked | A | 1/1 | 0 | 0 |
| Repository archived | A | 1/1 | 0 | 0 |
| Maintenance activity | A | 1/1 | 0 | 0 |
| Publisher concentration | B | 0/1 | 0 | 1 |
| Install-time script execution | B | 1/1 | 0 | 0 |
| Dangerous CI workflow | scorecard | 1/1 | 0 | 0 |
| CI token permissions | scorecard | 1/1 | 0 | 0 |
| Checked-in binaries | scorecard | 1/1 | 1 | 0 |
| Changes reviewed by a second person | scorecard | 1/1 | 0 | 0 |
| Publish provenance | info | 1/1 | 0 | 0 |
| Security policy published | info | 1/1 | 0 | 0 |
| Download volume | info | 1/1 | 0 | 0 |

## Not assessable

**Publisher concentration**

- 1 dependency — publishes from CI with provenance, so the effective publisher set is whoever can merge to the release branch — not externally observable: `playwright-core`

## Method and caveats

- cache directory ownership was not verified: os.getuid is POSIX-only, so a cache at C:\Users\DELL\AppData\Local\Temp\supply-chain-risk-auditor-cache owned by another user would not be detected on this platform. Keep the cache under your own user profile, or pass --cache with a private path.
- Optional tooling detected: npm. Not installed, so not used: bundler-audit, cargo-audit, osv-scanner, pip-audit.
- The lockfile (package-lock.json) resolves no packages beyond the direct dependencies.
- HTTP sources: 6 fetched, 1 served from cache (oldest 0.0h old), 0 refetched as stale, 0 unavailable offline, 0 errors.
