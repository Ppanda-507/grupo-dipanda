import { escape } from './index.mjs';
const tools = [
 { name: 'Power BI', logo: 'power-bi-figma.png' },
 { name: 'Microsoft', logo: 'microsoft.svg' },
 { name: 'Azure', logo: 'azure-figma.png' },
 { name: 'Python', logo: 'python-figma.png' }
];
function toolIcon(tool) {
 const source = tool.asset ? '/assets/figma/' + tool.asset : '/assets/tools/' + tool.logo;
 return '<span class="integration-icon '+(tool.asset ? 'integration-icon--crop' : 'integration-icon--logo')+'" aria-hidden="true"><img src="'+source+'" alt="" width="32" height="32" loading="eager"></span>';
}
export function integrationStrip() {
 const card = tool => '<span class="tool-card">'+toolIcon(tool)+'<span>'+escape(tool.name)+'</span></span>';
 return '<div class="tools-marquee" data-tool-marquee role="img" aria-label="Ferramentas: Power BI, Microsoft, Azure e Python">'+[0,1].map(row => {
  const ordered = row ? [...tools].reverse() : tools;
  const group = '<div class="tools-marquee-group">'+[0,1].map(()=>ordered.map(card).join('')).join('')+'</div>';
  return '<div class="tools-marquee-row'+(row ? ' tools-marquee-row--reverse' : '')+'" aria-hidden="true"><div class="tools-marquee-track">'+group+group+'</div></div>';
 }).join('')+'</div>';
}

export function biToolsMarquee() {
 const pill = tool => '<span class="demo-tool-pill">'+toolIcon(tool)+'<span>'+escape(tool.name)+'</span></span>';
 return '<div class="demo-tools-marquee" data-loop-animation role="img" aria-label="Power BI, Microsoft, Azure e Python">'+[0,1].map(row=>'<div class="demo-tools-row demo-tools-row--'+row+'" aria-hidden="true"><div class="demo-tools-track">'+[0,1].map(()=>'<div class="demo-tools-group">'+Array.from({length:2},()=> (row ? [...tools].reverse() : tools).map(pill).join('')).join('')+'</div>').join('')+'</div></div>').join('')+'</div>';
}
