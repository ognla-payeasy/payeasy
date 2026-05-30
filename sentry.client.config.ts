import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Capture 10% of transactions in production for performance monitoring.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable in production to keep local dev noise-free.
  enabled: process.env.NODE_ENV === "production",

  beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
    const error = hint?.originalException;

    if (error instanceof Error) {
      const msg = error.message ?? "";

      // Ignore expected user-cancel actions — these are not bugs.
      const expectedMessages = [
        "User cancelled Freighter request",
        "Wallet popup dismissed",
        "Transaction rejected by user",
        "User denied account access",
        "User closed the popup",
        "freighter: user rejected",
      ];

      if (
        expectedMessages.some((expected) =>
          msg.toLowerCase().includes(expected.toLowerCase())
        )
      ) {
        return null;
      }
    }

    return event;
  },

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Only record sessions that encounter an error.
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capture Replay for 0% of sessions, 100% of sessions with errors.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});