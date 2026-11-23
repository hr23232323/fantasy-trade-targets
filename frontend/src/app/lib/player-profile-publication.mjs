const MAX_CARRIED_PROFILE_RATIO = 0.1;
const MIN_CARRIED_PROFILE_LIMIT = 3;
const MAX_CARRIED_PROFILE_LIMIT = 25;

export function playerProfileCarryLimit(requestCount) {
  if (!Number.isInteger(requestCount) || requestCount < 1) return 0;
  return Math.min(
    MAX_CARRIED_PROFILE_LIMIT,
    Math.max(
      MIN_CARRIED_PROFILE_LIMIT,
      Math.ceil(requestCount * MAX_CARRIED_PROFILE_RATIO),
    ),
  );
}

export function resolvePlayerProfileRefresh({
  slug,
  payload,
  priorPayload,
  error,
}) {
  if (payload?.data) {
    return { slug, payload, status: "refreshed", reason: null };
  }
  if (!priorPayload?.data) {
    throw new Error(
      `Player profile ${slug} could not be refreshed and has no validated prior profile to carry`,
      error ? { cause: error } : undefined,
    );
  }
  return {
    slug,
    payload: priorPayload,
    status: "carried",
    reason: error instanceof Error ? error.message : "upstream profile unavailable",
  };
}

export function validatePlayerProfileRefreshBatch(responses, requestCount) {
  if (!Array.isArray(responses) || responses.length !== requestCount) {
    throw new Error(
      `Player profile refresh returned ${responses?.length ?? 0} of ${requestCount} responses`,
    );
  }
  const invalid = responses.filter(({ payload }) => !payload?.data);
  if (invalid.length > 0) {
    throw new Error(
      `Player profile refresh produced ${invalid.length} unusable responses`,
    );
  }
  const carried = responses.filter(({ status }) => status === "carried");
  const allowedCarryCount = playerProfileCarryLimit(requestCount);
  if (carried.length > allowedCarryCount) {
    throw new Error(
      `Player profile refresh would carry ${carried.length} profiles; limit is ${allowedCarryCount}, preserving the prior release`,
    );
  }
  return {
    requestedCount: requestCount,
    refreshedCount: requestCount - carried.length,
    carriedCount: carried.length,
    carriedSlugs: carried.map(({ slug }) => slug).sort(),
    allowedCarryCount,
  };
}
