import React, { useState } from "react";

interface PublicMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
}

interface UserData {
  id: string;
  name: string;
  username: string;
  description?: string;
  location?: string;
  profile_image_url?: string;
  url?: string;
  verified?: boolean;
  created_at?: string;
  entities?: {
    url?: {
      urls: Array<{
        url: string;
        expanded_url: string;
        display_url: string;
        indices: number[];
      }>;
    };
    description?: {
      urls?: Array<{
        url: string;
        expanded_url: string;
        display_url: string;
        indices: number[];
      }>;
      mentions?: Array<{
        start: number;
        end: number;
        username: string;
      }>;
    };
  };
  pinned_tweet_id?: string;
  public_metrics?: PublicMetrics;
}

interface UserMeResponse {
  data: UserData;
}

interface TweetPublicMetrics {
  like_count?: number;
  reply_count?: number;
  repost_count?: number;
  quote_count?: number;
  impression_count?: number;
}

interface TweetData {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: TweetPublicMetrics;
}

interface TweetsResponse {
  tweets: TweetData[];
  meta?: {
    result_count?: number;
    next_token?: string;
  };
}

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [tweetsError, setTweetsError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    // Reset state
    setError(null);
    setUserData(null);
    setTweets([]);
    setTweetsError(null);
    setLoading(true);

    try {
      console.log("Fetching user info from /api/x/users/me...");

      // Get user data from Next.js API route
      const meResponse = await fetch("/api/x/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!meResponse.ok) {
        const errorData = await meResponse.json().catch(() => ({}));
        const errorMsg = `Failed to fetch user info: ${meResponse.status} ${meResponse.statusText}`;
        console.error(errorMsg, errorData);
        setError(errorData.error || errorMsg);
        setLoading(false);
        return;
      }

      const meData: UserMeResponse = await meResponse.json();
      const fetchedUserData = meData.data;

      if (!fetchedUserData?.id) {
        const errorMsg = "User data not found in response";
        console.error(errorMsg, meData);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      console.log("✓ User data fetched successfully");
      console.log("=== Complete User Data Object ===");
      console.log(JSON.stringify(meData, null, 2));
      console.log("=== Individual Fields ===");
      console.log("User ID:", fetchedUserData.id);
      console.log("Username:", fetchedUserData.username);
      console.log("Name:", fetchedUserData.name);
      console.log("Description:", fetchedUserData.description);
      console.log("Location:", fetchedUserData.location);
      console.log("URL:", fetchedUserData.url);
      console.log("Profile Image URL:", fetchedUserData.profile_image_url);
      console.log("Verified:", fetchedUserData.verified);
      console.log("Created At:", fetchedUserData.created_at);
      console.log("Pinned Tweet ID:", fetchedUserData.pinned_tweet_id);
      console.log("Entities:", fetchedUserData.entities);
      console.log("=== Public Metrics ===");
      if (fetchedUserData.public_metrics) {
        console.log(
          "Followers Count:",
          fetchedUserData.public_metrics.followers_count
        );
        console.log(
          "Following Count:",
          fetchedUserData.public_metrics.following_count
        );
        console.log("Tweet Count:", fetchedUserData.public_metrics.tweet_count);
        console.log(
          "Listed Count:",
          fetchedUserData.public_metrics.listed_count
        );
        console.log("Complete Public Metrics:", fetchedUserData.public_metrics);
      } else {
        console.log("Public metrics not available");
      }
      console.log("=== End of Logging ===");

      setUserData(fetchedUserData);

      // After successfully fetching user info, fetch recent tweets
      setTweetsLoading(true);
      console.log("Fetching recent tweets from /api/x/users/me/tweets...");
      const tweetsResponse = await fetch(
        "/api/x/users/me/tweets?max_results=20",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!tweetsResponse.ok) {
        const tweetsErrorData = await tweetsResponse.json().catch(() => ({}));
        const tweetsErrorMsg = `Failed to fetch tweets: ${tweetsResponse.status} ${tweetsResponse.statusText}`;
        console.error(tweetsErrorMsg, tweetsErrorData);
        setTweetsError(tweetsErrorData.error || tweetsErrorMsg);
      } else {
        const tweetsData: TweetsResponse = await tweetsResponse.json();
        console.log("✓ Tweets data fetched successfully");
        console.log("Tweets response:", tweetsData);
        setTweets(tweetsData.tweets || []);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Error fetching user info:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
      setTweetsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            X API User Info (Free Tier)
          </h1>

          <button
            onClick={fetchUserInfo}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
          >
            {loading ? "Loading..." : "Fetch User Info"}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200 font-semibold">
                Error:
              </p>
              <p className="text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          )}

          {userData && (
            <>
              {/* Free Tier Limitation Message */}
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
                  Free Tier Limitation:
                </p>
                <p className="text-yellow-600 dark:text-yellow-300 mt-1 text-sm">
                  Follower lists are not available on the free tier. This page
                  shows your follower count and profile information from the
                  `/users/me` endpoint. Tweet metrics such as likes and reposts
                  are shown for recent posts when available, but detailed
                  view/impression counts may require a higher API tier.
                </p>
              </div>

              {/* User Profile Section */}
              <div className="mt-6 p-6 bg-gradient-to-br from-[#40b0bf]/10 via-[#d2a64e]/10 to-[#04d27f]/10 rounded-xl border border-[#40b0bf]/20">
                <div className="flex items-start gap-4">
                  {userData.profile_image_url && (
                    <img
                      src={userData.profile_image_url}
                      alt={`${userData.name}'s profile`}
                      className="w-20 h-20 rounded-full border-2 border-white dark:border-zinc-700"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {userData.name}
                      </h2>
                      {userData.verified && (
                        <span className="text-blue-500" title="Verified">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      @{userData.username}
                    </p>
                    {userData.description && (
                      <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                        {userData.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {userData.location && <span>📍 {userData.location}</span>}
                      {userData.url && (
                        <a
                          href={userData.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#40b0bf] hover:underline"
                        >
                          🔗 Website
                        </a>
                      )}
                      {userData.created_at && (
                        <span>Joined {formatDate(userData.created_at)}</span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 font-mono">
                      ID: {userData.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Public Metrics Section */}
              {userData.public_metrics && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 font-semibold text-sm">
                      Followers
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 mt-1 text-2xl font-bold">
                      {userData.public_metrics.followers_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-semibold text-sm">
                      Following
                    </p>
                    <p className="text-green-600 dark:text-green-300 mt-1 text-2xl font-bold">
                      {userData.public_metrics.following_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-purple-800 dark:text-purple-200 font-semibold text-sm">
                      Tweets
                    </p>
                    <p className="text-purple-600 dark:text-purple-300 mt-1 text-2xl font-bold">
                      {userData.public_metrics.tweet_count.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-orange-800 dark:text-orange-200 font-semibold text-sm">
                      Listed
                    </p>
                    <p className="text-orange-600 dark:text-orange-300 mt-1 text-2xl font-bold">
                      {userData.public_metrics.listed_count.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Info Section */}
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg border border-zinc-200 dark:border-zinc-600">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Additional Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Pinned Tweet ID:
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono">
                      {userData.pinned_tweet_id || "None"}
                    </span>
                  </div>
                  {userData.entities && (
                    <div className="mt-3">
                      <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                        Entities:
                      </p>
                      <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded overflow-auto">
                        {JSON.stringify(userData.entities, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Tweets Summary & List */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Recent Posts & Engagement
                </h3>

                {tweetsLoading && (
                  <div className="mt-2 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#40b0bf]"></div>
                    <span>Fetching recent posts...</span>
                  </div>
                )}

                {tweetsError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                    <p className="text-red-700 dark:text-red-200 font-medium">
                      Could not load recent posts
                    </p>
                    <p className="text-red-600 dark:text-red-300 mt-1">
                      {tweetsError}
                    </p>
                  </div>
                )}

                {!tweetsLoading && !tweetsError && tweets.length === 0 && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    No recent posts were returned by the API for this account.
                  </p>
                )}

                {tweets.length > 0 && (
                  <>
                    {/* Metrics summary */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(() => {
                        const totalLikes = tweets.reduce(
                          (sum, t) => sum + (t.public_metrics?.like_count ?? 0),
                          0
                        );
                        const totalReposts = tweets.reduce(
                          (sum, t) =>
                            sum + (t.public_metrics?.repost_count ?? 0),
                          0
                        );
                        const totalReplies = tweets.reduce(
                          (sum, t) =>
                            sum + (t.public_metrics?.reply_count ?? 0),
                          0
                        );
                        const totalImpressions = tweets.reduce(
                          (sum, t) =>
                            sum + (t.public_metrics?.impression_count ?? 0),
                          0
                        );
                        const count = tweets.length;
                        const avgImpressions =
                          count > 0 ? Math.round(totalImpressions / count) : 0;

                        return (
                          <>
                            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg">
                              <p className="text-sky-800 dark:text-sky-200 font-semibold text-sm">
                                Total Likes
                              </p>
                              <p className="text-sky-600 dark:text-sky-300 mt-1 text-2xl font-bold">
                                {totalLikes.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                              <p className="text-emerald-800 dark:text-emerald-200 font-semibold text-sm">
                                Total Reposts
                              </p>
                              <p className="text-emerald-600 dark:text-emerald-300 mt-1 text-2xl font-bold">
                                {totalReposts.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg">
                              <p className="text-violet-800 dark:text-violet-200 font-semibold text-sm">
                                Total Replies
                              </p>
                              <p className="text-violet-600 dark:text-violet-300 mt-1 text-2xl font-bold">
                                {totalReplies.toLocaleString()}
                              </p>
                            </div>
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <p className="text-amber-800 dark:text-amber-200 font-semibold text-sm">
                                Avg Views per Post
                              </p>
                              <p className="text-amber-600 dark:text-amber-300 mt-1 text-2xl font-bold">
                                {totalImpressions > 0
                                  ? avgImpressions.toLocaleString()
                                  : "N/A"}
                              </p>
                              {totalImpressions === 0 && (
                                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                                  Detailed view counts may not be available on
                                  the current API tier.
                                </p>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Lightweight visualization + list */}
                    <div className="mt-6 space-y-4">
                      {(() => {
                        const maxImpressions = tweets.reduce(
                          (max, t) =>
                            Math.max(
                              max,
                              t.public_metrics?.impression_count ?? 0
                            ),
                          0
                        );

                        return tweets.map((tweet) => {
                          const impressions =
                            tweet.public_metrics?.impression_count ?? 0;
                          const likes = tweet.public_metrics?.like_count ?? 0;
                          const reposts =
                            tweet.public_metrics?.repost_count ?? 0;
                          const replies =
                            tweet.public_metrics?.reply_count ?? 0;
                          const quoteCount =
                            tweet.public_metrics?.quote_count ?? 0;

                          const barWidth =
                            maxImpressions > 0
                              ? `${Math.max(
                                  5,
                                  (impressions / maxImpressions) * 100
                                ).toFixed(0)}%`
                              : "0%";

                          return (
                            <div
                              key={tweet.id}
                              className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/60"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                                    {tweet.text.length > 200
                                      ? `${tweet.text.slice(0, 200)}…`
                                      : tweet.text}
                                  </p>
                                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                                    {tweet.created_at
                                      ? new Date(
                                          tweet.created_at
                                        ).toLocaleString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "2-digit",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Date not available"}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-1 text-right text-xs text-zinc-600 dark:text-zinc-300 min-w-[110px]">
                                  <span>❤️ {likes.toLocaleString()}</span>
                                  <span>🔁 {reposts.toLocaleString()}</span>
                                  <span>💬 {replies.toLocaleString()}</span>
                                  <span>🗨️ {quoteCount.toLocaleString()}</span>
                                  <span>
                                    👁️{" "}
                                    {impressions > 0
                                      ? impressions.toLocaleString()
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>

                              {/* Lightweight bar visualization for views */}
                              <div className="mt-3 h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#40b0bf] via-[#d2a64e] to-[#04d27f]"
                                  style={{ width: barWidth }}
                                />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {loading && (
            <div className="mt-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#40b0bf]"></div>
              <span>Fetching user data...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

