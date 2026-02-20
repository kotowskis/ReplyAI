import { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return (data?.role as UserRole) ?? "user";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
