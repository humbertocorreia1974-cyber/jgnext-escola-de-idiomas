export function brl(v: number | string | { toString(): string } | null | undefined) {
  if (v === null || v === undefined) return "R$ 0,00";
  const n = typeof v === "number" ? v : Number(v.toString());
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dt(v: Date | string | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("pt-BR");
}

export function dtTime(v: Date | string | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
