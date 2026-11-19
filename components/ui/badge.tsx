import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  neutral: "bg-fg-muted/10 text-fg-muted",
  brand: "bg-brand/10 text-brand",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-sky-500/10 text-sky-400",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof tones {
  const s = status.toLowerCase();
  if (["ativa", "ativo", "paga", "pago", "confirmado", "realizada", "aprovado", "concluida", "presente"].includes(s)) return "success";
  if (["pendente", "planejada", "aberta", "em_andamento", "agendada", "recuperacao", "negociada"].includes(s)) return "warning";
  if (["cancelada", "cancelado", "atrasada", "reprovado", "falhou", "estornado", "inadimplente"].includes(s)) return "danger";
  if (["trancada", "encerrada", "encerrado"].includes(s)) return "neutral";
  return "info";
}
