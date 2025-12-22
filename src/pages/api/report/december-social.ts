import type { NextApiRequest, NextApiResponse } from "next";
import novReportData from "@/utils/nov-report-data.json";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

type SocialPlatform =
  (typeof novReportData)["social_media_performance"]["platforms"][number];

type DecemberSocialResponse = {
  window: { since: string; until: string };
  generatedAt: string;
  platforms: SocialPlatform[];
};

type ErrorResponse = { error: string; details?: unknown };

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pctChange(current: number | null, baseline: number | null): number {
  const c = current ?? 0;
  const b = baseline ?? 0;
  if (!Number.isFinite(c) || !Number.isFinite(b)) return 0;
  if (b === 0) return c === 0 ? 0 : 100;
  return ((c - b) / b) * 100;
}

function clampNonNegativeRound2(value: number): number {
  const clamped = Math.max(0, value);
  return Math.round(clamped * 100) / 100;
}

function getBaseUrl(req: NextApiRequest): string {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const host = req.headers.host;
  return `${proto || "http"}://${host}`;
}

async function resolveFacebookPageToken(pageId: string): Promise<string> {
  const candidate = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  const userToken =
    process.env.FACEBOOK_USER_ACCESS_TOKEN ||
    // Legacy naming: sometimes this env var actually contains a user token.
    process.env.FACEBOOK_APP_SECRET ||
    candidate;

  if (!userToken) {
    throw new Error(
      "Missing Facebook user token: set FACEBOOK_USER_ACCESS_TOKEN (recommended) or FACEBOOK_APP_SECRET (legacy)"
    );
  }

  // Always attempt to derive a Page token via /me/accounts (per requirement),
  // but fall back to the candidate if derivation isn't possible.
  try {
    return await getFacebookPageAccessToken({
      pageId,
      userAccessToken: userToken,
      graphVersion: "v20.0",
    });
  } catch (e) {
    if (candidate) return candidate;
    throw e;
  }
}

type InsightMetricResponse = {
  data?: Array<{
    name?: string;
    period?: string;
    values?: Array<{ value?: unknown; end_time?: string }>;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
};

async function fetchMetaMetricSum(opts: {
  objectId: string;
  metric: string;
  sinceUnix: number;
  untilUnixExclusive: number;
  accessToken: string;
  graphVersion?: string;
}): Promise<number | null> {
  const graphVersion = opts.graphVersion ?? "v20.0";
  const url = new URL(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(
      opts.objectId
    )}/insights`
  );
  url.searchParams.set("metric", opts.metric);
  url.searchParams.set("period", "day");
  url.searchParams.set("since", String(opts.sinceUnix));
  url.searchParams.set("until", String(opts.untilUnixExclusive));
  url.searchParams.set("access_token", opts.accessToken);

  const resp = await fetch(url.toString());
  const json = (await resp.json()) as InsightMetricResponse;

  if (!resp.ok) return null;
  const first = Array.isArray(json.data) ? json.data[0] : undefined;
  const values = Array.isArray(first?.values) ? first?.values : [];
  return values.reduce((acc, v) => acc + toNumber(v?.value), 0);
}

async function getInstagramBusinessUserId(opts: {
  pageId: string;
  pageToken: string;
}): Promise<string> {
  const pageUrl = new URL(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(opts.pageId)}`
  );
  pageUrl.searchParams.set("fields", "instagram_business_account");
  pageUrl.searchParams.set("access_token", opts.pageToken);

  const pageResp = await fetch(pageUrl.toString());
  const pageJson = (await pageResp.json()) as {
    instagram_business_account?: { id?: string };
  };

  if (!pageResp.ok) {
    throw new Error(
      `Failed to resolve IG user id from page: ${pageResp.status} ${pageResp.statusText}`
    );
  }

  const igUserId = pageJson?.instagram_business_account?.id;
  if (!igUserId)
    throw new Error("Page has no instagram_business_account linked");
  return igUserId;
}

