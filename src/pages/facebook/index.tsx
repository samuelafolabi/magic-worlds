import React, { useState } from "react";

interface FacebookPageData {
  id: string;
  name: string;
  about: string | null;
  likes: number | null;
  followers: number | null;
  link: string | null;
  category: string | null;
  raw: unknown;
}

interface FacebookInsightsData {
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
}

export default function FacebookPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<FacebookPageData | null>(null);
  const [insights, setInsights] = useState<FacebookInsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchPageMetrics = async () => {
    setLoading(true);
    setError(null);
    setPage(null);
    setInsights(null);
    setInsightsError(null);

    try {
      const resp = await fetch("/api/facebook/page", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await resp.json();

      if (!resp.ok) {
        console.error("[Facebook] API route error:", json);
        setError(json.error || "Failed to load Facebook page metrics");
        return;
      }

      console.log("[Facebook] Raw page payload:", json.raw);
      setPage(json as FacebookPageData);

      // After successfully fetching page data, fetch insights
      setInsightsLoading(true);
      try {
        const insightsResp = await fetch("/api/facebook/insights", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const insightsJson = await insightsResp.json();

        if (!insightsResp.ok) {
          console.error("[Facebook Insights] API route error:", insightsJson);
          setInsightsError(
            insightsJson.error || "Failed to load Facebook page insights"
          );
        } else {
          console.log(
            "[Facebook Insights] Raw insights payload:",
            insightsJson.raw
          );
          setInsights(insightsJson as FacebookInsightsData);
        }
      } catch (insightsErr) {
        console.error(
          "[Facebook Insights] Error fetching insights:",
          insightsErr
        );
        const insightsMessage =
          insightsErr instanceof Error
            ? insightsErr.message
            : "Unexpected error occurred";
        setInsightsError(insightsMessage);
      } finally {
        setInsightsLoading(false);
      }
    } catch (err) {
      console.error("[Facebook] Error fetching page metrics:", err);
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number | null) => {
    if (value == null) return "N/A";
    return value.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          Facebook Page: Magic Worlds
        </h1>

        <button
          onClick={fetchPageMetrics}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
        >
          {loading ? "Loading..." : "Load Facebook Page Metrics"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold">
              Error
            </p>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {page && (
          <div className="mt-6 space-y-6">
            {/* Page Info Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg">
              <div className="flex flex-col gap-2">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {page.name}
                  </h2>
                  {page.category && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {page.category}
                    </p>
                  )}
                </div>

                {page.about && (
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                    {page.about}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {page.link && (
                    <a
                      href={page.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Page on Facebook
                    </a>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
                    ID: {page.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Followers"
                value={formatNumber(page.followers)}
              />
              <StatCard label="Likes" value={formatNumber(page.likes)} />
            </div>

            {/* Page Insights Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Page Insights
                {insights?.range?.days
                  ? ` (Last ${insights.range.days} Days)`
                  : ""}
              </h3>

              {insightsLoading && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Loading insights...</span>
                </div>
              )}

              {insightsError && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
                  <p className="text-yellow-700 dark:text-yellow-200 font-medium">
                    Insights unavailable
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-300 mt-1">
                    {insightsError}
                  </p>
                </div>
              )}

              {insights && !insightsLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      label="Impressions / Views"
                      value={formatNumber(insights.impressions)}
                    />
                    <StatCard
                      label="Reach"
                      value={formatNumber(insights.reach)}
                    />
                    <StatCard
                      label="Engagements"
                      value={formatNumber(insights.engagedUsers)}
                    />
                    <StatCard
                      label="Page Views"
                      value={formatNumber(insights.pageViews)}
                    />
                    <StatCard
                      label="Follows (Lifetime)"
                      value={formatNumber(insights.fans)}
                    />
                  </div>

                  {Array.isArray(insights.extras) &&
                    insights.extras.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Extra Insights
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {insights.extras.map((m) => (
                            <StatCard
                              key={m.key}
                              label={m.label}
                              value={formatNumber(m.value)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span>Loading Facebook metrics...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
