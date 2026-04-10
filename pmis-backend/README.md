# PMIS Recommendation Engine API

A comprehensive backend for the PM Internship Scheme recommendation engine featuring a hybrid ML algorithm (Content-based + Collaborative Filtering) alongside an Affirmative Action layer.

## Setup Instructions

### Option 1: Native Python (Dev Mode)
1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Generate the SQLite Seed Database:
   ```bash
   python seed/generate_seed.py
   ```
4. Run the API:
   ```bash
   python run.py
   ```

### Option 2: Docker deployment
You can instantly spin up the entire application along with PostgreSQL and Redis (for future caching needs) using Docker Compose.

1. Ensure Docker Desktop is running.
2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```
3. The API will be accessible on `http://localhost:5000`.

## Available Routes (Prefix: `/api/v1/`)
- `POST /recommend/` - Fetch hybrid engine recommendations. Supports `{candidate_id: 1}` or passing a full anonymized `{profile: {...}}` object.
- `POST /profile/create` - Submits a candidate profile and generates an ID.
- `GET /internships/` - Fetch paginated listings (supports `?sector=` and `?state=` filters).
- `GET /internships/<id>` - Retrieve deep details about a single internship.
- `POST /apply/` - Apply to an internship.
- `GET /stats/` - Global pipeline conversion statistics.
- `GET /health/` - Verifies database hooks and ML module readiness.
