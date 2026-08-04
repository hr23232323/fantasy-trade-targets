"use client";

import { useEffect } from "react";
import {
  captureAnalytics,
  type AnalyticsProperties,
} from "../lib/analytics";

export default function AnalyticsPageView({
  eventName,
  properties = {},
}: {
  eventName: string;
  properties?: AnalyticsProperties;
}) {
  const serializedProperties = JSON.stringify(properties);

  useEffect(() => {
    captureAnalytics(eventName, JSON.parse(serializedProperties));
  }, [eventName, serializedProperties]);

  return null;
}
