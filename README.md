# Channel Focus

Same distraction-free idea as Physics Focus, but for **any** YouTube channel
you type in — not locked to one. Two search bars: one to find a channel, one
to search within that channel's videos once you're in it.

## What's blocked, same as before

- No Home feed, no Shorts, no Trending, no "recommended" videos
- No comments section, no general YouTube search
- Every video is re-validated server-side to actually belong to the channel
  you picked before it's shown
- Progress (in-progress/completed), bookmarks, and continue-watching are
  tracked **per channel**, stored in `localStorage` — switch channels anytime,
  each one remembers its own progress

**One honest limitation:** YouTube's own embedded player can still show
pre-roll/mid-roll ads on some videos depending on the creator's monetization
— that's controlled by YouTube, not something any embed can disable. What
this app controls (and blocks completely) is its own UI: no ad-like feed, no
autoplay-into-something-else, no distraction surfaces at all.

## Setup (reuses the same YouTube API key you already have)

1. Deploy to Vercel the same way as before (GitHub import or upload).
2. In **Settings → Environment Variables**, add just one:
   - `YOUTUBE_API_KEY` = the same key from your Google Cloud project
3. Deploy. That's it — no Gemini, no Upstash, no other setup needed.

## Files

- `index.html` — the whole frontend.
- `api/search-channels.js` — search bar #1 (find a channel by name).
- `api/channel-videos.js` — fetches, validates, and caches one channel's videos.
