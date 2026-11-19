"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CobrarClient({ ids }: { ids: string[] }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function cobrar() {
    setLoading(true);
    setMsg(null);
    const r = await fetch("/api/inadimplencia/cobrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensalidadeIds: ids }),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) return setMsg(d.error ?? "Erro");
    setMsg(`${d.enviados} cobranças enviadas.`);
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={cobrar} disabled={loading || ids.length === 0}>
        {loading ? "Enviando..." : `Disparar régua de cobrança (${ids.length})`}
      </Button>
      {msg && <span className="text-sm text-fg-muted">{msg}</span>}
    </div>
  );
}
