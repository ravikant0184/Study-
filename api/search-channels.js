// Search bar #1 — finds channels by name/handle. Runs server-side so the
// API key never reaches the browser.
function normalizeUrl(u){ return u && u.startsWith("//") ? "https:" + u : (u || ""); }

export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "YOUTUBE_API_KEY is not set." });

  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing q" });

  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=8&q=${encodeURIComponent(q)}&key=${API_KEY}`
    );
    const data = await r.json();
    if (data.error) throw new Error(data.error.message);

    const channels = (data.items || []).map((item) => ({
      channelId: item.snippet.channelId,
      title: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnail: normalizeUrl(item.snippet.thumbnails?.default?.url),
    }));

    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate");
    return res.status(200).json({ channels });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
