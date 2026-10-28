# TimeTravel Heritage Explorer

*Explore forgotten places. Travel through time. Discover our history.*

A web app for exploring historical monuments, dynasties and events in one place. It runs fully in the browser with bundled sample data. **No paid APIs, accounts or secret keys are needed.**

## Run it

Requires Node.js 22.22 or newer and pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

Open the local URL printed in the terminal. If the framework asks you to sign in during development, uncomment `AUTH_DISABLED=true` in a copy of `.env.example` saved as `.env`.

Other commands: `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm test`.

## Pages

Each feature has its own page with a shared header, mobile navigation, skip link and footer.

| Page | Path | What it does |
| --- | --- | --- |
| Home | `/` | Introduction, dataset counts, links to every feature |
| Explore Heritage | `/explore` | Search and filter monuments by era, state, dynasty and category; details dialog; favourites |
| Knowledge Explorer | `/knowledge` | Search people, dynasties, battles, monuments and ideas by category |
| Time Machine | `/timeline` | Year slider, era, dynasty and event filters, clickable timeline markers |
| AI History Guide | `/guide` | Chat with copy, read-aloud, retry and clear controls |
| Voice Assistant | `/voice` | Speak or type a question; spoken answers where supported |
| History Quiz | `/quiz` | Choose difficulty and category, get explanations and a score |
| Profile | `/profile` | Favourites, recently viewed places, explored eras, quiz scores; clear all |

## Local data storage

Favourites, recently viewed places, timeline explorations and quiz results are saved in your browser's `localStorage` under the key `timetravel-heritage-profile-v1`. Nothing is sent to a server, and nothing syncs between devices. Use **Clear** on the Profile page, or clear site data in your browser, to remove it. If storage is blocked (for example in a private window), the app still works but will not remember your activity.

## Demo limitations

- **Sample data only.** Monuments, timeline events, knowledge entries and quiz questions are a small demo collection. Dates are approximate and interpretations vary. Do not use it as a scholarly reference.
- **The AI History Guide is not live AI.** By default it returns curated answers for a few topics (Hampi and Vijayanagara, Maurya and Gupta, 1526 and Panipat, Daulatabad). Any other question gets a clear notice instead of an invented answer. Every response is labelled "Curated demo response".
- **The Voice Assistant uses your browser's built-in speech features** (Web Speech API). Speech recognition works mainly in Chromium-based browsers and may send audio to the browser vendor's service. If it is unsupported or microphone access is denied, type your question instead. Answers come from the same curated demo guide, and spoken playback depends on the voices installed on your device.
- **Images load from the web** (Pexels and similar hosts). If an image cannot load, a placeholder is shown.
- **Optional backend.** Setting `VITE_AI_API_BASE_URL` makes the guide `POST` to `<url>/api/ai/chat` with `{ "message": string }` and expect `{ "answer": string, "sources"?: [{ "title", "url" }] }`. It is unset by default, and the app does not need it.

## Project layout

- `app/routes/_site.tsx` is the shared layout; `_site.*.tsx` files are the pages
- `app/components/SiteShell.tsx` is the header, navigation and footer
- `app/components/*Section.tsx` hold each feature's UI
- `app/lib/` holds sample data, the demo guide and the localStorage hook
- `actions/`, `server/`, `drizzle/` come from the Agent-Native starter and are unused by the heritage features
