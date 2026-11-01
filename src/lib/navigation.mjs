const items = [
  ['Home', 'home', '/'],
  ['Sobre', 'sobre', '/sobre/'],
  ['Problema', 'problema', '/problemas/informacao-dispersa/'],
  ['Nossa solução', 'solucao', '/solucoes/'],
  ['Demonstração', 'demonstracao', '/demos/'],
  ['Serviços', 'servicos', '/servicos/']
];

export function navigationLinks(home) {
  return items.map(([label,target,destination]) => ({
    label, target, href: home ? target === 'home' ? '/' : `/#${target}` : destination
  }));
}
