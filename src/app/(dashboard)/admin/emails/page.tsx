import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRole, isAdmin } from "@/lib/roles";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import {
  TEMPLATE_LABELS,
  TEMPLATE_VARIABLES,
  getDefaultTemplate,
} from "@/lib/emails";
import type { EmailTemplateType, EmailTemplate } from "@/lib/emails";
import { EmailTemplateEditor } from "./EmailTemplateEditor";

const TEMPLATE_TYPES: EmailTemplateType[] = [
  "welcome",
  "limit_reached",
  "pro_confirmation",
  "payment_failed",
];

export default async function AdminEmailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = await getUserRole(supabase, user.id);
  if (!isAdmin(role)) redirect("/dashboard");

  // Load custom templates from DB
  const { data: customTemplates } = await supabase
    .from("email_templates")
    .select("type, subject, body_html, updated_at, updated_by");

  const customMap = new Map(
    (customTemplates ?? []).map((t: EmailTemplate & { updated_at: string; updated_by: string | null }) => [t.type, t]),
  );

  // Build template list: custom from DB or default
  const templates = TEMPLATE_TYPES.map((type) => {
    const custom = customMap.get(type);
    const defaults = getDefaultTemplate(type);
    const labels = TEMPLATE_LABELS[type];
    const variables = TEMPLATE_VARIABLES[type];

    return {
      type,
      name: labels.name,
      description: labels.description,
      variables,
      isCustomized: !!custom,
      subject: custom?.subject ?? defaults.subject,
      body_html: custom?.body_html ?? defaults.body_html,
      defaultSubject: defaults.subject,
      defaultBodyHtml: defaults.body_html,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrót do panelu
        </Link>
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-zinc-900">
            Szablony emaili
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Edytuj treść emaili transakcyjnych. Zmienne w podwójnych klamrach{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">
            {"{{zmienna}}"}
          </code>{" "}
          zostaną zastąpione prawdziwymi wartościami przy wysyłce.
        </p>
      </div>

      {/* Template cards */}
      <div className="space-y-4">
        {templates.map((t) => (
          <EmailTemplateEditor
            key={t.type}
            type={t.type}
            name={t.name}
            description={t.description}
            variables={t.variables}
            isCustomized={t.isCustomized}
            subject={t.subject}
            bodyHtml={t.body_html}
            defaultSubject={t.defaultSubject}
            defaultBodyHtml={t.defaultBodyHtml}
          />
        ))}
      </div>
    </div>
  );
}
