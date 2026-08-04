"use client";
import { type ReactNode, useEffect } from "react";

interface CSPostHogProviderProps {
  children: ReactNode;
}

export function CSPostHogProvider({ children }: CSPostHogProviderProps) {
  useEffect(() => {
    let active = true;

    const initializePostHog = async () => {
      try {
        const response = await fetch("/api/posthog-config", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const config = await response.json();

        if (
          config.ENABLE_POSTHOG === "1" &&
          config.POSTHOG_KEY &&
          config.POSTHOG_KEY !== "NOT SET" &&
          config.POSTHOG_HOST &&
          config.POSTHOG_HOST !== "NOT SET"
        ) {
          const { default: posthog } = await import("posthog-js");
          if (!active) return;
          posthog.init(config.POSTHOG_KEY, {
            api_host: config.POSTHOG_HOST,
            person_profiles: "identified_only",
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error initializing PostHog:", error);
        }
      }
    };

    initializePostHog();
    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
