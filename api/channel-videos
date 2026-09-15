// Fetches every public, non-Short video from ONE channel — either its full
// uploads (default) or one specific playlist if `playlistId` is passed — and
// re-validates each video's channelId server-side — exactly the same
// guarantee as the Physics Focus app, just for whichever channel the user
// picked instead of a hardcoded one.

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = {}; // cacheKey -> { data, at }  (in-memory, resets on cold start — fine, just re-fetches)

function parseISODuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || [];
  const h = parseInt(m[1] || 0, 10), mi = parseInt(m[2] || 0, 10), s = parseInt(m[3] || 0, 10);
  return h * 3600 + mi * 60 + s;
}

function normalizeUrl(u){ return u && u.startsWith("//") ? "https:" + u : (u || ""); }

async function fetchJson(url) {
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "YouTube API error");
  return j;
}

export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "YOUTUBE_API_KEY is not set." });

  const channelId = (req.query.channelId || "").trim();
  if (!channelId) return res.status(400).json({ error: "Missing channelId" });
  const requestedPlaylistId = (req.query.playlistId || "").trim(); // optional

  const cacheKey = channelId + "|" + (requestedPlaylistId || "uploads");
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(cached.data);
  }

  try {
    const chData = await fetchJson(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${API_KEY}`
    );
    const channel = chData.items && chData.items[0];
    if (!channel) return res.status(404).json({ error: "Channel not found." });
    const sourcePlaylistId = requestedPlaylistId || channel.contentDetails.relatedPlaylists.uploads;

    let raw = [];
    let pageToken = "";
    do {
      const pl = await fetchJson(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${sourcePlaylistId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`
      );
      for (const item of pl.items || []) {
        if (item.snippet.channelId !== channelId) continue; // validation guard — keeps a playlist
        raw.push({                                          // from ever leaking another channel's video
          id: item.contentDetails.videoId,
          title: item.snippet.title,
          description: item.snippet.description || "",
          publishedAt: item.snippet.publishedAt,
          playlistPosition: item.snippet.position,
        });
      }
      pageToken = pl.nextPageToken || "";
    } while (pageToken && raw.length < 300); // cap keeps latency + quota bounded

    const filtered = [];
    for (let i = 0; i < raw.length; i += 50) {
      const batch = raw.slice(i, i + 50);
      const ids = batch.map((v) => v.id).join(",");
      const vData = await fetchJson(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&id=${ids}&key=${API_KEY}`
      );
      for (const v of vData.items || []) {
        const dur = parseISODuration(v.contentDetails.duration);
        if (dur > 60 && v.status.privacyStatus === "public") {
          const orig = batch.find((b) => b.id === v.id);
          filtered.push({ ...orig, durationSeconds: dur });
        }
      }
    }

    // Playlists keep the creator's chosen order; uploads sort newest-first.
    if (requestedPlaylistId) filtered.sort((a, b) => a.playlistPosition - b.playlistPosition);
    else filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    const payload = {
      channelId,
      channelTitle: channel.snippet.title,
      channelThumbnail: normalizeUrl(channel.snippet.thumbnails?.default?.url),
      playlistId: requestedPlaylistId || null,
      videos: filtered,
      fetchedAt: new Date().toISOString(),
    };
    cache[cacheKey] = { data: payload, at: Date.now() };

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
