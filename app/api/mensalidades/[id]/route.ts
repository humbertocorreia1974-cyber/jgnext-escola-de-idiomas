import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_VALIDOS = [
  "pendente",
  "paga",
  "atrasada",
  "cancelada",
  "negociada",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!["dono", "coordenacao", "secretaria"].includes(role ?? "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    desconto?: number;
    observacoes?: string;
  };

  const data: Record<string, unknown> = {};
  if (body.status) {
    if (!STATUS_VALIDOS.includes(body.status)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "paga") data.pagoEm = new Date();
  }
  if (typeof body.desconto === "number") data.desconto = body.desconto;

  const mensalidade = await prisma.mensalidade.update({
    where: { id },
    data,
  });

  return NextResponse.json({ mensalidade });
}
