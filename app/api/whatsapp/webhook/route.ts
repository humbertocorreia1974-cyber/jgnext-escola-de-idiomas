import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "jgext-verify";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        entry?: Array<{
          changes?: Array<{
            value?: {
              messages?: Array<{
                from?: string;
                text?: { body?: string };
              }>;
            };
          }>;
        }>;
      }
    | null;

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const from = msg?.from;
  const texto = msg?.text?.body ?? "";

  if (from && phoneId && token) {
    const resposta =
      "Olá! Recebemos sua mensagem na JGNEXT Escola de Idiomas. " +
      "Para 2ª via de boleto, notas ou frequência, acesse o Portal do Aluno. " +
      "Um atendente responderá em breve.";

    await fetch(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: { body: resposta },
        }),
      }
    ).catch(() => null);

    void texto;
  }

  return NextResponse.json({ ok: true });
}
