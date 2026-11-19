import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { id } = await params;
  const contrato = await prisma.contrato.update({
    where: { id },
    data: { aceitoEm: new Date(), status: "ativo" },
  });
  return NextResponse.json(contrato);
}
