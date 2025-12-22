import type { NextApiRequest, NextApiResponse } from "next";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

interface FacebookPageResponse {
  id: string;
  name: string;
  about: string | null;
  likes: number | null;
  followers: number | null;
  link: string | null;
  category: string | null;
  raw: unknown;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FacebookPageResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID || "154572707991531";

  const fields = "id,name,about,fan_count,followers_count,link,category";

  let pageAccessToken: string;

  // Preferred: use a Page access token directly (recommended for Vercel env-only setups)
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  } else {
    // Fallback: derive the Page token via /me/accounts using a *user* access token.
    // Note: FACEBOOK_APP_SECRET is the Meta App Secret (NOT a token) — don't use it for /me/accounts.
    const userAccessToken =
      process.env.FACEBOOK_USER_ACCESS_TOKEN ||
      // Back-compat: if someone stored a user token in FACEBOOK_APP_SECRET earlier and it looks like a token.
      (process.env.FACEBOOK_APP_SECRET?.startsWith("EA")
        ? process.env.FACEBOOK_APP_SECRET
        : undefined);

    if (!userAccessToken) {
      return res.status(500).json({
        error:
          "Server configuration error: set FACEBOOK_PAGE_ACCESS_TOKEN (recommended) or FACEBOOK_USER_ACCESS_TOKEN to derive a Page token via /me/accounts.",
      });
    }

    try {
      pageAccessToken = await getFacebookPageAccessToken({
        pageId,
        userAccessToken,
        graphVersion: "v20.0",
      });
    } catch (e) {
      console.error(
        "[Facebook] Failed to resolve Page access token via /me/accounts",
        e
      );
      return res.status(401).json({
        error:
          "Failed to resolve Page access token from /me/accounts. Ensure the user access token is valid and has pages permissions.",
        details: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const url = new URL(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}`
  );
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", pageAccessToken);

  try {
    console.log(
      "[Facebook] Fetching public page metrics via",
      url.toString().replace(pageAccessToken, "***")
    );

    const response = await fetch(url.toString());
    const json = await response.json();

    if (!response.ok) {
      const fbErr = json?.error;
      const isExpiredToken =
        fbErr?.type === "OAuthException" &&
        fbErr?.code === 190 &&
        fbErr?.error_subcode === 463;

      console.error("[Facebook] Error fetching page metrics", {
        status: response.status,
        statusText: response.statusText,
        body: json,
      });

      if (isExpiredToken) {
        return res.status(401).json({
          error:
            "Facebook access token expired. Update the user token in FACEBOOK_APP_SECRET so we can re-derive a Page token via /me/accounts.",
          details: json,
        });
      }

      return res.status(response.status).json({
        error: `Failed to fetch Facebook page metrics: ${response.status} ${response.statusText}`,
        details: json,
      });
    }

    const likesRaw = json.fan_count;
    const followersRaw = json.followers_count;

    const shaped: FacebookPageResponse = {
      id: String(json.id ?? ""),
      name: String(json.name ?? "Unknown Page"),
      about:
        typeof json.about === "string" && json.about.length > 0
          ? json.about
          : null,
      likes:
        typeof likesRaw === "number"
          ? likesRaw
          : likesRaw
          ? Number(likesRaw) || null
          : null,
      followers:
        typeof followersRaw === "number"
          ? followersRaw
          : followersRaw
          ? Number(followersRaw) || null
          : null,
      link:
        typeof json.link === "string" && json.link.length > 0
          ? json.link
          : null,
      category:
        typeof json.category === "string" && json.category.length > 0
          ? json.category
          : null,
      raw: json,
    };

    console.log("[Facebook] Page metrics shaped successfully for", shaped.name);

    return res.status(200).json(shaped);
  } catch (err) {
    console.error("[Facebook] Unexpected error fetching page metrics", err);
    return res.status(500).json({
      error: "Unexpected error while fetching Facebook page metrics",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
