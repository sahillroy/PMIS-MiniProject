"""
PMIS Content-Based Recommender
================================
Enhancements in this version:
  - SKILL_SYNONYMS: normalises aliases ("JS" → "javascript", "Accounts" → "accounting")
  - CANONICAL_FORMS: maps normalised keys back to display-friendly strings
  - normalize_skills(): applied to both candidate and internship skills before TF-IDF
  - get_skill_display_name(): returns the display name for any raw or normalised skill
  - All reasons dicts use canonical display names for matched/missing skills
"""

import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models import db, Candidate, Internship

# ─── Skill Synonym Map ────────────────────────────────────────────────────────
# Keys are lowercase variants; values are the normalised canonical key.
SKILL_SYNONYMS: dict[str, str] = {
    # JavaScript / web
    "js":                              "javascript",
    "node":                            "nodejs",
    "node.js":                         "nodejs",
    "react.js":                        "react",
    "reactjs":                         "react",
    "vue.js":                          "vue",
    "vuejs":                           "vue",
    "angular.js":                      "angular",
    # AI / ML
    "ml":                              "machine learning",
    "ai":                              "artificial intelligence",
    "dl":                              "deep learning",
    "nlp":                             "natural language processing",
    # Office / productivity
    "ms office":                       "microsoft office",
    "msoffice":                        "microsoft office",
    "ms-office":                       "microsoft office",
    "ms word":                         "microsoft office",
    "ms excel":                        "excel",
    # Systems / low-level
    "c++":                             "cpp",
    "c plus plus":                     "cpp",
    # DSA
    "data structures":                 "dsa",
    "data structures and algorithms":  "dsa",
    # Accounting / Finance
    "tally erp":                       "tally",
    "tally erp 9":                     "tally",
    "accounts":                        "accounting",
    "bookkeeping":                     "accounting",
    "financial modelling":             "financial analysis",
    # Design
    "adobe photoshop":                 "photoshop",
    "adobe illustrator":               "illustrator",
    "google analytics":                "analytics",
    # Marketing / Content
    "social media marketing":          "social media",
    "content creation":                "content writing",
    # Customer-facing
    "customer support":                "customer service",
    # Communication
    "spoken english":                  "english speaking",
    "communication skills":            "communication",
    # Engineering / CAD
    "auto cad":                        "autocad",
    # Driving
    "driving license":                 "driving licence",
}

# ─── Canonical Display Forms ──────────────────────────────────────────────────
# Maps normalised (lowercase) key → display-friendly string shown in the UI / reasons.
CANONICAL_FORMS: dict[str, str] = {
    # Web / Programming
    "javascript":                "JavaScript",
    "nodejs":                    "Node.js",
    "react":                     "React",
    "vue":                       "Vue.js",
    "angular":                   "Angular",
    "python":                    "Python",
    "java":                      "Java",
    "cpp":                       "C++",
    "c++":                       "C++",
    "sql":                       "SQL",
    "dsa":                       "Data Structures & Algorithms",
    # AI / ML
    "machine learning":          "Machine Learning",
    "artificial intelligence":   "Artificial Intelligence",
    "deep learning":             "Deep Learning",
    "natural language processing": "Natural Language Processing",
    "data analysis":             "Data Analysis",
    # Office / Tools
    "microsoft office":          "MS Office",
    "excel":                     "Excel",
    "tally":                     "Tally",
    "autocad":                   "AutoCAD",
    # Finance / Accounting
    "accounting":                "Accounting",
    "financial analysis":        "Financial Analysis",
    # Design / Media
    "photoshop":                 "Adobe Photoshop",
    "illustrator":               "Adobe Illustrator",
    "graphic design":            "Graphic Design",
    "video editing":             "Video Editing",
    "web design":                "Web Design",
    "analytics":                 "Google Analytics",
    # Marketing / Content
    "social media":              "Social Media",
    "content writing":           "Content Writing",
    "seo":                       "SEO",
    # Communication / Customer
    "communication":             "Communication",
    "customer service":          "Customer Service",
    "english speaking":          "English Speaking",
    "sales":                     "Sales",
    "hr management":             "HR Management",
    # Field / Technical
    "driving licence":           "Driving Licence",
    "electrical work":           "Electrical Work",
    "mechanical":                "Mechanical",
    "welding":                   "Welding",
    "supply chain":              "Supply Chain",
    "inventory management":      "Inventory Management",
    "network administration":    "Network Administration",
    "cybersecurity":             "Cybersecurity",
    "data entry":                "Data Entry",
    "computer basics":           "Computer Basics",
    "legal research":            "Legal Research",
}

