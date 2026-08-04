export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type AnalyticsClient = {
  capture: (eventName: string, properties?: AnalyticsProperties) => void;
  register: (properties: AnalyticsProperties) => void;
};

export const ANALYTICS_SCHEMA_VERSION = 1;

const MAX_QUEUED_EVENTS = 100;
let client: AnalyticsClient | null = null;
let configResolved = false;
let queuedEvents: Array<{
  eventName: string;
  properties: AnalyticsProperties;
}> = [];

function eventProperties(properties: AnalyticsProperties = {}) {
  return {
    ...properties,
    analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
  };
}

export function captureAnalytics(
  eventName: string,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined") return;

  const payload = eventProperties(properties);
  if (client) {
    client.capture(eventName, payload);
    return;
  }

  if (!configResolved && queuedEvents.length < MAX_QUEUED_EVENTS) {
    queuedEvents.push({ eventName, properties: payload });
  }
}

export function registerAnalyticsClient(analyticsClient: AnalyticsClient) {
  client = analyticsClient;
  configResolved = true;
  client.register({
    app_name: "fantasy_trade_target",
    analytics_schema_version: ANALYTICS_SCHEMA_VERSION,
  });

  queuedEvents.forEach(({ eventName, properties }) => {
    client?.capture(eventName, properties);
  });
  queuedEvents = [];
}

export function disableAnalytics() {
  configResolved = true;
  queuedEvents = [];
}
