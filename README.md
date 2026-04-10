# PMIS AI-Powered Internship Recommendation Engine

**Problem Statement:** #25033 (PM Internship Scheme Optimization)
**Team Name:** The Architect Loop
**Members:** Aarya Bhangadia, Rounak Nagwani, Sahil Roy, Tanmay Gupta, Paras Sharma
**College:** RCOEM Nagpur, Dept. AICS, Semester VI

## Overview
The PMIS pipeline currently oversees massive applicant dropout loops (Phase 1 saw 621K registrations but only 10.6% organic conversion). The core issue stems from manual catalog routing resulting in "choice paralysis" among rural youths attempting to parse complex requirements.

This project delivers a **mobile-first, accessibility-driven PWA frontend** bridging an **ML-Optimized Flask backend** to mathematically automate the application routing lifecycle, targeting a direct 40% organic conversion boost.

## Architecture

```text
[ Mobile-First PWA (React + Tailwind) ]  <-- (Low-Bandwidth Suspense Caching)
                  |
    [ Zustand Profile Storage Layer ]
                  |
        ( HTTP gzip via Flask )
                  |
[ Flask API ] ---> [ SQLite Database ]
                  |
[ Recommendation Engine (scikit-learn) ]
  ├── Content-Based Filtering (Cosine Similarity)
  ├── Affirmative Action Boosts (SC/ST/Rural weighting logic)
  └── Capacity Enforcement Checks
```

## Machine Learning Approach

Our recommendation pipeline moves away from basic string matching toward a **Hybrid Factorization model**. We compute Cosine Similarity over generated TF-IDF matrices mapping rural candidate skills against strict sector capacities. Additionally, when candidate constraints block generic IT placements, the engine organically reroutes their profile towards localized, high-capacity Agriculture/Manufacturing variants possessing lower qualification thresholds.

To combat inequality gradients across rural segments, the engine leverages an **Affirmative Action Weighting Matrix**. If a user explicitly specifies `Category = SC/ST` or `Is_Rural = True`, an organic multiplier (+12%) securely bridges their overall match score probability without degrading technical qualification baseline safety walls, surfacing guaranteed placements prominently to structurally disadvantaged learners.

## Local Execution Instructions

Execute the root node executable mapping locally:
```bash
chmod +x setup.sh
./setup.sh
```
OR standard execution mappings:
1. `docker-compose up --build`
2. Connect cleanly to `http://localhost:5173`

## Core API Routes mapping
- `POST /api/v1/recommend/` -> Absorbs `CandidateProfile`, injects AI matrix tracking `AffirmativeBoosts`, yields array of `Recommendation`.
- `GET /api/v1/stats/` -> Core backend KPIs for admin oversight.
- `POST /api/v1/apply/` -> Locks Application ID securely.

## Quick Start for Contributors

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Backend Setup
```bash
cd pmis-backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python seed/generate_seed.py
python run.py
# Flask runs on http://127.0.0.1:5000
```

### Frontend Setup
```bash
cd pmis-frontend
npm install
npm run dev
# React runs on http://localhost:5173
```

### Default URLs
- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:5000`
- API Health: `http://127.0.0.1:5000/api/v1/health`
- Stats: `http://127.0.0.1:5000/api/v1/stats`
