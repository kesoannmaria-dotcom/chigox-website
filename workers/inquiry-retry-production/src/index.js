const PRODUCTION_RETRY_URL = "https://www.chigox.com/api/inquiry-retry";

export function resolveRetryEndpoint(env) {
  const configuredUrl = String(env?.TARGET_RETRY_URL || "").trim();
  if (configuredUrl !== PRODUCTION_RETRY_URL) {
    throw new Error("Production retry target is not configured correctly");
  }

  const url = new URL(configuredUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.chigox.com" ||
    url.pathname !== "/api/inquiry-retry" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Retry target must be the approved CHIGOX Production endpoint");
  }
  return url.toString();
}

export async function runScheduledRetry(env, fetchImpl = fetch) {
  const endpoint = resolveRetryEndpoint(env);
  const secret = String(env?.INQUIRY_RETRY_SECRET || "").trim();
  if (!secret) throw new Error("INQUIRY_RETRY_SECRET is not configured");

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${secret}`,
      "user-agent": "chigox-inquiry-retry-production/1.0"
    }
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(
      `Production retry endpoint failed with HTTP ${response.status}`
    );
  }
  return {
    checked: Number(result.checked || 0),
    sent: Number(result.sent || 0),
    pending: Number(result.pending || 0),
    failed: Number(result.failed || 0),
    skipped: Number(result.skipped || 0)
  };
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      runScheduledRetry(env)
        .then((result) => {
          console.log("[inquiry-retry-cron-complete]", result);
        })
        .catch((error) => {
          console.error("[inquiry-retry-cron-failed]", {
            error: String(error?.message || "unknown").slice(0, 160)
          });
          throw error;
        })
    );
  },

  async fetch() {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" }
    });
  }
};
