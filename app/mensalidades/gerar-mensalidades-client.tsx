"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GerarMensalidadesClient() {
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function gerar() {
    setLoading(true);
    setMsg(null);
    const r = await fetch("/api/mensalidades/gerar-lote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencia }),
    });
    const d = await r.json();
    setLoading(false);
    if (!r.ok) return setMsg(d.error ?? "Erro");
    setMsg(`${d.geradas} mensalidades geradas.`);
    setTimeout(() => location.reload(), 800);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">Competência (AAAA-MM)</label>
        <Input value={competencia} onChange={(e) => setCompetencia(e.target.value)} />
      </div>
      <Button onClick={gerar} disabled={loading}>
        {loading ? "Gerando..." : "Gerar mensalidades"}
      </Button>
      {msg && <span className="text-sm text-fg-muted">{msg}</span>}
    </div>
  );
}
