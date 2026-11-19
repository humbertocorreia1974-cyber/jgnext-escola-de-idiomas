"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GerarBoletinsClient() {
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function gerar() {
    setLoading(true);
    setMsg(null);
    const r = await fetch("/api/boletins/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodo }),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) return setMsg(d.error ?? "Erro ao gerar boletins");
    setMsg(`${d.gerados} boletins gerados para ${periodo}.`);
    setTimeout(() => location.reload(), 800);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Período (AAAA-MM)</label>
        <Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2025-06" />
      </div>
      <Button onClick={gerar} disabled={loading}>
        {loading ? "Gerando..." : "Gerar boletins do período"}
      </Button>
      {msg && <span className="text-sm text-fg-muted">{msg}</span>}
    </div>
  );
}
