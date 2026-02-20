import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in prod
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay — capture 1% normally, 100% on errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});
