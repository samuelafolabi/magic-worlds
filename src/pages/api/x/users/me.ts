import type { NextApiRequest, NextApiResponse } from "next";
import { createAuthorizationHeader } from "@/utils/oauth1";

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

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserMeResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Read OAuth 1.0a credentials from environment variables
    const consumerKey = process.env.X_API_KEY;
    const consumerSecret = process.env.X_API_KEY_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      console.error(
        "OAuth 1.0a credentials not found in environment variables"
      );
      return res.status(500).json({
        error: "OAuth 1.0a credentials not configured",
      });
    }

    // Request all available user fields including public_metrics
    const userFields =
      "public_metrics,description,location,profile_image_url,url,verified,created_at,entities,pinned_tweet_id";
    const apiUrl = `https://api.x.com/2/users/me?user.fields=${encodeURIComponent(
      userFields
    )}`;
    console.log("API Route: Fetching user data from X API /users/me...");
    console.log("Requesting fields:", userFields);

    // Generate OAuth 1.0a Authorization header
    const authHeader = createAuthorizationHeader(
      "GET",
      apiUrl,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );

    // Make server-side request to X API with OAuth 1.0a authentication
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        `X API error: ${response.status} ${response.statusText}`,
        errorData
      );
      return res.status(response.status).json({
        error: `Failed to fetch user ID: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    const data: UserMeResponse = await response.json();

    console.log("✓ User data fetched successfully");
    console.log("Complete API response:", JSON.stringify(data, null, 2));
    console.log("User ID:", data.data?.id);
    console.log("Username:", data.data?.username);
    console.log("Name:", data.data?.name);
    console.log("Public Metrics:", data.data?.public_metrics);
    console.log("Description:", data.data?.description);
    console.log("Location:", data.data?.location);
    console.log("URL:", data.data?.url);
    console.log("Verified:", data.data?.verified);
    console.log("Created At:", data.data?.created_at);
    console.log("Profile Image URL:", data.data?.profile_image_url);
    console.log("Pinned Tweet ID:", data.data?.pinned_tweet_id);
    console.log("Entities:", data.data?.entities);

    // Return the response data
    res.status(200).json(data);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error in /api/x/users/me:", err);
    res.status(500).json({
      error: errorMessage,
    });
  }
}
