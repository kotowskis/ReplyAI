"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LogOut, MessageSquareReply, History, User, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/lib/roles";

const navItems = [
  { href: "/dashboard", label: "Generator", icon: MessageSquareReply },
  { href: "/history", label: "Historia", icon: History },
  { href: "/account", label: "Konto", icon: User },
];

export function DashboardNav({
  userEmail,
  companyName,
  hasCompany,
  role = "user",
}: {
  userEmail: string;
  companyName?: string;
  hasCompany: boolean;
  role?: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-zinc-900">
            ReplyAI
          </Link>
          {hasCompany && (
            <div className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {role === "admin" && (
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pathname === "/admin"
                      ? "bg-red-50 text-red-700"
                      : "text-red-600 hover:bg-red-50 hover:text-red-700"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {companyName && (
            <span className="hidden text-sm text-zinc-500 sm:block">
              {companyName}
            </span>
          )}
          <span className="text-xs text-zinc-400">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
