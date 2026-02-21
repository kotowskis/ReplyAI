import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "change_role"
  | "change_password"
  | "reset_password"
  | "change_plan"
  | "reset_usage"
  | "set_limit";

export type AuditTargetType = "user" | "subscription";

export async function logAdminAction(params: {
  adminId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    details: params.details ?? {},
  });
}
