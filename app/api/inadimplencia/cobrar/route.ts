import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["dono", "coordenacao", "secretaria"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  const { mensalidadeIds } = await req.json();
  if (!Array.isArray(mensalidadeIds) || mensalidadeIds.length === 0) {
    return NextResponse.json({ error: "Selecione mensalidades" }, { status: 400 });
  }

  const mensalidades = await prisma.mensalidade.findMany({
    where: { id: { in: mensalidadeIds } },
    include: { aluno: { include: { user: { select: { id: true, name: true, email: true, image: true } } } } },
  });

  let enviados = 0;
  for (const m of mensalidades) {
    const email = m.aluno.email ?? m.aluno.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: `Cobrança pendente — competência ${m.competencia}`,
        html: `<p>Olá ${m.aluno.nome},</p><p>Identificamos uma mensalidade em aberto no valor de <strong>R$ ${Number(m.valorFinal).toFixed(2)}</strong>, com vencimento em ${new Date(m.vencimento).toLocaleDateString("pt-BR")}.</p><p>Por favor, regularize o pagamento.</p>`,
      });
      enviados++;
    }
    await prisma.notificacao.create({
      data: {
        userId: m.aluno.userId ?? session.user.id,
        titulo: "Mensalidade em atraso",
        mensagem: `Mensalidade ${m.competencia} em aberto no valor de R$ ${Number(m.valorFinal).toFixed(2)}.`,
        tipo: "cobranca",
        canal: "email",
      },
    });
  }
  return NextResponse.json({ ok: true, enviados });
}
