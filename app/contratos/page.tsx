import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { AssinarContratoClient } from "./assinar-contrato-client";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Contratos | JGNEXT Escola de Idiomas",
  description: "Gestão de contratos de matrícula com assinatura digital e vínculo financeiro.",
  openGraph: { title: "Contratos | JGNEXT", description: "Contratos de matrícula." },
};

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const contratos = await prisma.contrato.findMany({
    include: { aluno: true, curso: true, unidade: true, matricula: { include: { turma: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-fg">Contratos</h1>
        <p className="text-sm text-fg-muted">Contratos vinculados às matrículas, com status de assinatura.</p>
      </header>

      <Card>
        <CardBody>
          {contratos.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-fg-muted">Nenhum contrato cadastrado.</p>
              <p className="mt-1 text-sm text-fg-muted">Crie um contrato a partir de uma matrícula ativa.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-fg-muted">
                <tr>
                  <th className="py-2">Número</th>
                  <th>Aluno</th>
                  <th>Curso</th>
                  <th>Unidade</th>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-t border-border transition-colors hover:bg-white/5">
                    <td className="py-2 font-mono text-xs text-fg">{c.numero}</td>
                    <td className="text-fg">{c.aluno.nome}</td>
                    <td className="text-fg-muted">{c.curso.nome}</td>
                    <td className="text-fg-muted">{c.unidade.nome}</td>
                    <td className="text-fg">R$ {Number(c.valorTotal).toFixed(2)}</td>
                    <td className="text-fg-muted">{c.parcelas}x</td>
                    <td>
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{c.status}</span>
                    </td>
                    <td className="text-right">
                      <AssinarContratoClient contratoId={c.id} aceito={!!c.aceitoEm} />
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
