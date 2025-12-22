import React, { useState } from "react";

interface InstagramProfileData {
  igUserId: string;
  username: string | null;
  name: string | null;
  profilePictureUrl: string | null;
  followers: number | null;
  following: number | null;
  mediaCount: number | null;
  raw: unknown;
}

interface InstagramInsightsData {
  igUserId: string;
  impressions: number | null;
  reach: number | null;
  profileViews: number | null;
  extras: Array<{
    key: string;
    label: string;
    value: number | null;
    metricUsed: string | null;
    periodUsed: "day" | "lifetime" | null;
    aggregate: "sum" | "latest";
  }>;
  range: { since: number; until: number; days: number };
  raw: unknown;
  unsupported?: Record<string, string>;
  allFailed?: boolean;
}

export default function InstagramPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<InstagramProfileData | null>(null);
  const [insights, setInsights] = useState<InstagramInsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const fetchInstagram = async () => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setInsights(null);
    setInsightsError(null);

    try {
      const profileResp = await fetch("/api/instagram/profile");
      const profileJson = await profileResp.json();

      if (!profileResp.ok) {
        console.error("[Instagram] Profile API error:", profileJson);
        setError(profileJson.error || "Failed to load Instagram profile");
        return;
      }

      console.log("[Instagram] Raw profile payload:", profileJson.raw);
      setProfile(profileJson as InstagramProfileData);

      setInsightsLoading(true);
      try {
        const insightsResp = await fetch("/api/instagram/insights");
        const insightsJson = await insightsResp.json();

        if (!insightsResp.ok) {
          console.error("[Instagram] Insights API error:", insightsJson);
          setInsightsError(insightsJson.error || "Failed to load IG insights");
        } else {
          console.log("[Instagram] Raw insights payload:", insightsJson.raw);
          setInsights(insightsJson as InstagramInsightsData);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setInsightsError(msg);
      } finally {
        setInsightsLoading(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value == null) return "N/A";
    return value.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          Instagram (Derived from Facebook Page)
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <button
            onClick={fetchInstagram}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 via-fuchsia-500 to-indigo-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {loading ? "Loading..." : "Load Instagram Profile + Insights"}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold">
              Error
            </p>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {profile && (
          <div className="mt-6 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg">
              <div className="flex items-start gap-4">
                {profile.profilePictureUrl && (
                  <img
                    src={profile.profilePictureUrl}
                    alt="Instagram profile"
                    className="h-16 w-16 rounded-full border border-zinc-200 dark:border-zinc-700"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {profile.name ?? profile.username ?? "Instagram"}
                  </h2>
                  {profile.username && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      @{profile.username}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
                    IG ID: {profile.igUserId}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Followers"
                value={formatNumber(profile.followers)}
              />
              <StatCard
                label="Following"
                value={formatNumber(profile.following)}
              />
              <StatCard
                label="Posts"
                value={formatNumber(profile.mediaCount)}
              />
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Insights
                {insights?.range?.days
                  ? ` (Last ${insights.range.days} Days)`
                  : ""}
              </h3>

              {insightsLoading && (
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                      label="Impressions"
                      value={formatNumber(insights.impressions)}
                    />
                    <StatCard
                      label="Reach"
                      value={formatNumber(insights.reach)}
                    />
                    <StatCard
                      label="Profile Views"
                      value={formatNumber(insights.profileViews)}
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

