import {
  jsonResponse,
  retryPendingNotifications
} from "./inquiry.js";

const configuredSecret = (env) =>
  String(env?.INQUIRY_RETRY_SECRET || "").trim();

const providedSecret = (request) => {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
};

export async function onRequestPost({ request, env }) {
  const expected = configuredSecret(env);
  const provided = providedSecret(request);
  if (!expected || !provided || expected !== provided) {
    return jsonResponse(
      { ok: false, code: "UNAUTHORIZED", message: "Unauthorized." },
      401
    );
  }

  try {
    const result = await retryPendingNotifications(env);
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    console.error("[inquiry-retry-failed]", {
      error: String(error?.message || "unknown").slice(0, 160)
    });
    return jsonResponse(
      {
        ok: false,
        code: "RETRY_UNAVAILABLE",
        message: "Notification retry is temporarily unavailable."
      },
      503
    );
  }
}

export function onRequestGet() {
  return jsonResponse(
    { ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed." },
    405
  );
}
