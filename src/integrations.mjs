import { escape } from './components.mjs';
const tools = [
 { name: 'Power BI', asset: 'integration-0.svg' },
 { name: 'Microsoft', logo: 'microsoft.svg' },
 { name: 'Azure', asset: 'integration-4.png' },
 { name: 'Python', asset: 'integration-1.svg' }
];
function toolIcon(tool) {
 const source = tool.asset ? '/assets/figma/' + tool.asset : '/assets/tools/' + tool.logo;
 return '<span class="integration-icon '+(tool.asset ? 'integration-icon--crop' : 'integration-icon--logo')+'" aria-hidden="true"><img src="'+source+'" alt="" width="32" height="32" loading="eager"></span>';
}
export function integrationStrip() {
 return '<div class="integration-strip integration-strip--selector" data-tool-selector><ul class="integration-group" aria-label="Ferramentas e fontes de dados">'+tools.map((tool,index)=>'<li class="integration-tool'+(index===0?' is-active':'')+'" aria-label="'+escape(tool.name)+'">'+toolIcon(tool)+'<span class="integration-name" aria-hidden="true"><span>'+escape(tool.name)+'</span></span></li>').join('')+'</ul></div>';
}
