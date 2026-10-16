export function isMockSupabase(url?: string): boolean {
  if (!url) return true;
  return url.includes("mockdevproject") || url.includes("mock_");
}

export function mockSupabaseFetch(
  input: RequestInfo | URL,
  _init?: RequestInit
): Promise<Response> {
  const urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  if (urlStr.includes("/auth/v1/user")) {
    return Promise.resolve(
      new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  }

  if (urlStr.includes("/auth/v1/factors")) {
    return Promise.resolve(
      new Response(JSON.stringify({ all: [], totp: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  }

  if (urlStr.includes("/auth/v1/aal")) {
    return Promise.resolve(
      new Response(
        JSON.stringify({ currentLevel: "aal1", nextLevel: "aal1" }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );
  }

  // Database REST query response: empty dataset with exact count 0
  return Promise.resolve(
    new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "content-range": "0-0/0",
      },
    })
  );
}
