"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  mensalidadeId: string;
  alunoNome: string;
  telefone: string | null;
  valor: number;
};

export function CobrancaActions({
  mensalidadeId,
  alunoNome,
  telefone,
  valor,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function dispararWhats() {
    if (!telefone) {
      setMsg("Aluno sem telefone cadastrado.");
      return;
    }
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: telefone,
        mensagem: `Olá ${alunoNome}, identificamos uma mensalidade em aberto no valor de ${valor.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" }
        )}. Podemos ajudar com a regularização?`,
      }),
    });
    setMsg(res.ok ? "Cobrança enviada." : "Falha ao enviar.");
    startTransition(() => router.refresh());
  }

  async function marcarNegociada() {
    const res = await fetch(`/api/mensalidades/${mensalidadeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "negociada" }),
    });
    setMsg(res.ok ? "Marcada como negociada." : "Falha ao atualizar.");
    startTransition(() => router.refresh());
  }

  async function registrarPagamento() {
    const res = await fetch("/api/pagamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensalidadeId,
        valor,
        metodo: "pix",
        status: "confirmado",
      }),
    });
    setMsg(res.ok ? "Pagamento registrado." : "Falha ao registrar.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={dispararWhats}
        disabled={pending}
      >
        WhatsApp
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={marcarNegociada}
        disabled={pending}
      >
        Negociar
      </Button>
      <Button size="sm" onClick={registrarPagamento} disabled={pending}>
        Pagar
      </Button>
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
    </div>
  );
}
