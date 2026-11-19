import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { GerarBoletinsClient } from "./gerar-boletins-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Boletins | JGNEXT Escola de Idiomas",
  description: "Emissão e consulta de boletins com média ponderada e frequência por aluno.",
  openGraph: { title: "Boletins | JGNEXT", description: "Boletins com média e frequência." },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { periodo } = await searchParams;

  const boletins = await prisma.boletim.findMany({
    where: periodo ? { periodo } : undefined,
    include: { aluno: true, matricula: { include: { turma: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const corSituacao = (s: string) =>
    s === "aprovado" ? "bg-brand/10 text-brand" : s === "reprovado" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-fg">Boletins</h1>
          <p className="text-sm text-fg-muted">Média ponderada e frequência calculadas a partir de notas e presenças.</p>
        </div>
        <form className="flex items-end gap-2" action="/boletins">
          <input
            name="periodo"
            defaultValue={periodo ?? ""}
            placeholder="2025-06"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg"
          />
          <button className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg hover:bg-white/5">
            Filtrar
          </button>
        </form>
      </header>

      <Card>
        <CardBody>
          <CardTitle className="mb-3">Gerar boletins em lote</CardTitle>
          <GerarBoletinsClient />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {boletins.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-fg-muted">Nenhum boletim emitido ainda.</p>
              <p className="mt-1 text-sm text-fg-muted">Use o gerador acima para emitir os boletins do período.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="py-2">Aluno</th>
                  <th>Turma</th>
                  <th>Período</th>
                  <th>Média</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {boletins.map((b) => (
                  <tr key={b.id} className="border-t border-border transition-colors hover:bg-white/5">
                    <td className="py-2 text-fg">{b.aluno.nome}</td>
                    <td className="text-fg-muted">{b.matricula.turma.nome}</td>
                    <td className="text-fg-muted">{b.periodo}</td>
                    <td className="text-fg">{b.mediaFinal?.toFixed(2) ?? "—"}</td>
                    <td className="text-fg">{b.frequencia?.toFixed(1) ?? "—"}%</td>
                    <td>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${corSituacao(b.situacao)}`}>{b.situacao}</span>
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
