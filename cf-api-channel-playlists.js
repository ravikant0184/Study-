// Lists a channel's public playlists (title, thumbnail, video count).
export default async function handler(req, res) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "YOUTUBE_API_KEY is not set." });

  const channelId = (req.query.channelId || "").trim();
  if (!channelId) return res.status(400).json({ error: "Missing channelId" });

  try {
    let playlists = [];
    let pageToken = "";
    do {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`
      );
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      for (const item of data.items || []) {
        playlists.push({
          playlistId: item.id,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
          itemCount: item.contentDetails.itemCount,
        });
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken && playlists.length < 200);

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ playlists });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
