import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://exemplo.com';
  const routes = ["/","/painel-dono","/painel-coordenacao","/notificacoes","/alunos","/matriculas","/turmas","/grade-horarios","/diario-classe","/presencas","/materiais","/provas","/boletins","/contratos","/mensalidades","/inadimplencia","/reposicao-de-aulas","/professores","/professores/novo","/carga-horaria"];
  return routes.map((r) => ({ url: base + (r === '/' ? '' : r), lastModified: new Date(), changeFrequency: 'weekly' as const, priority: r === '/' ? 1 : 0.6 }));
}
