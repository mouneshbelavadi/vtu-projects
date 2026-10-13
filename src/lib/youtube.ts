/**
 * YouTube URL Parser and Embed utilities.
 * Validates YouTube URLs without ever requesting the external URL from the server (SSRF prevention).
 */

export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();

  // Must match strict allowed domains
  if (
    !trimmed.startsWith("https://www.youtube.com/") &&
    !trimmed.startsWith("https://youtube.com/") &&
    !trimmed.startsWith("https://youtu.be/")
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Format: https://youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0]?.split("?")[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return id;
      }
    }

    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }

      // Format: https://www.youtube.com/embed/VIDEO_ID
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.slice(7).split("/")[0]?.split("?")[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
          return id;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null;

  const videoId =
    urlOrId.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(urlOrId)
      ? urlOrId
      : extractYouTubeVideoId(urlOrId);

  if (!videoId) return null;

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
