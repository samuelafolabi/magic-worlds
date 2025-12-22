import type { NextApiRequest, NextApiResponse } from "next";
import novReportData from "@/utils/nov-report-data.json";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

type SocialPlatform =
  (typeof novReportData)["social_media_performance"]["platforms"][number];

type DecemberSocialResponse = {
  window: { since: string; until: string };
  generatedAt: string;
  platforms: Array<SocialPlatform | null>;
};

type ErrorResponse = { error: string; details?: unknown };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

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
  // In Vercel, prefer the canonical deployment URL (avoids protocol/host ambiguity).
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
  const host = req.headers.host;
  return `${proto || "http"}://${host}`;
}

type FetchJsonResult<T> = {
  resp: Response;
  json: T | null;
  contentType: string;
  textPreview: string;
};

async function fetchJsonFromInternal<T>(
  req: NextApiRequest,
  url: string,
  init?: RequestInit
): Promise<FetchJsonResult<T>> {
  // Forward cookies so deployment protection/auth middleware doesn't return HTML.
  const cookie = req.headers.cookie;
  const resp = await fetch(url, {
    ...init,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(init?.headers || {}),
    },
  });

  const contentType = resp.headers.get("content-type") || "";
  const text = await resp.text();
  const textPreview = text.slice(0, 200);

  // If we don't get JSON, let callers decide whether to treat it as fatal.
  if (!contentType.toLowerCase().includes("application/json")) {
    return { resp, json: null, contentType, textPreview };
  }

  try {
    return { resp, json: JSON.parse(text) as T, contentType, textPreview };
  } catch {
    return { resp, json: null, contentType, textPreview };
  }
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
  const contentType = resp.headers.get("content-type") || "";
  const text = await resp.text();
  const json =
    contentType.toLowerCase().includes("application/json") && text.length > 0
      ? (JSON.parse(text) as InsightMetricResponse)
      : ({} as InsightMetricResponse);

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
    } as unknown as SocialPlatform;
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

    // Resolve Meta credentials once; if this fails, FB/IG become null but others still work.
    const metaCreds: { pageId: string; pageToken: string } | null =
      await (async () => {
        const pageToken = await resolveFacebookPageToken(pageId);
        return { pageId, pageToken };
      })().catch((e) => {
        console.error(
          "[december-social] Failed to resolve Meta credentials",
          e
        );
        return null;
      });

    const facebook: SocialPlatform | null = await (async () => {
      try {
        if (!metaCreds) return null;
        const { pageToken } = metaCreds;

        // ----- Facebook (views/viewers/visits; followers via internal API)
        const fbBaseline = getBaselinePlatform("Facebook");

        const fbPage = await fetchJsonFromInternal<unknown>(
          req,
          `${baseUrl}/api/facebook/page`
        );
        if (
          fbPage.resp.ok &&
          fbPage.json === null &&
          !fbPage.contentType.toLowerCase().includes("application/json")
        ) {
          throw new Error(
            `Facebook internal route returned non-JSON: ${fbPage.contentType} body="${fbPage.textPreview}"`
          );
        }
        const fbFollowers =
          fbPage.resp.ok && fbPage.json
            ? toNumber(asRecord(fbPage.json).followers)
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

        const fbViewsBaseline = toNumber(asRecord(fbBaseline).views);
        const fbViewersBaseline = toNumber(asRecord(fbBaseline).viewers);
        const fbVisitsBaseline = toNumber(asRecord(fbBaseline).visits);

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

        return {
          ...fbBaseline,
          followers: fbFollowers ?? toNumber(asRecord(fbBaseline).followers),
          views: fbViewsEffective,
          viewers: fbViewersEffective,
          visits: fbVisitsEffective,
          growth_percentage: fbViewsGrowth,
          views_growth: fbViewsGrowth,
          viewers_growth: fbViewersGrowth,
          visit_growth: fbVisitGrowth,
        } as unknown as SocialPlatform;
      } catch (e) {
        console.error("[december-social] Facebook build failed", e);
        return null;
      }
    })();

    const instagram: SocialPlatform | null = await (async () => {
      try {
        if (!metaCreds) return null;
        const { pageToken } = metaCreds;

        // ----- Instagram (reach/views/visits; followers via internal API)
        const igBaseline = getBaselinePlatform("Instagram");

        const igProfile = await fetchJsonFromInternal<unknown>(
          req,
          `${baseUrl}/api/instagram/profile`
        );
        if (
          igProfile.resp.ok &&
          igProfile.json === null &&
          !igProfile.contentType.toLowerCase().includes("application/json")
        ) {
          throw new Error(
            `Instagram internal route returned non-JSON: ${igProfile.contentType} body="${igProfile.textPreview}"`
          );
        }

        const igFollowers =
          igProfile.resp.ok && igProfile.json
            ? toNumber(asRecord(igProfile.json).followers)
            : null;

        const igUserId = await getInstagramBusinessUserId({
          pageId,
          pageToken,
        });

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

        const igReachBaseline = toNumber(asRecord(igBaseline).reach);
        const igViewsBaseline = toNumber(asRecord(igBaseline).views);
        const igVisitsBaseline = toNumber(asRecord(igBaseline).visits);

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

        return {
          ...igBaseline,
          followers: igFollowers ?? toNumber(asRecord(igBaseline).followers),
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
        } as unknown as SocialPlatform;
      } catch (e) {
        console.error("[december-social] Instagram build failed", e);
        return null;
      }
    })();

    const youtube: SocialPlatform | null = await (async () => {
      try {
        // ----- YouTube (current totals; growth vs Nov baseline total views)
        const ytBaseline = getBaselinePlatform("YouTube");
        const yt = await fetchJsonFromInternal<unknown>(
          req,
          `${baseUrl}/api/youtube/channel?handle=MagicworldsTV`
        );

        // If we got HTML, treat this platform as failed (likely protection / routing issue).
        if (
          yt.resp.ok &&
          yt.json === null &&
          !yt.contentType.toLowerCase().includes("application/json")
        ) {
          throw new Error(
            `YouTube internal route returned non-JSON: ${yt.contentType} body="${yt.textPreview}"`
          );
        }

        const ytViews =
          yt.resp.ok && yt.json ? toNumber(asRecord(yt.json).views) : null;
        const ytSubs =
          yt.resp.ok && yt.json
            ? toNumber(asRecord(yt.json).subscribers)
            : null;
        const ytVideos =
          yt.resp.ok && yt.json ? toNumber(asRecord(yt.json).videos) : null;

        const ytViewsGrowth = clampNonNegativeRound2(
          pctChange(ytViews, toNumber(asRecord(ytBaseline).views))
        );

        return {
          ...ytBaseline,
          followers: ytSubs ?? toNumber(asRecord(ytBaseline).followers),
          views: ytViews ?? toNumber(asRecord(ytBaseline).views),
          videos: ytVideos ?? asRecord(ytBaseline).videos,
          growth_percentage: ytViewsGrowth,
          views_growth: ytViewsGrowth,
          description:
            "YouTube is seeing explosive growth—views are accelerating fast as more high-volume content lands and discovery keeps compounding.",
        } as unknown as SocialPlatform;
      } catch (e) {
        console.error("[december-social] YouTube build failed", e);
        return null;
      }
    })();

    const xTwitter: SocialPlatform | null = await (async () => {
      try {
        // ----- X (Twitter) (current totals; growth vs Nov baseline followers)
        const xBaseline = getBaselinePlatform("X (Twitter)");
        const x = await fetchJsonFromInternal<unknown>(
          req,
          `${baseUrl}/api/x/users/me`
        );

        if (
          x.resp.ok &&
          x.json === null &&
          !x.contentType.toLowerCase().includes("application/json")
        ) {
          throw new Error(
            `X internal route returned non-JSON: ${x.contentType} body="${x.textPreview}"`
          );
        }

        const xFollowers =
          x.resp.ok && x.json
            ? toNumber(
                asRecord(asRecord(asRecord(x.json).data).public_metrics)
                  .followers_count
              )
            : null;
        const xPosts =
          x.resp.ok && x.json
            ? toNumber(
                asRecord(asRecord(asRecord(x.json).data).public_metrics)
                  .tweet_count
              )
            : null;

        const xGrowth = clampNonNegativeRound2(
          pctChange(xFollowers, toNumber(asRecord(xBaseline).followers))
        );

        return {
          ...xBaseline,
          followers: xFollowers ?? toNumber(asRecord(xBaseline).followers),
          posts: xPosts ?? asRecord(xBaseline).posts,
          growth_percentage: xGrowth,
        } as unknown as SocialPlatform;
      } catch (e) {
        console.error("[december-social] X build failed", e);
        return null;
      }
    })();

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
