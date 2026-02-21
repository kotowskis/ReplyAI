import { getResend, EMAIL_FROM } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://replyai.pl";

// ─── TEMPLATE TYPES ─────────────────────────────────────────────────────────────

export type EmailTemplateType =
  | "welcome"
  | "limit_reached"
  | "pro_confirmation"
  | "payment_failed";

export interface EmailTemplate {
  type: EmailTemplateType;
  subject: string;
  body_html: string;
}

// ─── AVAILABLE VARIABLES PER TEMPLATE ────────────────────────────────────────────

export const TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  welcome: ["{{firstName}}", "{{appUrl}}"],
  limit_reached: ["{{firstName}}", "{{appUrl}}"],
  pro_confirmation: ["{{firstName}}", "{{planName}}", "{{appUrl}}"],
  payment_failed: ["{{firstName}}", "{{appUrl}}"],
};

export const TEMPLATE_LABELS: Record<
  EmailTemplateType,
  { name: string; description: string }
> = {
  welcome: {
    name: "Powitanie",
    description: "Wysyłany po rejestracji nowego użytkownika",
  },
  limit_reached: {
    name: "Limit osiągnięty",
    description: "Wysyłany gdy użytkownik Free wykorzysta 5 generacji",
  },
  pro_confirmation: {
    name: "Potwierdzenie Pro",
    description: "Wysyłany po wykupieniu subskrypcji Pro/Agency",
  },
  payment_failed: {
    name: "Nieudana płatność",
    description: "Wysyłany gdy płatność za subskrypcję się nie powiedzie",
  },
};

// ─── DEFAULT TEMPLATES (fallback when DB has no custom version) ──────────────────

const DEFAULT_TEMPLATES: Record<EmailTemplateType, EmailTemplate> = {
  welcome: {
    type: "welcome",
    subject: "Witaj w ReplyAI — zacznij odpowiadać mądrze",
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Cześć, {{firstName}}!</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Twoje konto w <strong>ReplyAI</strong> jest gotowe. Odpowiadanie na opinie klientów właśnie stało się prostsze.
  </p>

  <div style="margin: 32px 0;">
    <a href="{{appUrl}}/onboarding" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
      Skonfiguruj firmę →
    </a>
  </div>

  <h2 style="font-size: 18px; font-weight: 600; margin-top: 32px;">3 wskazówki na start:</h2>
  <ol style="font-size: 15px; line-height: 1.8; color: #3f3f46; padding-left: 20px;">
    <li><strong>Uzupełnij profil firmy</strong> — im więcej kontekstu podasz (branża, ton, opis), tym lepsze odpowiedzi wygeneruje AI.</li>
    <li><strong>Wklej prawdziwą opinię</strong> — skopiuj ją z Google Maps lub Facebooka i kliknij "Generuj odpowiedź".</li>
    <li><strong>Kopiuj i wklej</strong> — gotową odpowiedź wklej bezpośrednio pod opinią klienta.</li>
  </ol>

  <p style="font-size: 15px; line-height: 1.6; color: #3f3f46; margin-top: 32px;">
    Na planie Starter masz <strong>5 darmowych odpowiedzi</strong> miesięcznie. Potrzebujesz więcej?
    <a href="{{appUrl}}/pricing" style="color: #2563eb; text-decoration: underline;">Sprawdź plan Pro</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="font-size: 13px; color: #a1a1aa;">
    Dostajesz tę wiadomość, bo utworzono konto w ReplyAI z tym adresem email.
  </p>
</div>`,
  },

  limit_reached: {
    type: "limit_reached",
    subject: "Wykorzystałeś/aś 5 odpowiedzi w tym miesiącu",
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Limit osiągnięty</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Cześć {{firstName}}, Twoje <strong>5 darmowych odpowiedzi</strong> na ten miesiąc zostało wykorzystanych.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46; margin-top: 16px;">
    Przejdź na <strong>plan Pro</strong>, aby odpowiadać na opinie bez limitu:
  </p>

  <ul style="font-size: 15px; line-height: 1.8; color: #3f3f46; padding-left: 20px; margin-top: 12px;">
    <li>Nieograniczona liczba odpowiedzi</li>
    <li>Priorytetowa obsługa AI</li>
    <li>Wsparcie emailowe</li>
  </ul>

  <div style="margin: 32px 0;">
    <a href="{{appUrl}}/pricing" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
      Przejdź na Pro — 79 zł/mies. →
    </a>
  </div>

  <p style="font-size: 14px; line-height: 1.6; color: #71717a;">
    Twój limit odnowi się na początku następnego miesiąca. Jeśli nie chcesz czekać — Pro daje Ci nieograniczony dostęp już teraz.
  </p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="font-size: 13px; color: #a1a1aa;">
    Dostajesz tę wiadomość, bo osiągnąłeś/aś limit generacji w ReplyAI.
  </p>
</div>`,
  },

  pro_confirmation: {
    type: "pro_confirmation",
    subject: "Masz teraz nieograniczone odpowiedzi ✓",
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Plan {{planName}} aktywny!</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Cześć {{firstName}}, Twoja subskrypcja <strong>{{planName}}</strong> jest już aktywna.
    Od teraz możesz generować odpowiedzi na opinie bez żadnych limitów.
  </p>

  <div style="margin: 32px 0;">
    <a href="{{appUrl}}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
      Otwórz generator →
    </a>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: #3f3f46;">
    Fakturę i historię płatności znajdziesz w
    <a href="{{appUrl}}/account?tab=subskrypcja" style="color: #2563eb; text-decoration: underline;">panelu konta</a>.
  </p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="font-size: 13px; color: #a1a1aa;">
    Dostajesz tę wiadomość, bo wykupiłeś/aś subskrypcję w ReplyAI.
  </p>
</div>`,
  },

  payment_failed: {
    type: "payment_failed",
    subject: "Problem z płatnością za ReplyAI",
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; color: #18181b;">
  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">Płatność nie powiodła się</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Cześć {{firstName}}, nie udało się pobrać płatności za Twoją subskrypcję ReplyAI.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #3f3f46; margin-top: 16px;">
    Zaktualizuj dane płatnicze, aby Twoje konto pozostało aktywne:
  </p>

  <div style="margin: 32px 0;">
    <a href="{{appUrl}}/account?tab=subskrypcja" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
      Zaktualizuj płatność →
    </a>
  </div>

  <p style="font-size: 14px; line-height: 1.6; color: #71717a;">
    Jeśli nie zaktualizujesz danych, Twoja subskrypcja zostanie anulowana, a konto wróci na darmowy plan Starter (5 odpowiedzi/mies.).
  </p>

  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="font-size: 13px; color: #a1a1aa;">
    Dostajesz tę wiadomość, bo płatność za subskrypcję ReplyAI nie powiodła się.
  </p>
</div>`,
  },
};

