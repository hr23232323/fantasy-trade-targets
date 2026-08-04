"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  captureAnalytics,
  type AnalyticsProperties,
} from "../lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  analyticsEvent: string;
  analyticsProperties?: AnalyticsProperties;
};

export function TrackedLink({
  analyticsEvent,
  analyticsProperties,
  onClick,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        captureAnalytics(analyticsEvent, analyticsProperties);
        onClick?.(event);
      }}
    />
  );
}

type TrackedAnchorProps = ComponentProps<"a"> & {
  analyticsEvent: string;
  analyticsProperties?: AnalyticsProperties;
};

export function TrackedAnchor({
  analyticsEvent,
  analyticsProperties,
  onClick,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        captureAnalytics(analyticsEvent, analyticsProperties);
        onClick?.(event);
      }}
    />
  );
}
