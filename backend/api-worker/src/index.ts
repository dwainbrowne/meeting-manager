const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  });
}

function notFound(pathname: string) {
  return jsonResponse(
    {
      error: "Not found",
      path: pathname,
    },
    { status: 404 },
  );
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method === "GET" && url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "meeting-manager-api",
    });
  }

  if (request.method === "GET" && url.pathname === "/ready") {
    return jsonResponse({
      ready: true,
      dataLayer: "pending",
    });
  }

  if (request.method === "GET" && url.pathname === "/api") {
    return jsonResponse({
      name: "Meeting Manager API",
      status: "scaffolded",
      next: [
        "Add authentication",
        "Connect production data layer",
        "Move stable prototype API routes from frontend",
      ],
    });
  }

  return notFound(url.pathname);
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Unhandled API Worker error",
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
} satisfies ExportedHandler;
