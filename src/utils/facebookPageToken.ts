type MeAccountsPage = {
  id?: string;
  name?: string;
  access_token?: string;
};

type MeAccountsResponse = {
  data?: MeAccountsPage[];
  error?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

let cached: { pageId: string; token: string; fetchedAtMs: number } | null =
  null;

function normalizeAccessToken(input: string): string {
  let t = String(input ?? "").trim();
  t = t.replace(/^Bearer\s+/i, "");

  // Common .env mistake: wrapping value in quotes
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }

  // Another common mistake: pasting the whole JSON response
  // e.g. {"access_token":"EA...","token_type":"bearer","expires_in":...}
  if (t.startsWith("{") && t.endsWith("}")) {
    try {
      const parsed = JSON.parse(t) as { access_token?: unknown };
      if (typeof parsed?.access_token === "string") {
        t = parsed.access_token.trim();
      }
    } catch {
      // ignore
    }
  }

  // Another common mistake: pasting key=value
  if (t.startsWith("access_token=")) {
    t = t.slice("access_token=".length).trim();
  }

  return t;
}

/**
 * Resolve a Page access token by calling:
 *   GET https://graph.facebook.com/v20.0/me/accounts?access_token={USER_TOKEN}
 *
 * Notes:
 * - This requires a *user* access token with pages scopes.
 * - In this codebase, the user token is stored in FACEBOOK_APP_SECRET (legacy naming).
 * - We cache in-memory briefly to reduce calls.
 */
export async function getFacebookPageAccessToken(opts: {
  pageId: string;
  userAccessToken: string;
  graphVersion?: string; // default v20.0
  cacheTtlMs?: number; // default 5 minutes
}): Promise<string> {
  const graphVersion = opts.graphVersion ?? "v20.0";
  const cacheTtlMs = opts.cacheTtlMs ?? 5 * 60 * 1000;
  const userAccessToken = normalizeAccessToken(opts.userAccessToken);

  if (!userAccessToken) {
    throw new Error("User access token is empty");
  }

  if (
    cached &&
    cached.pageId === opts.pageId &&
    Date.now() - cached.fetchedAtMs < cacheTtlMs
  ) {
    return cached.token;
  }

  const url = new URL(`https://graph.facebook.com/${graphVersion}/me/accounts`);
  url.searchParams.set("access_token", userAccessToken);

  const resp = await fetch(url.toString());
  const json = (await resp.json()) as MeAccountsResponse;

  if (!resp.ok) {
    const fbErr = asRecord(json).error;
    const fbErrRec = asRecord(fbErr);
    const fbErrMessage = typeof fbErrRec.message === "string" ? fbErrRec.message : "";
    const message =
      fbErrMessage || `Failed to fetch /me/accounts: ${resp.status} ${resp.statusText}`;
    throw new Error(message);
  }

  const pages = Array.isArray(json.data) ? json.data : [];
  const match = pages.find((p) => String(p.id ?? "") === opts.pageId);
  const token = match?.access_token;

  if (!token) {
    const names = pages
      .map((p) => `${p.name ?? "Unknown"} (${p.id ?? "no-id"})`)
      .slice(0, 20)
      .join(", ");
    throw new Error(
      `No Page access_token found for pageId=${opts.pageId}. Pages returned: ${names}`
    );
  }

  cached = { pageId: opts.pageId, token, fetchedAtMs: Date.now() };
  return token;
}
