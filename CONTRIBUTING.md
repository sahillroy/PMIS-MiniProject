# Contributing to PMIS AI Engine

Welcome to the team! This guide explains how to contribute without stepping on each other's toes during the sprint.

---

## Branch Strategy

We use **feature branches** off `main`. Never push directly to `main`.

```
main                    ← stable, demo-ready
├── day1/backend-setup      ← Slot 1: DB + seed
├── day1/content-based      ← Slot 2: ML recommender
├── day1/affirmative-action ← Slot 3: AA scoring
├── day1/collab-filter      ← Slot 4: SVD + hybrid
├── day1/flask-api          ← Slot 5: routes + Docker
├── day2/react-setup        ← Day 2 Slot 1
├── day2/wizard             ← Day 2 Slot 2
├── day2/results-page       ← Day 2 Slot 3
├── day2/api-integration    ← Day 2 Slot 4
├── day2/i18n-a11y          ← Day 2 Slot 5
└── day2/polish             ← Day 2 Slot 6
```

### Creating your branch
```bash
git checkout main
git pull origin main
git checkout -b day1/content-based
```

### Opening a PR
- PR title format: `[Day1/Slot2] Content-based recommender`
- Add a short description of what you built
- Tag a teammate for review before merging

---

## Who Owns What (Sprint Assignments)

| Slot | Task | Owner |
|------|------|-------|
| Day 1 · Slot 1 | Repo + DB schema + seed data | Assign to team member |
| Day 1 · Slot 2 | Content-based ML engine | Assign to team member |
| Day 1 · Slot 3 | Affirmative action scoring | Assign to team member |
| Day 1 · Slot 4 | Collaborative filter + hybrid | Assign to team member |
| Day 1 · Slot 5 | Flask API routes + Docker | Assign to team member |
| Day 2 · Slot 1 | React setup + shell | Assign to team member |
| Day 2 · Slot 2 | 4-step wizard | Assign to team member |
| Day 2 · Slot 3 | Results + recommendation cards | Assign to team member |
| Day 2 · Slot 4 | API integration + state | Assign to team member |
| Day 2 · Slot 5 | Hindi i18n + accessibility | Assign to team member |
| Day 2 · Slot 6 | Demo polish + final build | All hands |

---

## Commit Message Format

```
[area] short description

Examples:
[ml] add TF-IDF skill vectoriser
[api] add /recommend endpoint with CORS
[ui] build Step2Skills wizard component
[fix] handle cold-start in hybrid scorer
[seed] add 100 internships across 24 sectors
```

---

## Dev Environment Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker + Docker Compose (optional but recommended)

### First-time setup
```bash
git clone https://github.com/YOUR_USERNAME/pmis-ai-engine.git
cd pmis-ai-engine

# Backend
cd pmis-backend
cp .env.example .env
pip install -r requirements.txt
python seed/generate_seed.py
python run.py

# Frontend (new terminal)
cd pmis-frontend
npm install
npm run dev
```

---

## Useful Commands

```bash
# Test recommend endpoint
curl -X POST http://localhost:5000/api/v1/recommend \
  -H "Content-Type: application/json" \
  -d '{"profile": {"education_level": "Graduate", "skills": ["Python"], "sector_interests": ["IT"], "category": "SC", "is_rural": true}}'

# Check health
curl http://localhost:5000/api/v1/health

# Run with Docker
docker-compose up --build
```

---

## File Ownership (Avoid Merge Conflicts)

| File/Folder | Primary Owner |
|-------------|--------------|
| `pmis-backend/app/ml/` | ML team |
| `pmis-backend/app/routes/` | Backend team |
| `pmis-backend/app/models.py` | Whoever does Slot 1 — do not edit after |
| `pmis-frontend/src/components/wizard/` | Frontend team |
| `pmis-frontend/src/components/results/` | Frontend team |
| `pmis-frontend/src/api/client.ts` | Integration person |
| `pmis-frontend/src/i18n/` | i18n person |

---

## Questions?

Ping the team on WhatsApp or open a GitHub Issue tagged `question`.