# ─── Sector Aliases ───────────────────────────────────────────────────────────
SECTOR_ALIASES: dict[str, list[str]] = {
    "IT":             ["IT/Software", "IT & Technology", "Software", "Technology",
                       "Telecom", "Telecommunications", "E-commerce"],
    "Banking":        ["Finance/Banking", "Banking & Finance", "Finance", "BFSI", "Banking"],
    "Finance":        ["Finance/Banking", "Banking & Finance", "Finance", "BFSI", "Banking"],
    "Manufacturing":  ["Manufacturing", "Automotive", "Automobile", "Industrial"],
    "Healthcare":     ["Healthcare", "Pharmaceuticals", "Medical", "Pharma"],
    "Agriculture":    ["Agriculture", "Food Processing", "Agri"],
    "Education":      ["Education", "EdTech", "NGO/Social Work"],
    "Retail":         ["Retail", "FMCG", "E-commerce", "Consumer Goods"],
    "Energy":         ["Energy", "Power", "Oil & Gas", "Renewable Energy"],
    "Infrastructure": ["Infrastructure", "Construction", "Real Estate", "Logistics"],
    "Media":          ["Media", "Entertainment", "Media & Entertainment"],
    "Tourism":        ["Tourism", "Hospitality", "Aviation", "Travel"],
    "Telecom":        ["Telecom", "Telecommunications", "IT/Software"],
    "Logistics":      ["Logistics", "Infrastructure", "Supply Chain"],
    "FMCG":           ["FMCG", "Retail", "Consumer Goods"],
    "Automobile":     ["Automobile", "Automotive", "Manufacturing"],
}

# Reverse map: DB sector value → canonical alias keys
_REVERSE_ALIAS: dict[str, list[str]] = {}
for _key, _vals in SECTOR_ALIASES.items():
    for _v in _vals:
        _REVERSE_ALIAS.setdefault(_v, []).append(_key)


# ─── Public Helpers ───────────────────────────────────────────────────────────

def normalize_skills(skills: list) -> list[str]:
    """
    Normalise a list of skill strings:
      1. Lowercase + strip
      2. Apply SKILL_SYNONYMS lookup
      3. Deduplicate (preserving first-seen order)

    Returns a deduplicated list of normalised (lowercase) skill keys.
    """
    if not skills:
        return []
    seen: set[str] = set()
    result: list[str] = []
    for raw in skills:
        if not raw:
            continue
        key = str(raw).lower().strip()
        key = SKILL_SYNONYMS.get(key, key)   # apply synonym map
        if key not in seen:
            seen.add(key)
            result.append(key)
    return result


def get_skill_display_name(skill: str) -> str:
    """Return the canonical display name for a raw or normalised skill string."""
    if not skill:
        return skill
    key = str(skill).lower().strip()
    key = SKILL_SYNONYMS.get(key, key)      # normalise first
    return CANONICAL_FORMS.get(key, skill)  # display form or original


def _to_display(skills: list[str]) -> list[str]:
    """Map a list of normalised skill keys to their display names."""
    return [get_skill_display_name(s) for s in skills]


# ─── Recommender ──────────────────────────────────────────────────────────────

