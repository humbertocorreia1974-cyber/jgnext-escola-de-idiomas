"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AssinarContratoClient({ contratoId, aceito }: { contratoId: string; aceito: boolean }) {
  const [loading, setLoading] = useState(false);
  if (aceito) return <span className="text-xs text-brand">Assinado</span>;
  async function assinar() {
    setLoading(true);
    await fetch(`/api/contratos/${contratoId}/assinar`, { method: "POST" });
    setLoading(false);
    location.reload();
  }
  return (
    <Button size="sm" variant="secondary" onClick={assinar} disabled={loading}>
      {loading ? "..." : "Assinar"}
    </Button>
  );
}
