"use client";

import * as React from "react";
import Script from "next/script";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
        }
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export const turnstileConfigured = Boolean(SITE_KEY);

/**
 * Cloudflare Turnstile, rendered in "interaction-only" mode so that the
 * overwhelming majority of senders — including the grandparent on a phone —
 * never see a challenge at all.
 *
 * When no site key is configured the widget renders nothing and the API
 * treats the submission as un-CAPTCHA'd, which is the intended behaviour for
 * local development.
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (!SITE_KEY || !ready || !ref.current || widgetId.current) return;
    try {
      widgetId.current = window.turnstile!.render(ref.current, {
        sitekey: SITE_KEY,
        appearance: "interaction-only",
        theme: "auto",
        callback: (token) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });
    } catch (error) {
      console.error("[turnstile] render failed", error);
    }

    return () => {
      if (widgetId.current) {
        try {
          window.turnstile?.remove(widgetId.current);
        } catch {
          /* already gone */
        }
        widgetId.current = null;
      }
    };
  }, [ready, onToken]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
        onLoad={() => setReady(true)}
      />
      <div ref={ref} className="flex justify-center [&:empty]:hidden" />
    </>
  );
}
