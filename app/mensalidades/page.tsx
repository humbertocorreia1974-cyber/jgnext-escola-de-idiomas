import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { GerarMensalidadesClient } from "./gerar-mensalidades-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mensalidades | JGNEXT Escola de Idiomas",
  description: "Geração e acompanhamento de mensalidades por competência.",
  openGraph: { title: "Mensalidades | JGNEXT", description: "Mensalidades por competência." },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ competencia?: string; status?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { competencia, status } = await searchParams;

  const mensalidades = await prisma.mensalidade.findMany({
    where: {
      ...(competencia ? { competencia } : {}),
      ...(status ? { status } : {}),
    },
    include: { aluno: true, unidade: true },
    orderBy: { vencimento: "desc" },
    take: 300,
  });

  const corStatus = (s: string) =>
    s === "paga" ? "bg-brand/10 text-brand" : s === "atrasada" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Mensalidades</h1>
          <p className="text-sm text-fg-muted">Geração por competência e acompanhamento de pagamentos.</p>
        </div>
        <form className="flex items-end gap-2" action="/mensalidades">
          <input
            name="competencia"
            defaultValue={competencia ?? ""}
            placeholder="2025-06"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          />
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="atrasada">Atrasada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <button className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-white/5">
            Filtrar
          </button>
        </form>
      </header>

      <Card>
        <CardBody>
          <CardTitle className="mb-3">Gerar em lote</CardTitle>
          <GerarMensalidadesClient />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {mensalidades.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-fg-muted">Nenhuma mensalidade encontrada.</p>
              <p className="mt-1 text-sm text-fg-muted">Gere as mensalidades da competência acima.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="py-2">Aluno</th>
                  <th>Unidade</th>
                  <th>Competência</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mensalidades.map((m) => (
                  <tr key={m.id} className="border-t border-border transition-colors hover:bg-white/5">
                    <td className="py-2 text-fg">{m.aluno.nome}</td>
                    <td className="text-fg-muted">{m.unidade?.nome ?? "—"}</td>
                    <td className="text-fg-muted">{m.competencia}</td>
                    <td className="text-fg">R$ {Number(m.valorFinal).toFixed(2)}</td>
                    <td className="text-fg-muted">{new Date(m.vencimento).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${corStatus(m.status)}`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
