import type { NextApiRequest, NextApiResponse } from "next";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

type InstagramBusinessAccount = { id: string };

type PageIgResponse = {
  instagram_business_account?: InstagramBusinessAccount;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

type IgProfileResponse = {
  id?: string;
  username?: string;
  name?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

interface InstagramProfilePayload {
  igUserId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  followers: number | null;
  following: number | null;
  mediaCount: number | null;
  raw: unknown;
}

interface ErrorPayload {
  error: string;
  details?: unknown;
}

async function resolveFacebookPageToken(pageId: string): Promise<string> {
  const candidate = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!candidate) {
    throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set");
  }

  const userToken =
    process.env.FACEBOOK_USER_ACCESS_TOKEN ||
    // Back-compat: sometimes this env var actually contains a user token.
    candidate ||
    (process.env.FACEBOOK_APP_SECRET?.startsWith("EA")
      ? process.env.FACEBOOK_APP_SECRET
      : candidate);

  // Prefer deriving a real Page token if the available token is a user token.
  try {
    return await getFacebookPageAccessToken({
      pageId,
      userAccessToken: userToken,
      graphVersion: "v20.0",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // If /me/accounts fails because the token is already a Page token, fall back to the candidate.
    if (
      msg.toLowerCase().includes("must be called with a user access token") ||
      msg.toLowerCase().includes("requires a user access token") ||
      msg.toLowerCase().includes("unsupported get request") ||
      msg.toLowerCase().includes("cannot parse access token")
    ) {
      return candidate;
    }
    // Otherwise still fall back to candidate; downstream will surface the error clearly.
    return candidate;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InstagramProfilePayload | ErrorPayload>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID || "154572707991531";

  let pageToken: string;
  try {
    pageToken = await resolveFacebookPageToken(pageId);
  } catch (e) {
    return res.status(500).json({
      error: "Server configuration error: missing Facebook token(s)",
      details: e instanceof Error ? e.message : String(e),
    });
  }

  try {
    // 1) Derive IG business account id from the Page
    const pageUrl = new URL(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}`
    );
    pageUrl.searchParams.set("fields", "instagram_business_account");
    pageUrl.searchParams.set("access_token", pageToken);

    const pageResp = await fetch(pageUrl.toString());
    const pageJson = (await pageResp.json()) as PageIgResponse;

    if (!pageResp.ok) {
      return res.status(pageResp.status).json({
        error: `Failed to resolve Instagram account from Facebook Page: ${pageResp.status} ${pageResp.statusText}`,
        details: pageJson,
      });
    }

    const igUserId = pageJson.instagram_business_account?.id;
    if (!igUserId) {
      return res.status(404).json({
        error:
          "No Instagram business account linked to this Facebook Page (instagram_business_account missing).",
        details: pageJson,
      });
    }

    // 2) Fetch IG profile
    const igUrl = new URL(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(igUserId)}`
    );
    igUrl.searchParams.set(
      "fields",
      "username,name,profile_picture_url,followers_count,follows_count,media_count"
    );
    igUrl.searchParams.set("access_token", pageToken);

    const igResp = await fetch(igUrl.toString());
    const igJson = (await igResp.json()) as IgProfileResponse;

    if (!igResp.ok) {
      return res.status(igResp.status).json({
        error: `Failed to fetch Instagram profile: ${igResp.status} ${igResp.statusText}`,
        details: igJson,
      });
    }

    const shaped: InstagramProfilePayload = {
      igUserId,
      username: typeof igJson.username === "string" ? igJson.username : null,
      name: typeof igJson.name === "string" ? igJson.name : null,
      profilePictureUrl:
        typeof igJson.profile_picture_url === "string"
          ? igJson.profile_picture_url
          : null,
      followers:
        typeof igJson.followers_count === "number"
          ? igJson.followers_count
          : null,
      following:
        typeof igJson.follows_count === "number" ? igJson.follows_count : null,
      mediaCount:
        typeof igJson.media_count === "number" ? igJson.media_count : null,
      raw: { page: pageJson, profile: igJson },
    };

    return res.status(200).json(shaped);
  } catch (e) {
    return res.status(500).json({
      error: "Unexpected error while fetching Instagram profile",
      details: e instanceof Error ? e.message : String(e),
    });
  }
}
