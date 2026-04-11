# PM Internship Scheme (PMIS) - Smart Allocation Engine
### Problem Statement #25033 · Ministry of Corporate Affairs · Smart Allocation Engine
**Team:** Aarya Bhangadia, Rounak Nagwani, Sahil Roy, Tanmay Gupta, Paras Sharma  
**College:** RCOEM Nagpur · Department of AICS · B.Tech IT/CSE (AICS) · Semester VI

---

## 2. THE PROBLEM
The Prime Minister's Internship Scheme currently faces a significant conversion challenge. In its initial rollout:
*   **621,000 applications** were received.
*   **127,000 opportunities** were posted.
*   **Only 8,700 candidates joined (10.6% conversion).**

The root cause is identified as **choice paralysis** and **random applications** due to the absence of an intelligent matching layer. Our solution delivers an AI-powered smart allocation engine targeting **35–40% conversion** by automating technical and localized discovery.

## 3. SOLUTION OVERVIEW
*   **Intelligent Routing:** Automatically maps candidate profiles to internships using advanced NLP and similarity matrices.
*   **Diversity Fairness:** Integrates a policy-weighted Affirmative Action Scorer to uplift structurally disadvantaged segments.
*   **Explainable Matching:** Provides candidates with clear "Match Confidence" metrics and skill-gap gap analysis with direct course links.

**End-to-End Flow:**
`Candidate Discovery Wizard → Profile Vectorization → ML Scoring (Hybrid) → Affirmative Action Boost → Explanatory Match UI → Retraining Feedback Loop`

## 4. ARCHITECTURE DIAGRAM (ASCII)
```text
[ React Frontend ] <----(POST: /recommend)----> [ Flask API Server ]
      |                                              |
      +--> [ Zustand State ]           [ ML Engine Layer ]
                                              |
      +---------------------------------------+---------------------------------------+
      |                                       |                                       |
[ Content-Based Engine ]            [ Collaborative Filtering ]            [ Affirmative Action ]
 (TF-IDF + Cosine Sim)                  (SVD Interaction)                      (Policy Weighting)
      |                                       |                                       |
      +---------------------------------------+---------------------------------------+
                                              |
                                     [ SQLite Primary DB ]
                                              |
                                     [ Feedback Retraining ] <----(POST: /feedback)---'
```

## 5. ML APPROACH

**Content-based filtering**  
The engine performs TF-IDF (Term Frequency-Inverse Document Frequency) vectorization on candidate skills against the corpus of internship descriptions. It computes a Cosine Similarity score that factors in education hierarchy (e.g., Graduate vs. 12th), sector interest weights, and hard constraints like vacancy capacity and geographic proximity.

**Collaborative filtering**  
We leverage Singular Value Decomposition (SVD) to build an interaction matrix between candidates and internships. This captures latent patterns (e.g., "Candidates with IT skills often prefer Financial Sector roles in Tier 2 cities") which helps solve the "cold start" problem for new listings. The hybrid weights are dynamically adjusted: 70% Content / 30% Collaborative.

**Affirmative action scoring**  
To meet Ministry goals, an additive boost layer is interjected. Weights for Rural Status, Social Categories (SC/ST/OBC), and Aspirational Districts are applied to the raw similarity score. This boost is strictly capped at **+0.20** to ensure affirmative action supports placement without violating the baseline technical requirements of the role.

## 6. AFFIRMATIVE ACTION DESIGN

| Factor | Weight (Boost) | Policy Rationale |
| :--- | :--- | :--- |
| **is_rural** | +0.08 | Addresses digital divide and geographic isolation. |
| **category_sc_st** | +0.10 | Constitutional alignment for structural equity. |
| **category_obc** | +0.05 | Broad-base inclusivity for backward classes. |
| **aspirational_district** | +0.06 | Targetted uplift for Niti Aayog identified regions (e.g., Bastar). |
| **first_timer** | +0.04 | Incentivizes the "un-interned" to join the workforce. |

**Max Boost Cap:** 0.20 (Ensures merit-diversity balance)

## 7. EXPLAINABILITY
Every recommendation carries a machine-readable `reasons` dict surfaced to the user as "Why this match?".

**Sample Reasons Dictionary (Rural SC Candidate):**
```json
{
  "match_percentage": 87,
  "reasons": {
    "skill_match": {
      "matched_skills": ["Computer Basics", "English"],
      "missing_skills": ["Reporting"],
      "courses_for_missing": ["Skill India: Data Mgmt 101"]
    },
    "affirmative_boosts_applied": [
      {"reason": "Rural district candidate", "boost": 0.08},
      {"reason": "SC category", "boost": 0.10}
    ]
  },
  "confidence": {
    "confidence_lower": 82,
    "confidence_upper": 91
  }
}
```

## 8. SETUP INSTRUCTIONS
1.  **Prerequisites:** Install Docker, Python 3.9+, and Node.js 18+.
2.  **Environment:** `docker-compose up --build` from the root directory.
3.  **Seed Data:** Run `python scripts/seed_db.py` to populate initial internships and candidates.
4.  **Access:** Open `http://localhost:5173` to view the platform.

## 9. API DOCUMENTATION

| Method | Path | Body | Response Summary |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/recommend/` | `Profile JSON` | List of Scored Recommendations + Reasons |
| **POST** | `/api/v1/feedback` | `internship_id`, `rating`| High-level retraining of SVD model |
| **GET** | `/api/v1/stats/` | N/A | Total Registrations, Conversion Funnel, Sector Dist |
| **GET** | `/api/v1/health` | N/A | Signal check for ML Engine & DB |

## 10. WHAT WE WOULD BUILD NEXT (Phase 2 and 3)
*   **Aadhaar Auth Integration:** Secure identity verification via UIDAI APIs.
*   **Real PMIS Portal Bridge:** Real-time data sync with MCA servers.
*   **IndicBERT NLP:** Support for multi-lingual search queries in 22 regional languages.
*   **DPDP Compliance:** Implementation of the Digital Personal Data Protection Act protocols.

## 11. SCREENSHOTS SECTION

### [Homepage]
*(Placeholder for Homepage Screenshot)*

### [Wizard Step 1: Education Verification]
*(Placeholder for Step 1 Screenshot)*

### [Wizard Step 4: Rural/Affirmative Mapping]
*(Placeholder for Step 4 Screenshot)*

### [Results Page: AI-Ranked Opportunities]
*(Placeholder for Results Page Screenshot)*

### [Compare Mode: Holistic Side-by-Side]
*(Placeholder for Compare Mode Screenshot)*

### [Platform Stats: Ministerial KPI Dashboard]
*(Placeholder for Stats Page Screenshot)*

### [Mobile View: iPhone SE / 375px Audit Pass]
*(Placeholder for Mobile Screenshot)*
