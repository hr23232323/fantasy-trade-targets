"use client";
import React, { ReactNode, useEffect, useState } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
export const dynamic = "force-dynamic"; // Tell NextJS to make this dynamic

interface CSPostHogProviderProps {
  children: ReactNode;
}

export function CSPostHogProvider({ children }: CSPostHogProviderProps) {
  const [isPosthogInitialized, setIsPosthogInitialized] = useState(false);

  useEffect(() => {
    const initializePostHog = async () => {
      try {
        const response = await fetch("/api/posthog-config");
        const config = await response.json();

        if (
          config.ENABLE_POSTHOG === "1" &&
          config.POSTHOG_KEY &&
          config.POSTHOG_KEY !== "NOT SET" &&
          config.POSTHOG_HOST &&
          config.POSTHOG_HOST !== "NOT SET"
        ) {
          posthog.init(config.POSTHOG_KEY, {
            api_host: config.POSTHOG_HOST,
            person_profiles: "always",
          });
          setIsPosthogInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing PostHog:", error);
      }
    };

    initializePostHog();
  }, []);

  // Always render children immediately to avoid hydration errors
  if (isPosthogInitialized) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }

  // Render children without PostHog if not initialized yet
  return <>{children}</>;
}