class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.education_hierarchy = {
            '10th': 1, '12th': 2, 'ITI': 3, 'Diploma': 4,
            'Graduate': 5, 'Postgraduate': 6
        }
        self.sector_relations = {
            'IT/Software':    ['Telecommunications', 'E-commerce', 'Media'],
            'Manufacturing':  ['Automotive', 'Logistics', 'Food Processing'],
            'Healthcare':     ['Pharmaceuticals', 'NGO/Social Work'],
            'Retail':         ['E-commerce', 'FMCG'],
            'Agriculture':    ['Food Processing'],
            'Education':      ['NGO/Social Work'],
            'Finance/Banking':['Real Estate'],
            'Tourism':        ['Hospitality', 'Aviation'],
        }
        self.internships_data: list[dict] = []
        self.internship_tfidf = None
        self._is_loaded = False

    # ── Internal parsers ──────────────────────────────────────────────────────

    def _parse_skills(self, field) -> list[str]:
        """Safely coerce JSON column value to a plain Python list."""
        if field is None:
            return []
        if isinstance(field, list):
            return [s for s in field if s]
        if isinstance(field, str):
            s = field.strip()
            if not s:
                return []
            try:
                parsed = json.loads(s.replace("'", '"'))
                return parsed if isinstance(parsed, list) else []
            except Exception:
                return [x.strip().strip("'\"") for x in s.strip("[]").split(",") if x.strip()]
        return []

    # ── DB loader ─────────────────────────────────────────────────────────────

    def load_internships(self):
        """Load all active internships, normalise their skills, build TF-IDF matrix."""
        internships = Internship.query.filter_by(is_active=True).all()
        self.internships_data = []

        for i in internships:
            raw_skills   = self._parse_skills(i.required_skills)
            norm_skills  = normalize_skills(raw_skills)           # ← normalise here
            skills_str   = " ".join(norm_skills)

            self.internships_data.append({
                'id':             i.id,
                'company':        i.company,
                'role':           i.role,
                'sector':         i.sector,
                'required_skills_raw':  raw_skills,    # original strings for display if needed
                'required_skills':      norm_skills,   # normalised — used for matching
                'skills_text':    skills_str,
                'min_education':  i.min_education,
                'preferred_field': i.preferred_field,
                'location_state': i.location_state,
                'location_city':  getattr(i, 'location_city', ''),
                'stipend_monthly': getattr(i, 'stipend_monthly', 0),
                'total_slots':    i.total_slots,
                'filled_slots':   i.filled_slots,
            })

        corpus = [d['skills_text'] for d in self.internships_data]
        if corpus:
            self.internship_tfidf = self.vectorizer.fit_transform(corpus)
        else:
            self.internship_tfidf = None

        self._is_loaded = True

    # ── Scoring helpers ───────────────────────────────────────────────────────

    def _calculate_skill_match(self, candidate_skills_raw, internship_dict: dict, index: int):
        """
        Returns (cosine_similarity, matched_display, missing_display).
        Candidate skills are normalised before comparison.
        Display names use CANONICAL_FORMS.
        """
        c_norm = normalize_skills(self._parse_skills(candidate_skills_raw))
        i_norm = internship_dict['required_skills']   # already normalised at load time

        if not c_norm or not i_norm:
            return 0.0, [], _to_display(i_norm)

        cand_str    = " ".join(c_norm)
        cand_vector = self.vectorizer.transform([cand_str])

        if self.internship_tfidf is not None:
            similarity = cosine_similarity(
                cand_vector, self.internship_tfidf[index:index+1]
            )[0][0]
        else:
            similarity = 0.0

        cand_set = set(c_norm)
        matched  = [s for s in i_norm if s in cand_set]
        missing  = [s for s in i_norm if s not in cand_set]

        return float(similarity), _to_display(matched), _to_display(missing)

    def _calculate_education_match(self, cand_edu: str, req_edu: str):
        if not req_edu:
            return 1.0, "No specific education required"
        if not cand_edu:
            return 0.0, "Candidate education not provided"
        cand_level = self.education_hierarchy.get(cand_edu, 0)
        req_level  = self.education_hierarchy.get(req_edu, 0)
        if cand_level >= req_level:
            return 1.0, f"{cand_edu} meets or exceeds {req_edu} requirement"
        elif cand_level == req_level - 1:
            return 0.5, f"{cand_edu} is one level below {req_edu} requirement"
        else:
            return 0.0, f"{cand_edu} is significantly below {req_edu} requirement"

    def _calculate_sector_match(self, cand_sectors_raw, req_sector: str):
        """
        Three-tier matching:
          Tier 1 — exact string
          Tier 2 — SECTOR_ALIASES lookup (handles "IT" ↔ "IT/Software" etc.)
          Tier 3 — legacy sector_relations partial credit (0.5)
        """
        if not req_sector:
            return 1.0, "Internship has no specific sector."
        c_sectors = self._parse_skills(cand_sectors_raw)
        if not c_sectors:
            return 0.0, "No candidate sector preferences matched."

        # Tier 1
        if req_sector in c_sectors:
            return 1.0, f"{req_sector} sector exactly matches your interests."

        # Tier 2 — reverse alias: does req_sector map to any canonical key the candidate listed?
        for ck in _REVERSE_ALIAS.get(req_sector, []):
            if ck in c_sectors:
                return 1.0, f"{req_sector} sector matches your {ck} interest."
        for cs in c_sectors:
            if req_sector in SECTOR_ALIASES.get(cs, []):
                return 1.0, f"{req_sector} sector matches your {cs} interest."

        # Tier 3
        related = self.sector_relations.get(req_sector, [])
        for cs in c_sectors:
            if cs in related or req_sector in self.sector_relations.get(cs, []):
                return 0.5, f"{req_sector} is related to your interested sectors."

        return 0.0, f"{req_sector} does not match your sector interests."

    def _calculate_location_match(self, cand_state: str, req_state: str):
        if not req_state:
            return 1.0, "Internship has no strict location preference."
        if not cand_state or cand_state.strip() == '' or cand_state.lower() == 'pan-india':
            return 0.6, "Candidate prefers pan-India location."
        if cand_state.lower() == req_state.lower():
            return 1.0, f"Located in {req_state}, perfectly matching your state."
        return 0.3, f"Located in {req_state}, different from {cand_state}."

    def _calculate_capacity_check(self, total: int, filled: int):
        if not total or total <= 0:
            return 0.0, 0
        if filled >= total:
            return 0.0, 0
        return float((total - filled) / total), (total - filled)

    # ── Main recommend() — signature unchanged ────────────────────────────────

    def recommend(self, candidate_id, top_n=5, candidate_obj=None) -> list[dict]:
        if not self._is_loaded:
            self.load_internships()

        candidate = candidate_obj if candidate_obj else Candidate.query.get(candidate_id)
        if not candidate:
            return []

        # Normalise candidate skills once up-front
        cand_skills_norm = normalize_skills(self._parse_skills(candidate.skills))

        recommendations: list[dict] = []

        for idx, internship in enumerate(self.internships_data):
            # 1. Skill Match (35%) — pass normalised list so _calculate_skill_match
            #    doesn't double-normalise; still safe because _parse_skills([...]) = [...]
            skill_score, matched_display, missing_display = self._calculate_skill_match(
                cand_skills_norm, internship, idx
            )

            # 2. Education Match (25%)
            edu_score, edu_reason = self._calculate_education_match(
                candidate.education_level, internship['min_education']
            )

            # 3. Sector Match (20%)
            sector_score, sector_reason = self._calculate_sector_match(
                candidate.sector_interests, internship['sector']
            )

            # 4. Location Match (15%)
            loc_score, loc_reason = self._calculate_location_match(
                candidate.state, internship['location_state']
            )

            # 5. Capacity check (5%)
            cap_score, slots_avail = self._calculate_capacity_check(
                internship['total_slots'], internship['filled_slots']
            )

            if cap_score == 0.0:
                continue

            final_score = (
                skill_score  * 0.35 +
                edu_score    * 0.25 +
                sector_score * 0.20 +
                loc_score    * 0.15 +
                cap_score    * 0.05
            )

            # reasons dict — structure unchanged, display names used for skills
            reasons = {
                "skill_match": {
                    "score":          round(skill_score, 2),
                    "matched_skills": matched_display,   # canonical display names
                    "missing_skills": missing_display,   # canonical display names
                },
                "education_match": {
                    "score":  round(edu_score, 2),
                    "reason": edu_reason,
                },
                "sector_match": {
                    "score":  round(sector_score, 2),
                    "reason": sector_reason,
                },
                "location_match": {
                    "score":  round(loc_score, 2),
                    "reason": loc_reason,
                },
                "capacity": {
                    "score":           round(cap_score, 2),
                    "slots_available": slots_avail,
                },
            }

            recommendations.append({
                "internship_id":   internship['id'],
                "company":         internship['company'],
                "role":            internship['role'],
                "sector":          internship['sector'],
                "required_skills": _to_display(internship['required_skills']),  # display names
                "location_state":  internship['location_state'],
                "stipend_monthly": internship['stipend_monthly'],
                "final_score":     round(final_score, 4),
                "reasons":         reasons,
            })

        recommendations.sort(key=lambda x: x['final_score'], reverse=True)
        return recommendations[:top_n]


# Global singleton
content_based_recommender = ContentBasedRecommender()
