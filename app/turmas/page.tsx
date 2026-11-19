import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Users, Calendar, Plus, Filter } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TurmaFormClient } from "./turma-form-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Turmas | JGNEXT Escola de Idiomas",
  description:
    "Gerencie turmas por curso, nível, unidade e professor, com ocupação em tempo real.",
  openGraph: {
    title: "Turmas | JGNEXT Escola de Idiomas",
    description:
      "Gerencie turmas por curso, nível, unidade e professor, com ocupação em tempo real.",
  },
};

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  aberta: "bg-brand/10 text-brand",
  em_andamento: "bg-accent/10 text-accent",
  encerrada: "bg-fg-muted/10 text-fg-muted",
  cancelada: "bg-red-500/10 text-red-500",
};

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: { unidadeId?: string; cursoId?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role as string | undefined;
  const podeEditar = ["dono", "coordenacao", "secretaria"].includes(role ?? "");

  const where: Record<string, unknown> = {};
  if (searchParams.unidadeId) where.unidadeId = searchParams.unidadeId;
  if (searchParams.cursoId) where.cursoId = searchParams.cursoId;
  if (searchParams.status) where.status = searchParams.status;

  const [turmas, unidades, cursos] = await Promise.all([
    prisma.turma.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        curso: true,
        nivel: true,
        unidade: true,
        professor: true,
        horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
        _count: { select: { matriculas: true } },
      },
    }),
    prisma.unidade.findMany({ where: { ativa: true }, orderBy: { nome: "asc" } }),
    prisma.curso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Turmas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {turmas.length} turma{turmas.length === 1 ? "" : "s"} encontradas
          </p>
        </div>
        {podeEditar && (
          <TurmaFormClient
            mode="create"
            unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
            cursos={cursos.map((c) => ({ id: c.id, nome: c.nome }))}
            trigger={
              <Button variant="primary" size="md">
                <Plus className="mr-2 h-4 w-4" /> Nova turma
              </Button>
            }
          />
        )}
      </header>

      <Card className="mb-6">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="flex items-center gap-2 text-fg-muted">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filtros</span>
            </div>
            <label className="flex flex-col text-xs text-fg-muted">
              Unidade
              <select
                name="unidadeId"
                defaultValue={searchParams.unidadeId ?? ""}
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Curso
              <select
                name="cursoId"
                defaultValue={searchParams.cursoId ?? ""}
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todos</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-xs text-fg-muted">
              Status
              <select
                name="status"
                defaultValue={searchParams.status ?? ""}
                className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
              >
                <option value="">Todos</option>
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em andamento</option>
                <option value="encerrada">Encerrada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            <Button type="submit" variant="secondary" size="md">
              Aplicar
            </Button>
            <Link
              href="/turmas"
              className="text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Limpar
            </Link>
          </form>
        </CardBody>
      </Card>

      {turmas.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-fg-muted" />
            <CardTitle>Nenhuma turma encontrada</CardTitle>
            <p className="max-w-md text-sm text-fg-muted">
              Ajuste os filtros ou crie a primeira turma para começar a receber
              matrículas.
            </p>
            {podeEditar && (
              <TurmaFormClient
                mode="create"
                unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
                cursos={cursos.map((c) => ({ id: c.id, nome: c.nome }))}
                trigger={
                  <Button variant="primary" size="md">
                    <Plus className="mr-2 h-4 w-4" /> Criar turma
                  </Button>
                }
              />
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {turmas.map((t) => {
            const ocupacao = t._count.matriculas;
            const pct = t.capacidade > 0 ? Math.round((ocupacao / t.capacidade) * 100) : 0;
            return (
              <Card key={t.id} className="transition-all duration-150 hover:bg-white/5">
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-fg-muted">
                        {t.codigo}
                      </p>
                      <CardTitle className="mt-1">{t.nome}</CardTitle>
                      <p className="mt-1 text-sm text-fg-muted">
                        {t.curso.nome} · {t.nivel.nome}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        STATUS_CLASS[t.status] ?? "bg-fg-muted/10 text-fg-muted"
                      }`}
                    >
                      {STATUS_LABEL[t.status] ?? t.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-fg-muted">
                    <span>{t.unidade.nome}</span>
                    <span>·</span>
                    <span>{t.professor?.nome ?? "Sem professor"}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-fg-muted">
                      <span>
                        Ocupação {ocupacao}/{t.capacidade}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {t.horarios.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.horarios.slice(0, 4).map((h) => (
                        <span
                          key={h.id}
                          className="rounded-md border border-border bg-surface/70 px-2 py-0.5 text-xs text-fg-muted"
                        >
                          {dias[h.diaSemana]} {h.horaInicio}-{h.horaFim}
                        </span>
                      ))}
                      {t.horarios.length > 4 && (
                        <span className="text-xs text-fg-muted">
                          +{t.horarios.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-between">
                    <Link
                      href={`/grade-horarios?turmaId=${t.id}`}
                      className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Ver grade
                    </Link>
                    {podeEditar && (
                      <TurmaFormClient
                        mode="edit"
                        turma={{
                          id: t.id,
                          codigo: t.codigo,
                          nome: t.nome,
                          cursoId: t.cursoId,
                          nivelId: t.nivelId,
                          unidadeId: t.unidadeId,
                          professorId: t.professorId ?? "",
                          capacidade: t.capacidade,
                          status: t.status,
                        }}
                        unidades={unidades.map((u) => ({ id: u.id, nome: u.nome }))}
                        cursos={cursos.map((c) => ({ id: c.id, nome: c.nome }))}
                        trigger={
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        }
                      />
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
