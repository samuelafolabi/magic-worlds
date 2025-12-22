import type { NextApiRequest, NextApiResponse } from "next";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

interface InsightValue {
  value: number;
  end_time?: string;
}

interface InsightData {
  name: string;
  period: string;
  values: InsightValue[];
  title: string;
  description: string;
}

interface InsightsResponse {
  impressions: number | null;
  reach: number | null;
  engagedUsers: number | null;
  fans: number | null;
  pageViews: number | null;
  extras?: Array<{
    key: string;
    label: string;
    value: number | null;
    metricUsed: string | null;
    periodUsed: "day" | "lifetime" | null;
    aggregate: "sum" | "latest";
  }>;
  range?: { since: number; until: number; days: number };
  raw: unknown;
  unsupported?: Record<string, string>;
  allFailed?: boolean;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InsightsResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID || "154572707991531";

  let pageAccessToken: string;

  // Preferred: use a Page access token directly (recommended for Vercel env-only setups)
  if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  } else {
    // Fallback: derive the Page token via /me/accounts using a *user* access token.
    const userAccessToken =
      process.env.FACEBOOK_USER_ACCESS_TOKEN ||
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
        "[Facebook Insights] Failed to resolve Page access token via /me/accounts",
        e
      );
      return res.status(401).json({
        error:
          "Failed to resolve Page access token from /me/accounts. Ensure the user access token is valid and has pages permissions.",
        details: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // If the provided token isn't actually a Page token, Insights will return:
  // "(#190) This method must be called with a Page Access Token"
  // In that case, try to derive a real Page token via /me/accounts (if we have a user token).
  const probeUrl = new URL(
    `https://graph.facebook.com/v20.0/${encodeURIComponent(pageId)}/insights`
  );
  probeUrl.searchParams.set("metric", "page_follows");
  probeUrl.searchParams.set("period", "lifetime");
  probeUrl.searchParams.set("access_token", pageAccessToken);

  try {
    const probeResp = await fetch(probeUrl.toString());
    const probeJson = await probeResp.json();

    const probeMsg: string | undefined =
      probeJson?.error && typeof probeJson.error.message === "string"
        ? probeJson.error.message
        : undefined;

    const needsPageToken =
      probeResp.status === 400 &&
      typeof probeMsg === "string" &&
      probeMsg.includes("must be called with a Page Access Token");

    if (!probeResp.ok && needsPageToken) {
      // If the env var named FACEBOOK_PAGE_ACCESS_TOKEN actually contains a user token,
      // we can still use it to derive a real Page token via /me/accounts.
      const userAccessToken =
        process.env.FACEBOOK_USER_ACCESS_TOKEN ||
        process.env.FACEBOOK_PAGE_ACCESS_TOKEN ||
        (process.env.FACEBOOK_APP_SECRET?.startsWith("EA")
          ? process.env.FACEBOOK_APP_SECRET
          : undefined);
      if (!userAccessToken) {
        return res.status(401).json({
          error:
            "Your FACEBOOK_PAGE_ACCESS_TOKEN is not a Page token (Insights requires a Page Access Token). Replace it with the Page token from /me/accounts, or set FACEBOOK_USER_ACCESS_TOKEN so the server can derive a Page token automatically.",
          details: probeJson,
        });
      }

      pageAccessToken = await getFacebookPageAccessToken({
        pageId,
        userAccessToken,
        graphVersion: "v20.0",
      });
    }
  } catch {
    // If the probe fails unexpectedly, continue; the main fetches below will capture errors.
  }

  // Date range: do NOT accept user inputs; always use a fixed window.
  // Using 30 days keeps requests lighter and matches Instagram constraints.
  const MAX_DAYS = 30;
  const days = MAX_DAYS;
  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 24 * 60 * 60;

  try {
    const baseUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(
      pageId
    )}/insights`;

    const sumInsightValues = (
      insight: InsightData | undefined
    ): number | null => {
      if (!insight || !Array.isArray(insight.values)) return null;
      return insight.values.reduce(
        (sum, val) => sum + (typeof val.value === "number" ? val.value : 0),
        0
      );
    };

    const getLatestValue = (
      insight: InsightData | undefined
    ): number | null => {
      if (
        !insight ||
        !Array.isArray(insight.values) ||
        insight.values.length === 0
      )
        return null;
      const latest = insight.values[insight.values.length - 1];
      return typeof latest.value === "number" ? latest.value : null;
    };

    type MetricPlan = {
      field: "impressions" | "reach" | "engagedUsers" | "fans" | "pageViews";
      metricsToTry: string[];
      preferredPeriod: "day" | "lifetime";
      aggregate: "sum" | "latest";
    };

    type ExtraMetricPlan = {
      key: string;
      label: string;
      metricsToTry: string[];
      preferredPeriod: "day" | "lifetime";
      aggregate: "sum" | "latest";
    };

    // Some metrics are only available for certain Page types / permissions / API changes.
    // We fetch them individually so one invalid metric doesn't break the whole response.
    const metricPlans: MetricPlan[] = [
      {
        field: "impressions",
        metricsToTry: ["page_media_view", "views", "page_impressions"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        field: "reach",
        // Some pages return "page_impressions_unique" as the daily unique reach metric.
        metricsToTry: [
          "page_impressions_unique",
          "page_reach",
          "page_reach_unique",
        ],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        field: "engagedUsers",
        metricsToTry: ["page_engaged_users", "page_post_engagements"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        field: "pageViews",
        metricsToTry: [
          "page_views_total",
          "page_views_logged_in_total",
          "page_views",
        ],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      // Historically this was used as "fans/likes" count. If unsupported, it will be skipped.
      {
        field: "fans",
        metricsToTry: ["page_fans", "page_follows"],
        preferredPeriod: "lifetime",
        aggregate: "latest",
      },
    ];

    // "As many as possible" extras: we try a broad set of commonly-useful metrics,
    // and record unsupported ones rather than failing the whole response.
    const extraMetricPlans: ExtraMetricPlan[] = [
      {
        key: "postReactionsTotal",
        label: "Post Reactions (Total)",
        metricsToTry: ["page_actions_post_reactions_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsLike",
        label: "Reactions: Like",
        metricsToTry: ["page_actions_post_reactions_like_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsLove",
        label: "Reactions: Love",
        metricsToTry: ["page_actions_post_reactions_love_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsWow",
        label: "Reactions: Wow",
        metricsToTry: ["page_actions_post_reactions_wow_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsHaha",
        label: "Reactions: Haha",
        metricsToTry: ["page_actions_post_reactions_haha_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsSorry",
        label: "Reactions: Sorry",
        metricsToTry: ["page_actions_post_reactions_sorry_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "postReactionsAnger",
        label: "Reactions: Anger",
        metricsToTry: ["page_actions_post_reactions_anger_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "videoViews",
        label: "Video Views",
        metricsToTry: ["page_video_views", "page_video_views_unique"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "viewsLoggedIn",
        label: "Page Views (Logged-in)",
        metricsToTry: ["page_views_logged_in_total"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        key: "follows",
        label: "Follows (Lifetime)",
        metricsToTry: ["page_follows"],
        preferredPeriod: "lifetime",
        aggregate: "latest",
      },
    ];

    const unsupported: Record<string, string> = {};
    const rawByMetric: Record<string, unknown> = {};

    const shaped: InsightsResponse = {
      impressions: null,
      reach: null,
      engagedUsers: null,
      fans: null,
      pageViews: null,
      extras: [],
      range: { since, until, days },
      raw: null,
    };

    let successCount = 0;
    let lastFailure: {
      status: number;
      statusText: string;
      body: unknown;
    } | null = null;

    async function fetchSingleMetric(
      metric: string,
      period: "day" | "lifetime"
    ) {
      const url = new URL(baseUrl);
      url.searchParams.set("metric", metric);
      url.searchParams.set("period", period);
      if (period === "day") {
        url.searchParams.set("since", String(since));
        url.searchParams.set("until", String(until));
      }
      url.searchParams.set("access_token", pageAccessToken);

      console.log(
        "[Facebook Insights] Fetching metric",
        metric,
        "period",
        period,
        "via",
        url.toString().replace(pageAccessToken, "***")
      );

      const response = await fetch(url.toString());
      const json = await response.json();
      return { response, json };
    }

    for (const plan of metricPlans) {
      const periodsToTry: Array<"day" | "lifetime"> =
        plan.preferredPeriod === "day"
          ? ["day", "lifetime"]
          : ["lifetime", "day"];

      let fieldSucceeded = false;

      for (const metric of plan.metricsToTry) {
        for (const period of periodsToTry) {
          try {
            const { response, json } = await fetchSingleMetric(metric, period);

            if (!response.ok) {
              lastFailure = {
                status: response.status,
                statusText: response.statusText,
                body: json,
              };

              const err = asRecord(asRecord(json).error);
              const errMsg =
                typeof err.message === "string" ? err.message : undefined;
              const message =
                errMsg ||
                `HTTP ${response.status} ${response.statusText}`;

              unsupported[`${metric} (${period})`] = message;
              continue;
            }

            rawByMetric[`${metric} (${period})`] = json;

            const insightsData: InsightData[] = Array.isArray(json?.data)
              ? json.data
              : [];
            const insight = insightsData[0];

            const value =
              plan.aggregate === "latest"
                ? getLatestValue(insight)
                : sumInsightValues(insight);

            shaped[plan.field] = value;
            successCount += 1;
            fieldSucceeded = true;
            break;
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            unsupported[`${metric} (${period})`] = message;
          }
        }

        if (fieldSucceeded) break;
      }
    }

    // Fetch extras
    for (const plan of extraMetricPlans) {
      const periodsToTry: Array<"day" | "lifetime"> =
        plan.preferredPeriod === "day"
          ? ["day", "lifetime"]
          : ["lifetime", "day"];

      let metricUsed: string | null = null;
      let periodUsed: "day" | "lifetime" | null = null;
      let value: number | null = null;

      for (const metric of plan.metricsToTry) {
        for (const period of periodsToTry) {
          try {
            const { response, json } = await fetchSingleMetric(metric, period);

            if (!response.ok) {
              lastFailure = {
                status: response.status,
                statusText: response.statusText,
                body: json,
              };

              const err = asRecord(asRecord(json).error);
              const errMsg =
                typeof err.message === "string" ? err.message : undefined;
              const message =
                errMsg ||
                `HTTP ${response.status} ${response.statusText}`;

              unsupported[`${metric} (${period})`] = message;
              continue;
            }

            rawByMetric[`${metric} (${period})`] = json;

            const insightsData: InsightData[] = Array.isArray(json?.data)
              ? json.data
              : [];
            const insight = insightsData[0];

            value =
              plan.aggregate === "latest"
                ? getLatestValue(insight)
                : sumInsightValues(insight);

            metricUsed = metric;
            periodUsed = period;
            break;
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            unsupported[`${metric} (${period})`] = message;
          }
        }
        if (metricUsed) break;
      }

      shaped.extras?.push({
        key: plan.key,
        label: plan.label,
        value,
        metricUsed,
        periodUsed,
        aggregate: plan.aggregate,
      });
    }

    shaped.raw = {
      rawByMetric,
      since,
      until,
      days,
      attempted: metricPlans.map((p) => ({
        field: p.field,
        metricsToTry: p.metricsToTry,
        preferredPeriod: p.preferredPeriod,
      })),
    };
    if (Object.keys(unsupported).length > 0) shaped.unsupported = unsupported;
    if (successCount === 0) shaped.allFailed = true;

    console.log("[Facebook Insights] Insights shaped successfully", {
      successCount,
      unsupportedCount: Object.keys(unsupported).length,
    });

    return res.status(200).json(shaped);
  } catch (err) {
    console.error(
      "[Facebook Insights] Unexpected error fetching insights",
      err
    );
    return res.status(500).json({
      error: "Unexpected error while fetching Facebook page insights",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
