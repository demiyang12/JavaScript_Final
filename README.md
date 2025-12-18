# Yunnan Odyssey

**Yunnan Odyssey** is a concept travel-planning web experience for Yunnan, China, built to merge **“rational planning”** (climate, cost, filters, itinerary building) with **“emotional inspiration”** (a social, Instagram-like feed tied to specific places).

The product is structured as a **3-step journey**: **Inspiration → Intelligence → Action**. :contentReference[oaicite:0]{index=0}

---

## Why we built this

When people make travel plans today:

- Social platforms are great at *inspiration*, but “saved” places usually **can’t be directly turned into map collections and itineraries**.
- Travel planning tools are good at *logistics*, but places often lack the **human, emotional decision signals** (what it feels like, what others posted, why it’s worth going).

**Yunnan Odyssey combines both**:
1) a planning dashboard with decision-friendly data, and  
2) a location-based social feed (“Yunstagram”) where every post is attached to a POI, so when you click a place, you instantly see all posts about that place and can like/comment to interact. :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}

---

## Product walkthrough

### Step 1 — Inspiration: *The Ancient Tea Horse Road* Storymap
A narrative entry point that sets the tone for Yunnan travel using the **Tea Horse Road** as a storyline, and turns it into a “data journey” with map-driven chapters. :contentReference[oaicite:3]{index=3}

Implementation notes:
- Uses Leaflet and a generated “fractal path” to evoke the Tea Horse Road route between key locations. :contentReference[oaicite:8]{index=8} :contentReference[oaicite:9]{index=9}
- Loads POIs from `poi_new2_updated_with_pics.geojson`. :contentReference[oaicite:10]{index=10}
- Ends with a CTA to enter the Dashboard. :contentReference[oaicite:11]{index=11}

---

### Step 2 — Intelligence: Exploration Dashboard + “Yunstagram”
This is the main exploration hub:
- Left panel: **Month Highlight**, **Popularity Rank**, **Climate Info**. :contentReference[oaicite:12]{index=12}
- Center: interactive map with **category filters** and **search**. :contentReference[oaicite:13]{index=13}
- A **month slider** drives seasonal exploration. :contentReference[oaicite:14]{index=14}
- Right panel: **YUNSTAGRAM** feed. :contentReference[oaicite:15]{index=15}
- Button to jump into the itinerary planner. :contentReference[oaicite:16]{index=16}

#### Seasonal highlighting (month-based)
The dashboard includes a month slider and updates UI theme content (title/description/image), then re-renders the map to highlight seasonal “best” places. :contentReference[oaicite:17]{index=17}

#### Climate information (“rational signals”)
The climate card uses a chart that combines temperature + precipitation patterns (demo values in the current build). :contentReference[oaicite:18]{index=18}

#### Yunstagram (“emotional signals”)
The social feed supports:
- Viewing all posts, posts for a selected location, or “My Posts”. :contentReference[oaicite:19]{index=19}
- Creating posts that **must be tied to a location** (`locationId`, `locationName`) with optional image upload. :contentReference[oaicite:20]{index=20} :contentReference[oaicite:21]{index=21}
- Likes and comments interactions on posts. :contentReference[oaicite:22]{index=22}

---

### Step 3 — Action: Interactive Itinerary Planner
The planner turns exploration into a concrete itinerary:
- Set **date range** and see total days. :contentReference[oaicite:23]{index=23}
- Track **Total Cost**, **Stops**, and set a **Budget** limit. :contentReference[oaicite:24]{index=24}
- See an **Elevation Profile** chart for the itinerary. :contentReference[oaicite:25]{index=25}

#### Wishlist-driven planning
Only points in the user’s **wishlist** appear in the planner map:
- Planner loads POIs + a user wishlist document, then “renders markers only for wishlist IDs”. :contentReference[oaicite:26]{index=26} :contentReference[oaicite:27]{index=27}

#### Add POIs into specific days
Each POI popup shows elevation + cost and lets you choose a target day (Day 1, Day 2, …) then **Add** it. :contentReference[oaicite:28]{index=28}

#### Auto-generate daily routes
Routes are generated per-day using **Mapbox Directions API (driving)**; if the API fails, it falls back to a dashed straight polyline. :contentReference[oaicite:29]{index=29}

---

## Data notes ❕
This project is a **prototype** and the dataset is **not fully real**:

- POI coordinates + (original) Chinese names come from **OpenStreetMap** (OSM).
- Other attributes were generated via rules + ChatGPT, and English names were produced via Google Sheets translation.
- As a result, some distributions (e.g., elevation) may look unrealistic.

The web app loads POIs from `poi_new2_updated_with_pics.geojson`. :contentReference[oaicite:30]{index=30}

---

## Tech stack
- **Leaflet** for web mapping (storymap/dashboard/planner). :contentReference[oaicite:31]{index=31}
- **Chart.js** for climate/elevation charts. :contentReference[oaicite:32]{index=32}
- **SortableJS** for drag-and-drop (planner). :contentReference[oaicite:33]{index=33}
- **Firebase (Firestore)** for demo user wishlist + social posts. :contentReference[oaicite:34]{index=34} :contentReference[oaicite:35]{index=35}
- **Mapbox Directions API** for routing. :contentReference[oaicite:36]{index=36}

---

## Project structure (typical)
> (Paths reflect how pages reference assets in code.)

- `index.html` — Home (CN/EN toggle + accessibility mode) :contentReference[oaicite:37]{index=37}  
- `storymap.html` + `js/storymap.js` — Tea Horse Road storymap :contentReference[oaicite:38]{index=38}  
- `dashboard.html` + `js/dashboard.js` — Exploration dashboard + Yunstagram :contentReference[oaicite:39]{index=39}  
- `interactive.html` + `js/interactive.js` — Itinerary planner :contentReference[oaicite:40]{index=40}  
- `poi_new2_updated_with_pics.geojson` — POI dataset :contentReference[oaicite:41]{index=41}  
- `css/*` — styling referenced by each page (not included in this snippet set)

---

## How to run locally
Because the project fetches local GeoJSON files, it must be served via a local web server (not opened as a raw file).

Recommended:
1. Open the folder in VS Code
2. Use **Live Server**
3. Start from `index.html`

The planner also shows an explicit error if GeoJSON cannot be fetched and recommends Live Server. :contentReference[oaicite:42]{index=42}

---

## Known limitations (prototype)
- Climate values and several POI attributes are mock/generated (not authoritative).
- Firebase and Mapbox keys/tokens are embedded for demo purposes; in a real deployment, move them to environment variables and restrict usage.

---

## Credits
- Map data & base attribution include OpenStreetMap contributors (used in tile attribution). :contentReference[oaicite:43]{index=43}
- Routing: Mapbox Directions API. :contentReference[oaicite:44]{index=44}

