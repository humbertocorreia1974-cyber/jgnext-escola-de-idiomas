import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!["dono", "coordenacao", "secretaria"].includes(role ?? "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    mensalidadeId: string;
    valor: number;
    metodo?: string;
    status?: string;
    referencia?: string;
  };

  if (!body.mensalidadeId || typeof body.valor !== "number") {
    return NextResponse.json(
      { error: "mensalidadeId e valor são obrigatórios" },
      { status: 400 }
    );
  }

  const mensalidade = await prisma.mensalidade.findUnique({
    where: { id: body.mensalidadeId },
  });
  if (!mensalidade) {
    return NextResponse.json(
      { error: "mensalidade não encontrada" },
      { status: 404 }
    );
  }

  const pagamento = await prisma.$transaction(async (tx) => {
    const p = await tx.pagamento.create({
      data: {
        mensalidadeId: mensalidade.id,
        alunoId: mensalidade.alunoId,
        valor: body.valor,
        metodo: body.metodo ?? "pix",
        status: body.status ?? "confirmado",
        referencia: body.referencia,
        registradoPorId: session.user.id,
        pagoEm: new Date(),
      },
    });
    if ((body.status ?? "confirmado") === "confirmado") {
      await tx.mensalidade.update({
        where: { id: mensalidade.id },
        data: { status: "paga", pagoEm: new Date() },
      });
    }
    return p;
  });

  return NextResponse.json({ pagamento }, { status: 201 });
}
