import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import { ShieldCheck, Users, Building2, Zap } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);
  if (!isAdmin(role)) redirect("/dashboard");

  // Fetch stats
  const [
    { count: usersCount },
    { count: companiesCount },
    { count: generationsCount },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("generations").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-zinc-900">
            Panel administratora
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Przegląd systemu i zarządzanie użytkownikami.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-zinc-500">
              Użytkownicy
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {usersCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-zinc-500">Firmy</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {companiesCount ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-zinc-500">
              Generacje
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-zinc-900">
            {generationsCount ?? 0}
          </p>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Ostatni użytkownicy
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Imię</th>
                <th className="px-4 py-3 font-medium">Rola</th>
                <th className="px-4 py-3 font-medium">Data rejestracji</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers?.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-50 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-700">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {u.full_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "admin"
                          ? "bg-red-50 text-red-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {u.role === "admin" ? "Admin" : "Użytkownik"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString("pl-PL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-zinc-400"
                  >
                    Brak użytkowników
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
