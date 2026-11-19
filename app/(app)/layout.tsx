import Link from "next/link";
import { requireSession } from "@/lib/rbac";
import { AppNav, type NavItem } from "@/components/app-nav";
import { ROLE_LABEL } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Painel" },
  { href: "/alunos", label: "Alunos", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/matriculas", label: "Matrículas", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/turmas", label: "Turmas", roles: ["dono", "coordenacao", "secretaria", "professor"] },
  { href: "/grade-horarios", label: "Grade", roles: ["dono", "coordenacao", "secretaria", "professor"] },
  { href: "/diario", label: "Diário", roles: ["dono", "coordenacao", "professor"] },
  { href: "/presencas", label: "Presenças", roles: ["dono", "coordenacao", "professor"] },
  { href: "/materiais", label: "Materiais" },
  { href: "/provas", label: "Provas", roles: ["dono", "coordenacao", "professor"] },
  { href: "/boletins", label: "Boletins", roles: ["dono", "coordenacao", "secretaria", "professor"] },
  { href: "/contratos", label: "Contratos", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/mensalidades", label: "Mensalidades", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/inadimplencia", label: "Inadimplência", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/reposicoes", label: "Reposições", roles: ["dono", "coordenacao", "secretaria", "professor"] },
  { href: "/professores", label: "Professores", roles: ["dono", "coordenacao", "secretaria"] },
  { href: "/folha", label: "Folha", roles: ["dono", "coordenacao"] },
  { href: "/portal/aluno", label: "Portal Aluno", roles: ["aluno"] },
  { href: "/portal/professor", label: "Portal Professor", roles: ["professor"] },
  { href: "/notificacoes", label: "Notificações" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role ?? "user";
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-fg">
              JGNEXT <span className="text-brand">Escola de Idiomas</span>
            </Link>
            <div className="flex items-center gap-3 text-xs text-fg-muted">
              <span className="hidden sm:inline">{session.user?.name}</span>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand">{ROLE_LABEL[role] ?? role}</span>
              <form action="/api/auth/signout" method="post">
                <button className="rounded-md px-2 py-1 transition-colors duration-150 hover:bg-white/5 hover:text-fg">
                  Sair
                </button>
              </form>
            </div>
          </div>
          <AppNav items={NAV} role={role} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
