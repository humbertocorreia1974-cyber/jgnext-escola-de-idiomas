import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  const { to, mensagem } = (await request.json()) as {
    to?: string;
    mensagem?: string;
  };
  if (!to || !mensagem) {
    return NextResponse.json(
      { error: "to e mensagem são obrigatórios" },
      { status: 400 }
    );
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneId || !token) {
    return NextResponse.json(
      { error: "WhatsApp não configurado (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN)" },
      { status: 500 }
    );
  }

  const numero = to.replace(/\D/g, "");
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "text",
        text: { body: mensagem },
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "falha ao enviar", detalhe: data },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, data });
}
