import type { NextApiRequest, NextApiResponse } from "next";
import { getFacebookPageAccessToken } from "@/utils/facebookPageToken";

type FacebookError = {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
};

type PageIgResponse = {
  instagram_business_account?: { id: string };
  error?: FacebookError;
};

type IgInsightsValue = { value: number; end_time?: string };
type IgInsightsDatum = {
  name: string;
  period: string;
  values: IgInsightsValue[];
  title?: string;
  description?: string;
};

type IgInsightsResponse = {
  data?: IgInsightsDatum[];
  error?: FacebookError;
};

type ExtraMetric = {
  key: string;
  label: string;
  value: number | null;
  metricUsed: string | null;
  periodUsed: "day" | "lifetime" | null;
  aggregate: "sum" | "latest";
};

type Payload = {
  igUserId: string;
  impressions: number | null;
  reach: number | null;
  profileViews: number | null;
  extras: ExtraMetric[];
  range: { since: number; until: number; days: number };
  raw: unknown;
  unsupported?: Record<string, string>;
  allFailed?: boolean;
};

type ErrorPayload = { error: string; details?: unknown };

async function resolveFacebookPageToken(pageId: string): Promise<string> {
  const candidate = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!candidate) throw new Error("FACEBOOK_PAGE_ACCESS_TOKEN is not set");

  const userToken =
    process.env.FACEBOOK_USER_ACCESS_TOKEN ||
    candidate ||
    (process.env.FACEBOOK_APP_SECRET?.startsWith("EA")
      ? process.env.FACEBOOK_APP_SECRET
      : candidate);

  try {
    return await getFacebookPageAccessToken({
      pageId,
      userAccessToken: userToken,
      graphVersion: "v20.0",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // If /me/accounts fails because the token is already a Page token, fall back to candidate.
    if (
      msg.toLowerCase().includes("must be called with a user access token") ||
      msg.toLowerCase().includes("requires a user access token")
    ) {
      return candidate;
    }
    return candidate;
  }
}

function sumValues(datum: IgInsightsDatum | undefined): number | null {
  if (!datum || !Array.isArray(datum.values)) return null;
  return datum.values.reduce(
    (sum, v) => sum + (typeof v.value === "number" ? v.value : 0),
    0
  );
}

function latestValue(datum: IgInsightsDatum | undefined): number | null {
  if (!datum || !Array.isArray(datum.values) || datum.values.length === 0)
    return null;
  const last = datum.values[datum.values.length - 1];
  return typeof last.value === "number" ? last.value : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Payload | ErrorPayload>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const pageId = process.env.FACEBOOK_PAGE_ID || "154572707991531";

  // Range: do NOT accept user inputs; always request the maximum supported window.
  // Note: Instagram Graph API insights typically have limited historical windows.
  // This uses the max window we can request in one call (30 days).
  const MAX_DAYS = 30;
  const days = MAX_DAYS;
  const until = Math.floor(Date.now() / 1000);
  const since = until - days * 24 * 60 * 60;

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
    // 1) Derive IG user id
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

    // TypeScript doesn't narrow the type after the check, so we assert it's a string
    const igUserIdString: string = igUserId;

    const unsupported: Record<string, string> = {};
    const rawByMetric: Record<string, unknown> = {};

    async function fetchMetric(metric: string, period: "day" | "lifetime") {
      const url = new URL(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(
          igUserIdString
        )}/insights`
      );
      url.searchParams.set("metric", metric);
      url.searchParams.set("period", period);
      if (period === "day") {
        url.searchParams.set("since", String(since));
        url.searchParams.set("until", String(until));
      }
      url.searchParams.set("access_token", pageToken);

      const resp = await fetch(url.toString());
      const json = (await resp.json()) as IgInsightsResponse;
      return { resp, json, url: url.toString() };
    }

    const shaped: Payload = {
      igUserId: igUserIdString,
      impressions: null,
      reach: null,
      profileViews: null,
      extras: [],
      range: { since, until, days },
      raw: null,
    };

    let successCount = 0;

    // Summary metrics (try common ones; skip unsupported)
    const summaryPlans: Array<{
      field: "impressions" | "reach" | "profileViews";
      metricsToTry: string[];
      preferredPeriod: "day" | "lifetime";
      aggregate: "sum" | "latest";
    }> = [
      {
        field: "impressions",
        metricsToTry: ["impressions"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        field: "reach",
        metricsToTry: ["reach"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
      {
        field: "profileViews",
        metricsToTry: ["profile_views"],
        preferredPeriod: "day",
        aggregate: "sum",
      },
    ];

    for (const plan of summaryPlans) {
      const periods: Array<"day" | "lifetime"> =
        plan.preferredPeriod === "day"
          ? ["day", "lifetime"]
          : ["lifetime", "day"];

      let done = false;
      for (const metric of plan.metricsToTry) {
        for (const period of periods) {
          const { resp, json } = await fetchMetric(metric, period);
          if (!resp.ok) {
            const msg =
              json?.error?.message || `HTTP ${resp.status} ${resp.statusText}`;
            unsupported[`${metric} (${period})`] = msg;
            continue;
          }
          rawByMetric[`${metric} (${period})`] = json;
          const datum = Array.isArray(json.data) ? json.data[0] : undefined;
          const value =
            plan.aggregate === "latest" ? latestValue(datum) : sumValues(datum);
          shaped[plan.field] = value;
          successCount += 1;
          done = true;
          break;
        }
        if (done) break;
      }
    }

    // Extra metrics (best-effort; may be unavailable depending on account)
    const extraPlans: Array<{
      key: string;
      label: string;
      metric: string;
      period: "day" | "lifetime";
      aggregate: "sum" | "latest";
    }> = [
      {
        key: "websiteClicks",
        label: "Website Clicks",
        metric: "website_clicks",
        period: "day",
        aggregate: "sum",
      },
      {
        key: "emailContacts",
        label: "Email Contacts",
        metric: "email_contacts",
        period: "day",
        aggregate: "sum",
      },
      {
        key: "phoneCallClicks",
        label: "Phone Call Clicks",
        metric: "phone_call_clicks",
        period: "day",
        aggregate: "sum",
      },
      {
        key: "getDirectionsClicks",
        label: "Get Directions Clicks",
        metric: "get_directions_clicks",
        period: "day",
        aggregate: "sum",
      },
      {
        key: "textMessageClicks",
        label: "Text Message Clicks",
        metric: "text_message_clicks",
        period: "day",
        aggregate: "sum",
      },
    ];

    for (const plan of extraPlans) {
      const periods: Array<"day" | "lifetime"> =
        plan.period === "day" ? ["day", "lifetime"] : ["lifetime", "day"];
      let metricUsed: string | null = null;
      let periodUsed: "day" | "lifetime" | null = null;
      let value: number | null = null;

      for (const period of periods) {
        const { resp, json } = await fetchMetric(plan.metric, period);
        if (!resp.ok) {
          const msg =
            json?.error?.message || `HTTP ${resp.status} ${resp.statusText}`;
          unsupported[`${plan.metric} (${period})`] = msg;
          continue;
        }
        rawByMetric[`${plan.metric} (${period})`] = json;
        const datum = Array.isArray(json.data) ? json.data[0] : undefined;
        value =
          plan.aggregate === "latest" ? latestValue(datum) : sumValues(datum);
        metricUsed = plan.metric;
        periodUsed = period;
        successCount += 1;
        break;
      }

      shaped.extras.push({
        key: plan.key,
        label: plan.label,
        value,
        metricUsed,
        periodUsed,
        aggregate: plan.aggregate,
      });
    }

    shaped.raw = { page: pageJson, rawByMetric };
    if (Object.keys(unsupported).length > 0) shaped.unsupported = unsupported;
    if (successCount === 0) shaped.allFailed = true;

    return res.status(200).json(shaped);
  } catch (e) {
    return res.status(500).json({
      error: "Unexpected error while fetching Instagram insights",
      details: e instanceof Error ? e.message : String(e),
    });
  }
}