// ─── TEMPLATE LOADING ────────────────────────────────────────────────────────────

/**
 * Get a template by type — first from DB (admin-customized), then fallback to default.
 */
async function getTemplate(type: EmailTemplateType): Promise<EmailTemplate> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("email_templates")
      .select("type, subject, body_html")
      .eq("type", type)
      .single();

    if (data) {
      return data as EmailTemplate;
    }
  } catch {
    // DB unavailable or table doesn't exist yet — use defaults
  }

  return DEFAULT_TEMPLATES[type];
}

/**
 * Replace {{variable}} placeholders in subject and body.
 */
function renderTemplate(
  template: EmailTemplate,
  vars: Record<string, string>,
): { subject: string; html: string } {
  let subject = template.subject;
  let html = template.body_html;

  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    subject = subject.replaceAll(placeholder, value);
    html = html.replaceAll(placeholder, value);
  }

  return { subject, html };
}

/**
 * Returns default templates (for the admin editor "reset to default" feature).
 */
export function getDefaultTemplate(type: EmailTemplateType): EmailTemplate {
  return DEFAULT_TEMPLATES[type];
}

// ─── EMAIL SENDING FUNCTIONS ─────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, fullName: string) {
  const firstName = fullName?.split(" ")[0] || "tam";
  const template = await getTemplate("welcome");
  const { subject, html } = renderTemplate(template, {
    firstName,
    appUrl: APP_URL,
  });

  return getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}

export async function sendLimitReachedEmail(to: string, fullName: string) {
  const firstName = fullName?.split(" ")[0] || "tam";
  const template = await getTemplate("limit_reached");
  const { subject, html } = renderTemplate(template, {
    firstName,
    appUrl: APP_URL,
  });

  return getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}

export async function sendProConfirmationEmail(
  to: string,
  fullName: string,
  planName: string,
) {
  const firstName = fullName?.split(" ")[0] || "tam";
  const template = await getTemplate("pro_confirmation");
  const { subject, html } = renderTemplate(template, {
    firstName,
    planName,
    appUrl: APP_URL,
  });

  return getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}

export async function sendPaymentFailedEmail(to: string, fullName: string) {
  const firstName = fullName?.split(" ")[0] || "tam";
  const template = await getTemplate("payment_failed");
  const { subject, html } = renderTemplate(template, {
    firstName,
    appUrl: APP_URL,
  });

  return getResend().emails.send({ from: EMAIL_FROM, to, subject, html });
}
