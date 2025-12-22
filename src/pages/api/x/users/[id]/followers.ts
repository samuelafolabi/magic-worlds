import type { NextApiRequest, NextApiResponse } from "next";
import { createAuthorizationHeader } from "@/utils/oauth1";

interface Follower {
  id: string;
  name: string;
  username: string;
}

interface FollowersResponse {
  data: Follower[];
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FollowersResponse | ErrorResponse>
) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        error: "User ID is required",
      });
    }

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

    const apiUrl = `https://api.x.com/2/users/${id}/followers`;
    console.log(`API Route: Fetching followers for user ID ${id}...`);

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
        error: `Failed to fetch followers: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    const data: FollowersResponse = await response.json();
    const count = data.meta?.result_count || data.data?.length || 0;

    console.log("✓ Followers fetched successfully");
    console.log("Followers count:", count);
    console.log("Followers data:", data.data);
    console.log("Full response:", data);

    // Return the response data
    res.status(200).json(data);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error in /api/x/users/[id]/followers:", err);
    res.status(500).json({
      error: errorMessage,
    });
  }
}
