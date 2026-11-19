import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CobrancaActions } from "./cobranca-actions-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inadimplência | JGNEXT Escola de Idiomas",
  description:
    "Acompanhe mensalidades em atraso por unidade e competência, dispare régua de cobrança e registre negociações.",
  openGraph: {
    title: "Inadimplência | JGNEXT",
    description: "Régua de cobrança e gestão de inadimplência por unidade.",
  },
};

type SearchParams = {
  unidadeId?: string;
  competencia?: string;
  faixa?: string;
};

function diasAtraso(venc: Date) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(venc);
  d.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((hoje.getTime() - d.getTime()) / 86400000));
}

function faixaMatch(dias: number, faixa?: string) {
  if (!faixa || faixa === "todas") return true;
  if (faixa === "1-15") return dias >= 1 && dias <= 15;
  if (faixa === "16-30") return dias >= 16 && dias <= 30;
  if (faixa === "31-60") return dias >= 31 && dias <= 60;
  if (faixa === "60+") return dias > 60;
  return true;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (!["dono", "coordenacao", "secretaria"].includes(role ?? "")) {
    redirect("/painel-dono");
  }

  const sp = await searchParams;
  const hoje = new Date();

  const where: Record<string, unknown> = {
    status: { in: ["pendente", "atrasada"] },
    vencimento: { lt: hoje },
  };
  if (sp.unidadeId) where.unidadeId = sp.unidadeId;
  if (sp.competencia) where.competencia = sp.competencia;

  const [mensalidades, unidades, competenciasRaw] = await Promise.all([
    prisma.mensalidade.findMany({
      where,
      orderBy: { vencimento: "asc" },
      take: 300,
      include: {
        aluno: { select: { id: true, nome: true, telefone: true, email: true } },
        unidade: { select: { id: true, nome: true } },
      },
    }),
    prisma.unidade.findMany({
      where: { ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.mensalidade.findMany({
      distinct: ["competencia"],
      select: { competencia: true },
      orderBy: { competencia: "desc" },
      take: 24,
    }),
  ]);

  const filtradas = mensalidades.filter((m) =>
    faixaMatch(diasAtraso(m.vencimento), sp.faixa)
  );

  const totalAberto = filtradas.reduce(
    (acc, m) => acc + Number(m.valorFinal),
    0
  );
  const ticketMedio = filtradas.length ? totalAberto / filtradas.length : 0;
  const maiorAtraso = filtradas.reduce(
    (acc, m) => Math.max(acc, diasAtraso(m.vencimento)),
    0
  );

  const kpis = [
    { label: "Total em atraso", value: totalAberto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    { label: "Mensalidades", value: String(filtradas.length) },
    { label: "Ticket médio", value: ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
    { label: "Maior atraso", value: `${maiorAtraso} dias` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Inadimplência</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Régua de cobrança por unidade e competência. Dispare WhatsApp, registre
            negociações e acompanhe a recuperação.
          </p>
        </div>
        <Link href="/mensalidades">
          <Button variant="secondary" size="sm">
            Ver todas as mensalidades
          </Button>
        </Link>
      </header>

      <form
        method="GET"
        className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface/70 p-4 backdrop-blur-sm sm:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          Unidade
          <select
            name="unidadeId"
            defaultValue={sp.unidadeId ?? ""}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="">Todas</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          Competência
          <select
            name="competencia"
            defaultValue={sp.competencia ?? ""}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="">Todas</option>
            {competenciasRaw.map((c) => (
              <option key={c.competencia} value={c.competencia}>
                {c.competencia}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-fg-muted">
          Faixa de atraso
          <select
            name="faixa"
            defaultValue={sp.faixa ?? "todas"}
            className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg"
          >
            <option value="todas">Todas</option>
            <option value="1-15">1 a 15 dias</option>
            <option value="16-30">16 a 30 dias</option>
            <option value="31-60">31 a 60 dias</option>
            <option value="60+">Mais de 60 dias</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" size="sm" className="w-full">
            Filtrar
          </Button>
        </div>
      </form>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardBody>
              <p className="text-xs uppercase tracking-wide text-fg-muted">
                {k.label}
              </p>
              <p className="mt-1 text-xl font-semibold text-fg">{k.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <CardTitle>Mensalidades em atraso</CardTitle>
          {filtradas.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-border p-8 text-center">
              <p className="text-sm text-fg-muted">
                Nenhuma mensalidade em atraso com esses filtros. Sua régua está em dia.
              </p>
              <Link href="/mensalidades" className="mt-3 inline-block">
                <Button size="sm" variant="secondary">
                  Ver mensalidades
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th className="py-2 pr-3">Aluno</th>
                    <th className="py-2 pr-3">Unidade</th>
                    <th className="py-2 pr-3">Competência</th>
                    <th className="py-2 pr-3">Vencimento</th>
                    <th className="py-2 pr-3">Atraso</th>
                    <th className="py-2 pr-3 text-right">Valor</th>
                    <th className="py-2 pr-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((m) => {
                    const dias = diasAtraso(m.vencimento);
                    const badge =
                      dias > 60
                        ? "bg-red-500/10 text-red-500"
                        : dias > 30
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-brand/10 text-brand";
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-border/60 transition-colors duration-150 hover:bg-white/5"
                      >
                        <td className="py-3 pr-3">
                          <div className="font-medium text-fg">{m.aluno.nome}</div>
                          <div className="text-xs text-fg-muted">
                            {m.aluno.telefone ?? m.aluno.email ?? "sem contato"}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-fg-muted">
                          {m.unidade?.nome ?? "—"}
                        </td>
                        <td className="py-3 pr-3 text-fg-muted">{m.competencia}</td>
                        <td className="py-3 pr-3 text-fg-muted">
                          {new Date(m.vencimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${badge}`}
                          >
                            {dias} dias
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-right font-medium text-fg">
                          {Number(m.valorFinal).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </td>
                        <td className="py-3 pr-3">
                          <CobrancaActions
                            mensalidadeId={m.id}
                            alunoNome={m.aluno.nome}
                            telefone={m.aluno.telefone ?? null}
                            valor={Number(m.valorFinal)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
