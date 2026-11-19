import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export type Role = "dono" | "coordenacao" | "secretaria" | "professor" | "aluno" | "user";

export const ROLE_LABEL: Record<string, string> = {
  dono: "Dono",
  coordenacao: "Coordenação",
  secretaria: "Secretaria",
  professor: "Professor",
  aluno: "Aluno",
  user: "Usuário",
};

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(roles: Role[]) {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role ?? "user";
  if (!roles.includes(role as Role)) redirect("/");
  return session;
}

export function isStaff(role?: string) {
  return role === "dono" || role === "coordenacao" || role === "secretaria";
}
