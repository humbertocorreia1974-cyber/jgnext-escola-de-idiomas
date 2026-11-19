import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CalendarDays, Filter, Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grade de horários | JGNEXT Escola de Idiomas",
  description:
    "Visualize a grade semanal de aulas por unidade, professor e dia da semana em todas as turmas da escola.",
  openGraph: {
    title: "Grade de horários | JGNEXT Escola de Idiomas",
    description:
      "Grade semanal consolidada de turmas, professores e salas por unidade.",
  },
};

const DIAS = [
  { valor: 0, label: "Domingo", curto: "Dom" },
  { valor: 1, label: "Segunda", curto: "Seg" },
  { valor: 2, label: "Terça", curto: "Ter" },
  { valor: 3, label: "Quarta", curto: "Qua" },
  { valor: 4, label: "Quinta", curto: "Qui" },
  { valor: 5, label: "Sexta", curto: "Sex" },
  { valor: 6, label: "Sábado", curto: "Sáb" },
];

type SearchParams = Promise<{
  unidadeId?: string;
  professorId?: string;
  diaSemana?: string;
}>;

export default async function GradeHorariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "user";
  if (!["dono", "coordenacao", "secretaria", "professor"].includes(role)) {
    redirect("/");
  }

  const sp = await searchParams;
  const unidadeId = sp.unidadeId || undefined;
  const professorId = sp.professorId || undefined;
  const diaFiltro =
    sp.diaSemana !== undefined && sp.diaSemana !== ""
      ? Number(sp.diaSemana)
      : undefined;

  const where: Record<string, unknown> = {};
  if (unidadeId) where.unidadeId = unidadeId;
  if (professorId) where.professorId = professorId;
  if (typeof diaFiltro === "number" && !Number.isNaN(diaFiltro)) {
    where.horarios = { some: { diaSemana: diaFiltro } };
  }

  const [unidades, professores, turmas] = await Promise.all([
    prisma.unidade.findMany({
      where: { ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.professor.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.turma.findMany({
      where,
      include: {
        curso: { select: { nome: true, idioma: true } },
        nivel: { select: { nome: true } },
        unidade: { select: { nome: true } },
        professor: { select: { nome: true } },
        horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
        _count: { select: { matriculas: true } },
      },
      orderBy: [{ codigo: "asc" }],
    }),
  ]);

  const porDia = new Map<number, typeof turmas>();
  for (const d of DIAS) porDia.set(d.valor, []);
  for (const t of turmas) {
    for (const h of t.horarios) {
      const arr = porDia.get(h.diaSemana);
      if (arr) arr.push(t);
    }
  }

  const temFiltro = Boolean(unidadeId || professorId || diaFiltro !== undefined);
  const diasVisiveis =
    diaFiltro !== undefined && !Number.isNaN(diaFiltro)
      ? DIAS.filter((d) => d.valor === diaFiltro)
      : DIAS;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-fg-muted">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <span className="text-xs uppercase tracking-wide">Acadêmico</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-fg">
            Grade de horários
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Visão semanal consolidada de turmas, professores e salas.
          </p>
        </div>
        <Link href="/turmas">
          <Button variant="primary" size="md">
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Nova turma
          </Button>
        </Link>
      </header>

      <Card className="mb-6">
        <CardBody>
          <form
            method="GET"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-fg-muted">Unidade</span>
              <select
                name="unidadeId"
                defaultValue={unidadeId ?? ""}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-fg-muted">Professor</span>
              <select
                name="professorId"
                defaultValue={professorId ?? ""}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="">Todos</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-fg-muted">Dia da semana</span>
              <select
                name="diaSemana"
                defaultValue={
                  diaFiltro !== undefined && !Number.isNaN(diaFiltro)
                    ? String(diaFiltro)
                    : ""
                }
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              >
                <option value="">Todos os dias</option>
                {DIAS.map((d) => (
                  <option key={d.valor} value={d.valor}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit" variant="primary" size="md">
                <Filter className="mr-2 h-4 w-4" aria-hidden />
                Filtrar
              </Button>
              {temFiltro ? (
                <Link
                  href="/grade-horarios"
                  className="text-sm text-fg-muted underline-offset-4 transition-colors duration-150 hover:text-fg hover:underline"
                >
                  Limpar
                </Link>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      {turmas.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <CalendarDays className="h-10 w-10 text-fg-muted" aria-hidden />
            <CardTitle>Nenhuma turma encontrada</CardTitle>
            <p className="max-w-md text-sm text-fg-muted">
              Ajuste os filtros ou cadastre uma nova turma com horários para
              começar a montar a grade semanal.
            </p>
            <Link href="/turmas">
              <Button variant="primary" size="md">
                Cadastrar turma
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {diasVisiveis.map((dia) => {
            const lista = porDia.get(dia.valor) ?? [];
            return (
              <Card key={dia.valor} className="backdrop-blur-sm">
                <CardBody>
                  <div className="mb-3 flex items-center justify-between">
                    <CardTitle>{dia.label}</CardTitle>
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                      {lista.length} aula{lista.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {lista.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-fg-muted">
                      Sem aulas neste dia.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {lista.map((t) => {
                        const hs = t.horarios.filter(
                          (h) => h.diaSemana === dia.valor,
                        );
                        const faixa = hs
                          .map((h) => `${h.horaInicio}–${h.horaFim}`)
                          .join(" · ");
                        const sala = hs.find((h) => h.sala)?.sala;
                        return (
                          <li
                            key={`${t.id}-${dia.valor}`}
                            className="rounded-md border border-border bg-surface/70 px-3 py-2 transition-colors duration-150 hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-fg">
                                {t.codigo} · {t.curso.nome}
                              </span>
                              <span className="text-xs text-fg-muted">
                                {t.nivel.nome}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-fg-muted">
                              {faixa || "Horário a definir"}
                              {sala ? ` · Sala ${sala}` : ""}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                              <span>{t.unidade.nome}</span>
                              <span>
                                {t.professor?.nome ?? "Sem professor"}
                              </span>
                              <span>
                                {t._count.matriculas}/{t.capacidade} alunos
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
