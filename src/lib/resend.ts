import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Lazy-initialised Resend client.
 * Created on first call so modules can safely import email helpers
 * without crashing when RESEND_API_KEY is not yet configured.
 */
export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "RESEND_API_KEY is not set. Add it to your .env.local file.",
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "ReplyAI <noreply@replyai.pl>";
