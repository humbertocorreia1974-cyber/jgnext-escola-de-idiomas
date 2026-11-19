import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel do dono | JGNEXT Escola de Idiomas",
  description:
    "Consolidação multi-unidade: matrículas do mês, evasão, ocupação de turmas, receita e inadimplência por unidade.",
  openGraph: {
    title: "Painel do dono | JGNEXT Escola de Idiomas",
    description:
      "Visão executiva da rede: matrículas, evasão, ocupação e financeiro por unidade.",
    type: "website",
  },
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const pct = (n: number) => `${n.toFixed(1)}%`;

function inicioMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function fimMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function competenciaAtual(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PainelDonoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "dono") redirect("/painel-coordenacao");

  const agora = new Date();
  const inicio = inicioMes(agora);
  const fim = fimMes(agora);
  const competencia = competenciaAtual(agora);

  const unidades = await prisma.unidade.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, cidade: true, uf: true },
  });

  const [matriculasMes, matriculasAtivas, canceladasMes, turmas, mensalidadesMes, inadimplentes] =
    await Promise.all([
      prisma.matricula.findMany({
        where: { dataMatricula: { gte: inicio, lte: fim } },
        select: { id: true, turma: { select: { unidadeId: true } } },
      }),
      prisma.matricula.findMany({
        where: { status: "ativa" },
        select: { id: true, turma: { select: { unidadeId: true } } },
      }),
      prisma.matricula.count({
        where: { status: "cancelada", updatedAt: { gte: inicio, lte: fim } },
      }),
      prisma.turma.findMany({
        where: { status: { in: ["aberta", "em_andamento"] } },
        select: {
          id: true,
          capacidade: true,
          unidadeId: true,
          _count: { select: { matriculas: true } },
        },
      }),
      prisma.mensalidade.findMany({
        where: { competencia },
        select: {
          valorFinal: true,
          status: true,
          unidadeId: true,
          aluno: { select: { unidadeId: true } },
        },
      }),
      prisma.mensalidade.findMany({
        where: { status: { in: ["pendente", "atrasada"] }, vencimento: { lt: agora } },
        select: {
          valorFinal: true,
          unidadeId: true,
          aluno: { select: { unidadeId: true } },
        },
      }),
    ]);

  type Agg = {
    matriculasMes: number;
    matriculasAtivas: number;
    turmas: number;
    vagas: number;
    ocupadas: number;
    receitaPrevista: number;
    receitaRecebida: number;
    inadimplencia: number;
  };

  const agg = new Map<string, Agg>();
  for (const u of unidades) {
    agg.set(u.id, {
      matriculasMes: 0,
      matriculasAtivas: 0,
      turmas: 0,
      vagas: 0,
      ocupadas: 0,
      receitaPrevista: 0,
      receitaRecebida: 0,
      inadimplencia: 0,
    });
  }
  for (const m of matriculasMes) {
    const a = agg.get(m.turma.unidadeId);
    if (a) a.matriculasMes += 1;
  }
  for (const m of matriculasAtivas) {
    const a = agg.get(m.turma.unidadeId);
    if (a) a.matriculasAtivas += 1;
  }
  for (const t of turmas) {
    const a = agg.get(t.unidadeId);
    if (!a) continue;
    a.turmas += 1;
    a.vagas += t.capacidade;
    a.ocupadas += t._count.matriculas;
  }
  for (const m of mensalidadesMes) {
    const uid = m.unidadeId ?? m.aluno.unidadeId ?? "";
    const a = agg.get(uid);
    if (!a) continue;
    const v = Number(m.valorFinal);
    a.receitaPrevista += v;
    if (m.status === "paga") a.receitaRecebida += v;
  }
  for (const m of inadimplentes) {
    const uid = m.unidadeId ?? m.aluno.unidadeId ?? "";
    const a = agg.get(uid);
    if (a) a.inadimplencia += Number(m.valorFinal);
  }

  const linhas = unidades.map((u) => {
    const a = agg.get(u.id)!;
    return {
      ...u,
      ...a,
      ocupacao: a.vagas > 0 ? (a.ocupadas / a.vagas) * 100 : 0,
    };
  });

  const totalAtivas = linhas.reduce((s, l) => s + l.matriculasAtivas, 0);
  const evasao = totalAtivas > 0 ? (canceladasMes / totalAtivas) * 100 : 0;

  const totais = linhas.reduce(
    (s, l) => ({
      matriculasMes: s.matriculasMes + l.matriculasMes,
      matriculasAtivas: s.matriculasAtivas + l.matriculasAtivas,
      turmas: s.turmas + l.turmas,
      vagas: s.vagas + l.vagas,
      ocupadas: s.ocupadas + l.ocupadas,
      receitaPrevista: s.receitaPrevista + l.receitaPrevista,
      receitaRecebida: s.receitaRecebida + l.receitaRecebida,
      inadimplencia: s.inadimplencia + l.inadimplencia,
    }),
    {
      matriculasMes: 0,
      matriculasAtivas: 0,
      turmas: 0,
      vagas: 0,
      ocupadas: 0,
      receitaPrevista: 0,
      receitaRecebida: 0,
      inadimplencia: 0,
    },
  );

  const ocupacaoTotal = totais.vagas > 0 ? (totais.ocupadas / totais.vagas) * 100 : 0;

  const kpis = [
    { label: "Matrículas no mês", value: String(totais.matriculasMes), hint: `Competência ${competencia}` },
    { label: "Alunos ativos", value: String(totais.matriculasAtivas), hint: `${totais.turmas} turmas em operação` },
    { label: "Ocupação média", value: pct(ocupacaoTotal), hint: `${totais.ocupadas} de ${totais.vagas} vagas` },
    { label: "Evasão no mês", value: pct(evasao), hint: `${canceladasMes} cancelamentos` },
    { label: "Receita recebida", value: brl(totais.receitaRecebida), hint: `Previsto ${brl(totais.receitaPrevista)}` },
    { label: "Inadimplência", value: brl(totais.inadimplencia), hint: "Vencidas e em aberto" },
  ];

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">Painel executivo</p>
            <h1 className="mt-1 text-3xl font-semibold">Painel do dono</h1>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">
              Visão consolidada da rede — matrículas, evasão, ocupação e financeiro por unidade.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/painel-coordenacao">
              <Button variant="secondary" size="md">Painel da coordenação</Button>
            </Link>
            <Link href="/inadimplencia">
              <Button variant="primary" size="md">Ver inadimplência</Button>
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardBody>
                <p className="text-xs uppercase tracking-wider text-fg-muted">{k.label}</p>
                <p className="mt-2 text-2xl font-semibold text-fg">{k.value}</p>
                <p className="mt-1 text-xs text-fg-muted">{k.hint}</p>
              </CardBody>
            </Card>
          ))}
        </section>

        <section className="mt-10">
          <Card>
            <CardBody>
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Desempenho por unidade</CardTitle>
                <span className="text-xs text-fg-muted">Competência {competencia}</span>
              </div>

              {linhas.length === 0 ? (
                <div className="rounded-md border border-border bg-surface/60 p-8 text-center">
                  <p className="text-sm text-fg-muted">
                    Nenhuma unidade ativa cadastrada ainda.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Link href="/unidades">
                      <Button variant="primary" size="sm">Cadastrar primeira unidade</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-fg-muted">
                        <th className="py-3 pr-4 font-medium">Unidade</th>
                        <th className="py-3 pr-4 font-medium">Matrículas/mês</th>
                        <th className="py-3 pr-4 font-medium">Ativos</th>
                        <th className="py-3 pr-4 font-medium">Turmas</th>
                        <th className="py-3 pr-4 font-medium">Ocupação</th>
                        <th className="py-3 pr-4 font-medium">Receita recebida</th>
                        <th className="py-3 pr-4 font-medium">Inadimplência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr
                          key={l.unidadeId}
                          className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                        >
                          <td className="py-3 pr-4">
                            <div className="font-medium text-fg">{l.nome}</div>
                            <div className="text-xs text-fg-muted">
                              {[l.cidade, l.uf].filter(Boolean).join(" · ") || "—"}
                            </div>
                          </td>
                          <td className="py-3 pr-4">{l.matriculasMes}</td>
                          <td className="py-3 pr-4">{l.matriculasAtivas}</td>
                          <td className="py-3 pr-4">{l.turmas}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
                                <div
                                  className="h-full bg-brand"
                                  style={{ width: `${Math.min(100, l.ocupacao)}%` }}
                                />
                              </div>
                              <span className="text-xs text-fg-muted">{pct(l.ocupacao)}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">{brl(l.receitaRecebida)}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                l.inadimplencia > 0
                                  ? "rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                                  : "rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand"
                              }
                            >
                              {brl(l.inadimplencia)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link href="/matriculas" className="block">
            <Card>
              <CardBody>
                <CardTitle>Matrículas</CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Acompanhe novas matrículas, trancamentos e cancelamentos.
                </p>
              </CardBody>
            </Card>
          </Link>
          <Link href="/mensalidades" className="block">
            <Card>
              <CardBody>
                <CardTitle>Mensalidades</CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Gere a competência e acompanhe pagamentos por unidade.
                </p>
              </CardBody>
            </Card>
          </Link>
          <Link href="/carga-horaria-folha" className="block">
            <Card>
              <CardBody>
                <CardTitle>Carga horária e folha</CardTitle>
                <p className="mt-2 text-sm text-fg-muted">
                  Consolide horas dos professores e feche a folha do mês.
                </p>
              </CardBody>
            </Card>
          </Link>
        </section>
      </div>
    </main>
  );
}
