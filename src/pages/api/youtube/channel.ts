import type { NextApiRequest, NextApiResponse } from "next";

interface ChannelResponse {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subscribers: string | null;
  views: string | null;
  videos: string | null;
  raw: unknown;
}

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChannelResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not configured in the environment");
    return res.status(500).json({
      error: "Server configuration error: YOUTUBE_API_KEY is not set",
    });
  }

  const handleParam = req.query.handle;
  const handle =
    typeof handleParam === "string" && handleParam.trim().length > 0
      ? handleParam.trim()
      : "MagicworldsTV";

  try {
    // Step 1: search for the channel by handle/name
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("q", handle);
    searchUrl.searchParams.set("maxResults", "1");
    searchUrl.searchParams.set("key", apiKey);

    console.log(
      "[YouTube] Searching for channel",
      handle,
      "via",
      searchUrl.toString()
    );

    const searchResp = await fetch(searchUrl.toString());
    const searchJson = await searchResp.json();

    if (!searchResp.ok) {
      console.error("[YouTube] search.list error", {
        status: searchResp.status,
        statusText: searchResp.statusText,
        body: searchJson,
      });
      return res.status(searchResp.status).json({
        error: `YouTube search failed: ${searchResp.status} ${searchResp.statusText}`,
        details: searchJson,
      });
    }

    const firstItem = Array.isArray(searchJson.items)
      ? searchJson.items[0]
      : undefined;

    const channelId: string | undefined =
      firstItem?.snippet?.channelId ?? firstItem?.id?.channelId;

    if (!channelId) {
      console.warn("[YouTube] No channel found for handle", handle);
      return res.status(404).json({
        error: `Channel not found for handle: ${handle}`,
        details: searchJson,
      });
    }

    // Step 2: get channel details (snippet + statistics)
    const channelsUrl = new URL(
      "https://www.googleapis.com/youtube/v3/channels"
    );
    channelsUrl.searchParams.set("part", "snippet,statistics");
    channelsUrl.searchParams.set("id", channelId);
    channelsUrl.searchParams.set("key", apiKey);

    console.log(
      "[YouTube] Fetching channel details via",
      channelsUrl.toString()
    );

    const channelResp = await fetch(channelsUrl.toString());
    const channelJson = await channelResp.json();

    if (!channelResp.ok) {
      console.error("[YouTube] channels.list error", {
        status: channelResp.status,
        statusText: channelResp.statusText,
        body: channelJson,
      });
      return res.status(channelResp.status).json({
        error: `Failed to fetch channel details: ${channelResp.status} ${channelResp.statusText}`,
        details: channelJson,
      });
    }

    const channelItem = Array.isArray(channelJson.items)
      ? channelJson.items[0]
      : undefined;

    if (!channelItem) {
      console.warn("[YouTube] No channel details found for id", channelId);
      return res.status(404).json({
        error: `Channel details not found for id: ${channelId}`,
        details: channelJson,
      });
    }

    const snippet = channelItem.snippet ?? {};
    const statistics = channelItem.statistics ?? {};

    const title: string = snippet.title ?? "Unknown Channel";
    const description: string = snippet.description ?? "";

    const thumbnailUrl: string | null =
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      null;

    // subscriberCount may be hidden; statistics.hiddenSubscriberCount may be true
    const subscribers: string | null =
      statistics.hiddenSubscriberCount === true
        ? null
        : statistics.subscriberCount ?? null;

    const views: string | null = statistics.viewCount ?? null;
    const videos: string | null = statistics.videoCount ?? null;

    const shaped: ChannelResponse = {
      title,
      description,
      thumbnailUrl,
      subscribers,
      views,
      videos,
      raw: channelJson,
    };

    console.log("[YouTube] Channel details shaped successfully for", title);

    return res.status(200).json(shaped);
  } catch (err) {
    console.error("[YouTube] Unexpected error fetching channel", err);
    return res.status(500).json({
      error: "Unexpected error while fetching YouTube channel",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

