# PMIS Enhancement Demo Script
**Duration**: exactly 60 seconds

## Flow Expectations
If caching is enabled, backend responses must be under 2s.

## Step 1 (5s): App Load
* **Action**: Open the PMIS frontend React application at `localhost:5173`.
* **Talk Track**: "Welcome to the PMIS AI matches interface. Here is the landing screen displaying national statistics."
* **System Action**: Frontend loads immediately; static assets hit the PWA CacheFirst strategy. 

## Step 2 (15s): Profile Initiation
* **Action**: Click "Try Demo"
* **Talk Track**: "To simulate a real user, we've loaded a profile representing a candidate from a rural background and SC category seeking an IT internship."
* **System Action**: Zustand store immediately populates `useProfileStore` with demo data.

## Step 3 (5s): Wizard Navigation
* **Action**: Rapidly click 'Next' through steps 1->4.
* **Talk Track**: "The candidate quickly confirms their fields—skills, preferred sectors, and willingness to work pan-India."
* **System Action**: Wizard seamlessly pulls prefilled inputs.

## Step 4 (5s): AI Matching Experience
* **Action**: Click 'View Recommendations'
* **Talk Track**: "Now the ML engine is processing. We evaluate over 500+ opportunities using TF-IDF matching."
* **System Action**: An animated, 3-step sequence displays while `n-matches` are sourced from the Flask `/recommend` endpoint. It leverages a Cached TF-IDF Matrix minimizing lag.

## Step 5 (15s): Card Deep Dive
* **Action**: Scroll to the first candidate match.
* **Talk Track**: "Notice the 87% match score personalising this card. Under our Affirmative Action engine, rural and SC categories dynamically boosted their alignment by 18%."
* **Action**: Click "Why this match?"
* **Talk Track**: "If we expand the breakdown, you see precisely matching skills, mapped against the missing skills dynamically linked to NSDC courses."
* **System Action**: Expand `MatchBreakdown.tsx` dropdown.

## Step 6 (5s): Compare Mode
* **Action**: Click "Compare 2" and select two top internship cards, then launch the bottom sheet.
* **Talk Track**: "Comparisons clearly stack stipend against role fit, making the decision purely data-driven."
* **System Action**: The bottom-sheet slide-up animation occurs flawlessly.

## Step 7 (5s): Advanced Analytics
* **Action**: Close compare, hit the footer "📊 View Platform Stats".
* **Talk Track**: "Finally, this flows into our real-time funnel chart visualisations."
* **System Action**: App seamlessly shifts route to the inline-SVG KPI analytics view via `useNavigate`.

## Step 8 (5s): Collaborative Filtering
* **Action**: Return to Results, hit the [👍] / [🔖 Bookmark] icon on top card.
* **Talk Track**: "Giving feedback feeds straight back into our real-time Collaborative Filtering algorithm."
* **System Action**: The thumbs up triggers `POST /api/v1/feedback`, adding a transient green ring and saving interaction state tracking thresholds locally.
