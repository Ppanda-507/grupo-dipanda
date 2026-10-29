import { publicOrigin, publicLink } from './security.mjs';
import { runtimeIsPatched } from './runtime-version.mjs';

export function productionIssues(environment = process.env, nodeVersion = process.versions.node) {
  const issues = [];
  if (!runtimeIsPatched(nodeVersion)) issues.push('NODE_RUNTIME: exigir Node 24.22.1 ou patch posterior da linha 24, com as correções de outubro de 2026.');
  if (!publicOrigin(environment.SITE_URL)) issues.push('SITE_URL: definir a origem HTTPS real, sem caminho nem domínio de exemplo.');
  for (const name of ['LEGAL_CONTROLLER_NAME', 'LEGAL_TAX_ID', 'LEGAL_ADDRESS', 'LEGAL_ESTABLISHMENT_COUNTRY', 'LEGAL_RETENTION_NOTICE', 'LEGAL_PROCESSORS_NOTICE', 'LEGAL_CONSUMER_NOTICE']) {
    if (!environment[name]?.trim()) issues.push(`${name}: informação confirmada em falta.`);
  }
  for (const name of ['LEGAL_COMPLAINTS_URL', 'LEGAL_ADR_URL']) if (environment[name] && !publicLink(environment[name])) issues.push(`${name}: ligação pública HTTPS inválida.`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(environment.LEGAL_LAST_REVIEW_DATE || '') || !Number.isFinite(Date.parse(environment.LEGAL_LAST_REVIEW_DATE)) || environment.LEGAL_LAST_REVIEW_DATE > new Date().toISOString().slice(0, 10)) issues.push('LEGAL_LAST_REVIEW_DATE: indicar a data real de revisão (AAAA-MM-DD), sem data futura.');
  if (environment.LEGAL_REVIEW_APPROVED !== 'true') issues.push('LEGAL_REVIEW_APPROVED: a identidade, mercados, fundamentos, prazos, fornecedores e requisitos de consumo precisam de validação.');
  if (!['true', 'false'].includes(environment.CONTACT_ENABLED)) issues.push('CONTACT_ENABLED: escolher explicitamente true ou false.');
  if (environment.CONTACT_ENABLED === 'true') {
    for (const name of ['RESEND_API_KEY', 'CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) if (!environment[name]?.trim()) issues.push(`${name}: configuração do formulário em falta.`);
    try {
      const redis = new URL(environment.UPSTASH_REDIS_REST_URL);
      if (redis.protocol !== 'https:' || !redis.hostname.endsWith('.upstash.io') || redis.username || redis.password || redis.port || redis.pathname !== '/' || redis.search || redis.hash) throw new Error();
    } catch { issues.push('UPSTASH_REDIS_REST_URL: endpoint HTTPS Upstash válido em falta.'); }
    if ((environment.RATE_LIMIT_KEY_SECRET || '').length < 32) issues.push('RATE_LIMIT_KEY_SECRET: segredo aleatório de pelo menos 32 caracteres em falta.');
    for (const name of ['CONTACT_FROM_EMAIL', 'CONTACT_TO_EMAIL']) if (/[\r\n\u0000]/.test(environment[name] || '')) issues.push(`${name}: caracteres de controlo proibidos.`);
  }
  return issues;
}

export function assertProductionReady(environment = process.env) {
  const issues = productionIssues(environment);
  if (issues.length) throw new Error('Publicação bloqueada:\n- ' + issues.join('\n- '));
}
