import { escape } from './components.mjs';
const tools = [
  { name: 'Power BI', asset: 'integration-0.svg' },
  { name: 'Python', asset: 'integration-1.svg' },
  { name: 'Microsoft Fabric', asset: 'integration-2.svg' },
  { name: 'Azure SQL', asset: 'integration-3.svg' },
  { name: 'Microsoft Azure', asset: 'integration-4.png' },
  { name: 'Databricks', asset: 'integration-5.png' },
  { name: 'SQL Server', logo: 'microsoftsqlserver.svg' },
  { name: 'PostgreSQL', logo: 'postgresql.svg' },
  { name: 'MySQL', logo: 'mysql.svg' },
  { name: 'Oracle', logo: 'oracle.svg' },
  { name: 'Microsoft', logo: 'microsoft.svg' }
];
function toolIcon(tool) {
  if (tool.asset) return `<span class="integration-icon integration-icon--crop" aria-hidden="true"><img src="/assets/figma/${tool.asset}" alt="" width="133" height="32" loading="eager"></span>`;
  return `<span class="integration-icon integration-icon--logo ${tool.name === 'Oracle' ? 'integration-icon--oracle' : ''}" aria-hidden="true"><img src="/assets/tools/${tool.logo}" alt="" width="32" height="32" loading="eager"></span>`;
}
export function integrationStrip() {
  const group = hidden => `<ul class="integration-group" ${hidden ? 'aria-hidden="true"' : 'aria-label="Ferramentas e fontes de dados"'}>${tools.map(tool => `<li class="integration-tool" title="${escape(tool.name)}">${toolIcon(tool)}<span class="sr-only">${escape(tool.name)}</span></li>`).join('')}</ul>`;
  return `<div class="integration-strip" data-loop-animation><div class="integration-track">${group(false)}${group(true)}</div></div>`;
}
