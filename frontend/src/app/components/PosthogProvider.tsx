"use client";
import { type ReactNode, useEffect } from "react";
import {
  disableAnalytics,
  registerAnalyticsClient,
} from "../lib/analytics";

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
        if (!response.ok) {
          disableAnalytics();
          return;
        }
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
            defaults: "2026-05-30",
            capture_pageview: "history_change",
            capture_pageleave: true,
            person_profiles: "identified_only",
            persistence: "localStorage",
            respect_dnt: true,
            disable_session_recording: true,
            capture_performance: true,
            capture_exceptions: true,
            capture_heatmaps: true,
            autocapture: {
              dom_event_allowlist: ["click", "submit", "change"],
              element_allowlist: ["a", "button", "form", "select"],
            },
          });
          registerAnalyticsClient(posthog);
        } else {
          disableAnalytics();
        }
      } catch (error) {
        disableAnalytics();
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