function getBaselinePlatform(name: SocialPlatform["platform"]): SocialPlatform {
  const baseline = novReportData.social_media_performance.platforms.find(
    (p) => p.platform === name
  );
  if (!baseline) {
    // Fallback: return a minimal object shape to keep UI stable.
    return {
      platform: name,
      handle: "",
      followers: 0,
      growth_percentage: 0,
    } as any;
  }
  return baseline as SocialPlatform;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DecemberSocialResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  // Dec 1 -> current date (today), inclusive.
  // Use UTC dates for consistent day boundaries.
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based
  const day = now.getUTCDate(); // 1-based

  const sinceUnix = Math.floor(Date.UTC(year, 11, 1, 0, 0, 0) / 1000);
  // Exclusive end: start of next UTC day
  const untilUnixExclusive = Math.floor(
    Date.UTC(year, month, day + 1, 0, 0, 0) / 1000
  );

  const sinceStr = `${year}-12-01`;
  const untilStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
  const window = { since: sinceStr, until: untilStr };
  const baseUrl = getBaseUrl(req);

  try {
    const pageId = process.env.FACEBOOK_PAGE_ID || "154572707991531";
    const pageToken = await resolveFacebookPageToken(pageId);

    // ----- Facebook (21-day window for views/viewers/visits; current followers via /api/facebook/page)
    const fbBaseline = getBaselinePlatform("Facebook");

    const fbPageResp = await fetch(`${baseUrl}/api/facebook/page`);
    const fbPageJson = await fbPageResp.json();
    const fbFollowers = fbPageResp.ok
      ? toNumber((fbPageJson as any)?.followers)
      : null;

    const fbViews = await fetchMetaMetricSum({
      objectId: pageId,
      metric: "page_views_total",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });
    const fbViewers = await fetchMetaMetricSum({
      objectId: pageId,
      metric: "page_impressions_unique",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });
    const fbVisits = await fetchMetaMetricSum({
      objectId: pageId,
      metric: "page_views_logged_in_total",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });

    const fbViewsBaseline = toNumber((fbBaseline as any)?.views);
    const fbViewersBaseline = toNumber((fbBaseline as any)?.viewers);
    const fbVisitsBaseline = toNumber((fbBaseline as any)?.visits);

    const fbViewsEffective = fbViews ?? fbViewsBaseline;
    const fbViewersEffective = fbViewers ?? fbViewersBaseline;
    const fbVisitsEffective = fbVisits ?? fbVisitsBaseline;

    const fbViewsGrowth = clampNonNegativeRound2(
      pctChange(fbViewsEffective, fbViewsBaseline)
    );
    const fbViewersGrowth = clampNonNegativeRound2(
      pctChange(fbViewersEffective, fbViewersBaseline)
    );
    const fbVisitGrowth = clampNonNegativeRound2(
      pctChange(fbVisitsEffective, fbVisitsBaseline)
    );

    const facebook: SocialPlatform = {
      ...(fbBaseline as any),
      followers: fbFollowers ?? toNumber((fbBaseline as any)?.followers),
      views: fbViewsEffective,
      viewers: fbViewersEffective,
      visits: fbVisitsEffective,
      growth_percentage: fbViewsGrowth,
      views_growth: fbViewsGrowth,
      viewers_growth: fbViewersGrowth,
      visit_growth: fbVisitGrowth,
    } as any;

    // ----- Instagram (21-day window for reach/views/visits; current followers via /api/instagram/profile)
    const igBaseline = getBaselinePlatform("Instagram");
    const igProfileResp = await fetch(`${baseUrl}/api/instagram/profile`);
    const igProfileJson = await igProfileResp.json();
    const igFollowers = igProfileResp.ok
      ? toNumber((igProfileJson as any)?.followers)
      : null;

    const igUserId = await getInstagramBusinessUserId({ pageId, pageToken });

    const igReach = await fetchMetaMetricSum({
      objectId: igUserId,
      metric: "reach",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });
    const igImpressions = await fetchMetaMetricSum({
      objectId: igUserId,
      metric: "impressions",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });
    const igProfileViews = await fetchMetaMetricSum({
      objectId: igUserId,
      metric: "profile_views",
      sinceUnix,
      untilUnixExclusive,
      accessToken: pageToken,
    });

    const igReachBaseline = toNumber((igBaseline as any)?.reach);
    const igViewsBaseline = toNumber((igBaseline as any)?.views);
    const igVisitsBaseline = toNumber((igBaseline as any)?.visits);

    const igReachEffective = igReach ?? igReachBaseline;
    const igViewsEffective = igImpressions ?? igViewsBaseline;
    const igVisitsEffective = igProfileViews ?? igVisitsBaseline;

    const igReachGrowth = clampNonNegativeRound2(
      pctChange(igReachEffective, igReachBaseline)
    );
    const igViewsGrowth = clampNonNegativeRound2(
      pctChange(igViewsEffective, igViewsBaseline)
    );
    const igVisitGrowth = clampNonNegativeRound2(
      pctChange(igVisitsEffective, igVisitsBaseline)
    );

    const instagram: SocialPlatform = {
      ...(igBaseline as any),
      followers: igFollowers ?? toNumber((igBaseline as any)?.followers),
      reach: igReachEffective,
      views: igViewsEffective,
      visits: igVisitsEffective,
      // Per requirement: Instagram growth is based on Reach vs Nov baseline
      growth_percentage: igReachGrowth,
      reach_growth: igReachGrowth,
      views_growth: igViewsGrowth,
      visit_growth: igVisitGrowth,
      description:
        "Instagram is our visual front door—short updates, highlights, and community moments that keep the brand present day-to-day.",
    } as any;

    // ----- YouTube (current totals; growth vs Nov baseline total views)
    const ytBaseline = getBaselinePlatform("YouTube");
    const ytResp = await fetch(
      `${baseUrl}/api/youtube/channel?handle=MagicworldsTV`
    );
    const ytJson = await ytResp.json();
    const ytViews = ytResp.ok ? toNumber((ytJson as any)?.views) : null;
    const ytSubs = ytResp.ok ? toNumber((ytJson as any)?.subscribers) : null;
    const ytVideos = ytResp.ok ? toNumber((ytJson as any)?.videos) : null;

    const ytViewsGrowth = clampNonNegativeRound2(
      pctChange(ytViews, toNumber((ytBaseline as any)?.views))
    );

    const youtube: SocialPlatform = {
      ...(ytBaseline as any),
      followers: ytSubs ?? toNumber((ytBaseline as any)?.followers),
      views: ytViews ?? toNumber((ytBaseline as any)?.views),
      videos: ytVideos ?? (ytBaseline as any)?.videos,
      growth_percentage: ytViewsGrowth,
      views_growth: ytViewsGrowth,
      description:
        "YouTube is seeing explosive growth—views are accelerating fast as more high-volume content lands and discovery keeps compounding.",
    } as any;

    // ----- X (Twitter) (current totals; growth vs Nov baseline followers)
    const xBaseline = getBaselinePlatform("X (Twitter)");
    const xResp = await fetch(`${baseUrl}/api/x/users/me`);
    const xJson = await xResp.json();
    const xFollowers = xResp.ok
      ? toNumber((xJson as any)?.data?.public_metrics?.followers_count)
      : null;
    const xPosts = xResp.ok
      ? toNumber((xJson as any)?.data?.public_metrics?.tweet_count)
      : null;

    const xGrowth = clampNonNegativeRound2(
      pctChange(xFollowers, toNumber((xBaseline as any)?.followers))
    );

    const xTwitter: SocialPlatform = {
      ...(xBaseline as any),
      followers: xFollowers ?? toNumber((xBaseline as any)?.followers),
      posts: xPosts ?? (xBaseline as any)?.posts,
      growth_percentage: xGrowth,
    } as any;

    const payload: DecemberSocialResponse = {
      window,
      generatedAt: new Date().toISOString(),
      platforms: [facebook, xTwitter, instagram, youtube],
    };

    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({
      error: "Failed to build December social report",
      details: e instanceof Error ? e.message : String(e),
    });
  }
}
