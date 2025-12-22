import type { NextApiRequest, NextApiResponse } from "next";
import { createAuthorizationHeader } from "@/utils/oauth1";

interface TweetPublicMetrics {
  like_count?: number;
  reply_count?: number;
  repost_count?: number;
  quote_count?: number;
  impression_count?: number; // views/impressions if available on tier
}

interface TweetData {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: TweetPublicMetrics;
}

interface UserTweetsResponse {
  data?: TweetData[];
  meta?: {
    result_count?: number;
    next_token?: string;
  };
}

interface NormalizedTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics: TweetPublicMetrics;
}

interface NormalizedTweetsResponse {
  tweets: NormalizedTweet[];
  meta?: UserTweetsResponse["meta"];
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NormalizedTweetsResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const consumerKey = process.env.X_API_KEY;
    const consumerSecret = process.env.X_API_KEY_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      console.error(
        "OAuth 1.0a credentials not found in environment variables for tweets endpoint"
      );
      return res.status(500).json({
        error: "OAuth 1.0a credentials not configured",
      });
    }

    // First, resolve the authenticated user's ID via /users/me
    const userFields = "id";
    const userMeUrl = `https://api.x.com/2/users/me?user.fields=${encodeURIComponent(
      userFields
    )}`;

    console.log(
      "API Route: Resolving authenticated user ID from X API /users/me before fetching tweets..."
    );

    const userMeAuthHeader = createAuthorizationHeader(
      "GET",
      userMeUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    const userMeResponse = await fetch(userMeUrl, {
      method: "GET",
      headers: {
        Authorization: userMeAuthHeader,
        "Content-Type": "application/json",
      },
    });

    if (!userMeResponse.ok) {
      const errorData = await userMeResponse.json().catch(() => ({}));
      console.error(
        `X API error (resolve /users/me for tweets): ${userMeResponse.status} ${userMeResponse.statusText}`,
        errorData
      );
      return res.status(userMeResponse.status).json({
        error: `Failed to resolve authenticated user ID before fetching tweets: ${userMeResponse.status} ${userMeResponse.statusText}`,
        details: errorData,
      });
    }

    const userMeData = (await userMeResponse.json()) as {
      data?: { id?: string };
    };

    const userId = userMeData.data?.id;

    if (!userId) {
      console.error(
        "Could not resolve authenticated user ID from /users/me response:",
        userMeData
      );
      return res.status(500).json({
        error: "Authenticated user ID not found in /users/me response",
        details: userMeData,
      });
    }

    const maxResultsParam = req.query.max_results;
    const maxResults =
      typeof maxResultsParam === "string" ? maxResultsParam : "10";

    const tweetFields = "created_at,public_metrics";
    const tweetsUrl = `https://api.x.com/2/users/${encodeURIComponent(
      userId
    )}/tweets?tweet.fields=${encodeURIComponent(
      tweetFields
    )}&max_results=${encodeURIComponent(maxResults)}`;

    console.log(
      `API Route: Fetching tweets for authenticated user (${userId}) from X API /users/:id/tweets...`
    );
    console.log("Requesting tweet fields:", tweetFields);
    console.log("Max results:", maxResults);

    const tweetsAuthHeader = createAuthorizationHeader(
      "GET",
      tweetsUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    const response = await fetch(tweetsUrl, {
      method: "GET",
      headers: {
        Authorization: tweetsAuthHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `X API error (tweets): ${response.status} ${response.statusText}`,
        errorData
      );
      return res.status(response.status).json({
        error: `Failed to fetch tweets: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    const data: UserTweetsResponse = await response.json();

    console.log("✓ Tweets fetched successfully");
    console.log(
      "Tweets meta:",
      JSON.stringify(
        data.meta ?? { result_count: data.data?.length ?? 0 },
        null,
        2
      )
    );
    console.log(
      "Sample tweet:",
      data.data && data.data.length > 0 ? data.data[0] : "No tweets in response"
    );

    const normalized: NormalizedTweet[] =
      data.data?.map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        public_metrics: {
          like_count: tweet.public_metrics?.like_count,
          reply_count: tweet.public_metrics?.reply_count,
          repost_count: tweet.public_metrics?.repost_count,
          quote_count: tweet.public_metrics?.quote_count,
          impression_count: tweet.public_metrics?.impression_count,
        },
      })) ?? [];

    return res.status(200).json({
      tweets: normalized,
      meta: data.meta,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error in /api/x/users/me/tweets:", err);
    return res.status(500).json({
      error: errorMessage,
    });
  }
}

