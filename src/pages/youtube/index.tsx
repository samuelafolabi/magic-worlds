import React, { useState } from "react";

interface ChannelData {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subscribers: string | null;
  views: string | null;
  videos: string | null;
  raw: unknown;
}

export default function YoutubePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<ChannelData | null>(null);

  const fetchChannel = async () => {
    setLoading(true);
    setError(null);
    setChannel(null);

    try {
      const resp = await fetch("/api/youtube/channel?handle=MagicworldsTV", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const json = await resp.json();

      if (!resp.ok) {
        console.error("[YouTube] API route error:", json);
        setError(json.error || "Failed to load channel details");
        return;
      }

      console.log("[YouTube] Raw channel payload:", json.raw);
      setChannel(json as ChannelData);
    } catch (err) {
      console.error("[YouTube] Error fetching channel:", err);
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: string | null) => {
    if (!value) return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          YouTube Channel: MagicworldsTV
        </h1>

        <button
          onClick={fetchChannel}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
        >
          {loading ? "Loading..." : "Load Channel Details"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 font-semibold">
              Error
            </p>
            <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}

        {channel && (
          <div className="mt-6 space-y-6">
            <div className="flex gap-4 items-start">
              {channel.thumbnailUrl && (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  className="w-24 h-24 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {channel.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line">
                  {channel.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Subscribers"
                value={
                  channel.subscribers
                    ? formatNumber(channel.subscribers)
                    : "Hidden"
                }
              />
              <StatCard
                label="Total Views"
                value={formatNumber(channel.views)}
              />
              <StatCard label="Videos" value={formatNumber(channel.videos)} />
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
