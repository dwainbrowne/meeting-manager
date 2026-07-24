import {
  type JsonObject,
  type JsonValue,
  inferSource,
  normalizeWebhookPayload,
  sourceDisplayName,
} from "./normalization";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const DEFAULT_MAX_JSON_BYTES = 5 * 1024 * 1024;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  });
}

function methodNotAllowed(allowed: string[]) {
  return jsonResponse(
    { error: "Method not allowed", allowed },
    {
      status: 405,
      headers: { Allow: allowed.join(", ") },
    },
  );
}

function notFound(pathname: string) {
  return jsonResponse({ error: "Not found", path: pathname }, { status: 404 });
}

async function readTextWithLimit(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new PayloadTooLargeError(maxBytes);
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      throw new PayloadTooLargeError(maxBytes);
    }

    body += decoder.decode(value, { stream: true });
  }

  body += decoder.decode();
  return body;
}

function parseJsonValue(rawBody: string): JsonValue {
  return JSON.parse(rawBody) as JsonValue;
}

function toNormalizerPayload(parsed: JsonValue): JsonObject {
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    return parsed;
  }

  return {
    payload: parsed,
  };
}

function extractSourceHint(request: Request, url: URL) {
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const routeSource =
    pathSegments[0] === "webhooks" || pathSegments[0] === "ingest" ? pathSegments[1] : null;

  return (
    routeSource ??
    url.searchParams.get("source") ??
    request.headers.get("x-meeting-provider") ??
    request.headers.get("x-webhook-source") ??
    request.headers.get("x-source")
  );
}

function getMaxJsonBytes(env: Env) {
  const value = Number(env.MAX_JSON_BYTES);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_JSON_BYTES;
}

function datePath(receivedAt: string) {
  return receivedAt.slice(0, 10);
}

async function handleWebhook(request: Request, env: Env, url: URL) {
  if (request.method !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const id = crypto.randomUUID();
  const receivedAt = new Date().toISOString();
  const rawBody = await readTextWithLimit(request, getMaxJsonBytes(env));
  const parsed = parseJsonValue(rawBody);
  const payload = toNormalizerPayload(parsed);
  const source = inferSource(extractSourceHint(request, url), payload);
  const eventDate = datePath(receivedAt);
  const rawEventKey = `raw/${source}/${eventDate}/${id}.json`;
  const normalizedEventKey = `normalized/${source}/${eventDate}/${id}.json`;

  await env.WEBHOOK_EVENTS.put(rawEventKey, rawBody, {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
    },
    customMetadata: {
      id,
      source,
      receivedAt,
    },
  });

  const normalized = normalizeWebhookPayload({
    id,
    source,
    receivedAt,
    rawEventKey,
    normalizedEventKey,
    payload,
  });

  await env.WEBHOOK_EVENTS.put(normalizedEventKey, JSON.stringify(normalized, null, 2), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8",
    },
    customMetadata: {
      id,
      source,
      receivedAt,
      rawEventKey,
    },
  });

  console.log(
    JSON.stringify({
      level: "info",
      message: "Accepted webhook event",
      id,
      source,
      rawEventKey,
      normalizedEventKey,
    }),
  );

  return jsonResponse(
    {
      accepted: true,
      id,
      source,
      sourceDisplayName: sourceDisplayName(source),
      rawEventKey,
      normalizedEventKey,
      normalized,
    },
    { status: 202 },
  );
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, POST, OPTIONS",
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "meeting-manager-webhook",
    });
  }

  if (request.method === "GET" && url.pathname === "/ready") {
    return jsonResponse({
      ready: true,
      storage: "r2",
      rawEvents: true,
      normalizedEvents: true,
    });
  }

  if (url.pathname === "/webhooks" || url.pathname.startsWith("/webhooks/")) {
    return handleWebhook(request, env, url);
  }

  if (url.pathname === "/ingest" || url.pathname.startsWith("/ingest/")) {
    return handleWebhook(request, env, url);
  }

  return notFound(url.pathname);
}

class PayloadTooLargeError extends Error {
  constructor(readonly maxBytes: number) {
    super(`Payload exceeds ${maxBytes} bytes`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        return jsonResponse(
          {
            error: "Payload too large",
            maxBytes: error.maxBytes,
          },
          { status: 413 },
        );
      }

      if (error instanceof SyntaxError) {
        return jsonResponse(
          {
            error: "Invalid JSON payload",
          },
          { status: 400 },
        );
      }

      console.error(
        JSON.stringify({
          level: "error",
          message: "Unhandled webhook Worker error",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );

      return jsonResponse(
        {
          error: "Internal server error",
        },
        { status: 500 },
      );
    }
  },
} satisfies ExportedHandler<Env>;
