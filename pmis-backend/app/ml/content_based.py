"""
PMIS Content-Based Recommender
================================
Features:
  - SKILL_SYNONYMS / CANONICAL_FORMS: alias normalisation + display names
  - normalize_skills(): applied to candidate and internship skills before TF-IDF
  - get_skill_display_name(): public helper for callers
  - min_stipend: pre-filter with 80% relaxation fallback + stipend_note in reasons
  - Three-tier SECTOR_ALIASES matching (exact → alias → partial credit)
"""

import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models import db, Candidate, Internship

# ─── Skill Synonym Map ────────────────────────────────────────────────────────
SKILL_SYNONYMS: dict[str, str] = {
    "js":                              "javascript",
    "node":                            "nodejs",
    "node.js":                         "nodejs",
    "react.js":                        "react",
    "reactjs":                         "react",
    "vue.js":                          "vue",
    "vuejs":                           "vue",
    "angular.js":                      "angular",
    "ml":                              "machine learning",
    "ai":                              "artificial intelligence",
    "dl":                              "deep learning",
    "nlp":                             "natural language processing",
    "ms office":                       "microsoft office",
    "msoffice":                        "microsoft office",
    "ms-office":                       "microsoft office",
    "ms word":                         "microsoft office",
    "ms excel":                        "excel",
    "c++":                             "cpp",
    "c plus plus":                     "cpp",
    "data structures":                 "dsa",
    "data structures and algorithms":  "dsa",
    "tally erp":                       "tally",
    "tally erp 9":                     "tally",
    "accounts":                        "accounting",
    "bookkeeping":                     "accounting",
    "financial modelling":             "financial analysis",
    "adobe photoshop":                 "photoshop",
    "adobe illustrator":               "illustrator",
    "google analytics":                "analytics",
    "social media marketing":          "social media",
    "content creation":                "content writing",
    "customer support":                "customer service",
    "spoken english":                  "english speaking",
    "communication skills":            "communication",
    "auto cad":                        "autocad",
    "driving license":                 "driving licence",
}

# ─── Canonical Display Forms ──────────────────────────────────────────────────
CANONICAL_FORMS: dict[str, str] = {
    "javascript":                  "JavaScript",
    "nodejs":                      "Node.js",
    "react":                       "React",
    "vue":                         "Vue.js",
    "angular":                     "Angular",
    "python":                      "Python",
    "java":                        "Java",
    "cpp":                         "C++",
    "c++":                         "C++",
    "sql":                         "SQL",
    "dsa":                         "Data Structures & Algorithms",
    "machine learning":            "Machine Learning",
    "artificial intelligence":     "Artificial Intelligence",
    "deep learning":               "Deep Learning",
    "natural language processing": "Natural Language Processing",
    "data analysis":               "Data Analysis",
    "microsoft office":            "MS Office",
    "excel":                       "Excel",
    "tally":                       "Tally",
    "autocad":                     "AutoCAD",
    "accounting":                  "Accounting",
    "financial analysis":          "Financial Analysis",
    "photoshop":                   "Adobe Photoshop",
    "illustrator":                 "Adobe Illustrator",
    "graphic design":              "Graphic Design",
    "video editing":               "Video Editing",
    "web design":                  "Web Design",
    "analytics":                   "Google Analytics",
    "social media":                "Social Media",
    "content writing":             "Content Writing",
    "seo":                         "SEO",
    "communication":               "Communication",
    "customer service":            "Customer Service",
    "english speaking":            "English Speaking",
    "sales":                       "Sales",
    "hr management":               "HR Management",
    "driving licence":             "Driving Licence",
    "electrical work":             "Electrical Work",
    "mechanical":                  "Mechanical",
    "welding":                     "Welding",
    "supply chain":                "Supply Chain",
    "inventory management":        "Inventory Management",
    "network administration":      "Network Administration",
    "cybersecurity":               "Cybersecurity",
    "data entry":                  "Data Entry",
    "computer basics":             "Computer Basics",
    "legal research":              "Legal Research",
}

# ─── NSDC / Skill India Course Links ─────────────────────────────────────────
# Keyed by CANONICAL display name (same form used in CANONICAL_FORMS values).
# When a missing skill has an entry here, it is surfaced in the API response
# under reasons.skill_match.courses_for_missing.
NSDC_COURSE_LINKS: dict[str, dict] = {
    "Python":             {"course_name": "Python Programming",                    "url": "https://www.skillindiadigital.gov.in/", "duration": "40 hrs", "free": True},
    "JavaScript":         {"course_name": "Web Development with JavaScript",        "url": "https://www.skillindiadigital.gov.in/", "duration": "60 hrs", "free": True},
    "React":              {"course_name": "React.js Frontend Development",          "url": "https://www.skillindiadigital.gov.in/", "duration": "30 hrs", "free": True},
    "SQL":                {"course_name": "Database Management with SQL",           "url": "https://www.skillindiadigital.gov.in/", "duration": "20 hrs", "free": True},
    "Excel":              {"course_name": "Advanced Microsoft Excel",               "url": "https://www.skillindiadigital.gov.in/", "duration": "15 hrs", "free": True},
    "Tally":              {"course_name": "Tally Prime for Accounting",             "url": "https://www.skillindiadigital.gov.in/", "duration": "25 hrs", "free": True},
    "Accounting":         {"course_name": "Basics of Accounting",                  "url": "https://www.skillindiadigital.gov.in/", "duration": "30 hrs", "free": True},
    "Machine Learning":   {"course_name": "Introduction to Machine Learning",      "url": "https://www.skillindiadigital.gov.in/", "duration": "50 hrs", "free": True},
    "Data Analysis":      {"course_name": "Data Analytics Fundamentals",           "url": "https://www.skillindiadigital.gov.in/", "duration": "35 hrs", "free": True},
    "Communication":      {"course_name": "Business Communication Skills",         "url": "https://www.skillindiadigital.gov.in/", "duration": "20 hrs", "free": True},
    "English Speaking":   {"course_name": "Spoken English for Professionals",      "url": "https://www.skillindiadigital.gov.in/", "duration": "30 hrs", "free": True},
    "AutoCAD":            {"course_name": "AutoCAD 2D/3D Design",                  "url": "https://www.skillindiadigital.gov.in/", "duration": "40 hrs", "free": True},
    "Graphic Design":     {"course_name": "Graphic Design with Canva & Photoshop", "url": "https://www.skillindiadigital.gov.in/", "duration": "25 hrs", "free": True},
    "Content Writing":    {"course_name": "Digital Content Writing",               "url": "https://www.skillindiadigital.gov.in/", "duration": "15 hrs", "free": True},
    "Social Media":       {"course_name": "Social Media Marketing",                "url": "https://www.skillindiadigital.gov.in/", "duration": "20 hrs", "free": True},
    "Financial Analysis": {"course_name": "Financial Modelling & Analysis",        "url": "https://www.skillindiadigital.gov.in/", "duration": "40 hrs", "free": True},
    "Electrical Work":    {"course_name": "Basic Electrical Works",                "url": "https://www.skillindiadigital.gov.in/", "duration": "120 hrs", "free": True},
    "Welding":            {"course_name": "Welding Technology",                    "url": "https://www.skillindiadigital.gov.in/", "duration": "150 hrs", "free": True},
}


def get_courses_for_missing(missing_display: list[str]) -> list[dict]:
    """
    Given a list of display-name skill strings that the candidate is missing,
    return NSDC course suggestions for any that have a mapping.
    Skills with no mapping are silently omitted.
    """
    courses = []
    for skill in missing_display:
        entry = NSDC_COURSE_LINKS.get(skill)
        if entry:
            courses.append({"skill": skill, **entry})
    return courses


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

_REVERSE_ALIAS: dict[str, list[str]] = {}
for _key, _vals in SECTOR_ALIASES.items():
    for _v in _vals:
        _REVERSE_ALIAS.setdefault(_v, []).append(_key)


# ─── Public helpers ───────────────────────────────────────────────────────────

def normalize_skills(skills: list) -> list[str]:
    """Lowercase, synonym-map, and deduplicate a list of skill strings."""
    if not skills:
        return []
    seen: set[str] = set()
    result: list[str] = []
    for raw in skills:
        if not raw:
            continue
        key = str(raw).lower().strip()
        key = SKILL_SYNONYMS.get(key, key)
        if key not in seen:
            seen.add(key)
            result.append(key)
    return result


def get_skill_display_name(skill: str) -> str:
    """Return the canonical display name for a raw or normalised skill string."""
    if not skill:
        return skill
    key = str(skill).lower().strip()
    key = SKILL_SYNONYMS.get(key, key)
    return CANONICAL_FORMS.get(key, skill)


def _to_display(skills: list[str]) -> list[str]:
    return [get_skill_display_name(s) for s in skills]


# ─── Recommender class ────────────────────────────────────────────────────────

class ContentBasedRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
        self.education_hierarchy = {
            '10th': 1, '12th': 2, 'ITI': 3, 'Diploma': 4,
            'Graduate': 5, 'Postgraduate': 6,
        }
        self.sector_relations = {
            'IT/Software':     ['Telecommunications', 'E-commerce', 'Media'],
            'Manufacturing':   ['Automotive', 'Logistics', 'Food Processing'],
            'Healthcare':      ['Pharmaceuticals', 'NGO/Social Work'],
            'Retail':          ['E-commerce', 'FMCG'],
            'Agriculture':     ['Food Processing'],
            'Education':       ['NGO/Social Work'],
            'Finance/Banking': ['Real Estate'],
            'Tourism':         ['Hospitality', 'Aviation'],
        }
        self.internships_data: list[dict] = []
        self.internship_tfidf = None
        self._is_loaded = False

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _parse_skills(self, field) -> list[str]:
        """Safely coerce a DB JSON column value to a plain Python list."""
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
        """Pull all active internships, normalise skills, build TF-IDF matrix."""
        internships = Internship.query.filter_by(is_active=True).all()
        self.internships_data = []

        for i in internships:
            raw_skills  = self._parse_skills(i.required_skills)
            norm_skills = normalize_skills(raw_skills)
            self.internships_data.append({
                'id':              i.id,
                'company':         i.company,
                'role':            i.role,
                'sector':          i.sector,
                'required_skills': norm_skills,
                'skills_text':     " ".join(norm_skills),
                'min_education':   i.min_education,
                'preferred_field': i.preferred_field,
                'location_state':  i.location_state,
                'location_city':   getattr(i, 'location_city', ''),
                'stipend_monthly': getattr(i, 'stipend_monthly', 0),
                'total_slots':     i.total_slots,
                'filled_slots':    i.filled_slots,
            })

        corpus = [d['skills_text'] for d in self.internships_data]
        if corpus:
            self.internship_tfidf = self.vectorizer.fit_transform(corpus)
        else:
            self.internship_tfidf = None
        self._is_loaded = True

    # ── Scoring helpers ───────────────────────────────────────────────────────

    def _calculate_skill_match(self, cand_norm: list[str], internship: dict, index: int):
        i_norm = internship['required_skills']
        if not cand_norm or not i_norm:
            return 0.0, [], _to_display(i_norm)

        cand_vector = self.vectorizer.transform([" ".join(cand_norm)])
        if self.internship_tfidf is not None:
            similarity = cosine_similarity(
                cand_vector, self.internship_tfidf[index:index + 1]
            )[0][0]
        else:
            similarity = 0.0

        cand_set = set(cand_norm)
        matched  = [s for s in i_norm if s in cand_set]
        missing  = [s for s in i_norm if s not in cand_set]
        return float(similarity), _to_display(matched), _to_display(missing)

    def _calculate_education_match(self, cand_edu: str, req_edu: str):
        if not req_edu:
            return 1.0, "No specific education required"
        if not cand_edu:
            return 0.0, "Candidate education not provided"
        cl = self.education_hierarchy.get(cand_edu, 0)
        rl = self.education_hierarchy.get(req_edu, 0)
        if cl >= rl:
            return 1.0, f"{cand_edu} meets or exceeds {req_edu} requirement"
        elif cl == rl - 1:
            return 0.5, f"{cand_edu} is one level below {req_edu} requirement"
        return 0.0, f"{cand_edu} is significantly below {req_edu} requirement"

    def _calculate_sector_match(self, cand_sectors_raw, req_sector: str):
        if not req_sector:
            return 1.0, "Internship has no specific sector."
        c_sectors = self._parse_skills(cand_sectors_raw)
        if not c_sectors:
            return 0.0, "No candidate sector preferences matched."

        # Tier 1 — exact
        if req_sector in c_sectors:
            return 1.0, f"{req_sector} sector exactly matches your interests."

        # Tier 2 — alias
        for ck in _REVERSE_ALIAS.get(req_sector, []):
            if ck in c_sectors:
                return 1.0, f"{req_sector} sector matches your {ck} interest."
        for cs in c_sectors:
            if req_sector in SECTOR_ALIASES.get(cs, []):
                return 1.0, f"{req_sector} sector matches your {cs} interest."

        # Tier 3 — legacy partial credit
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
        if not total or total <= 0 or filled >= total:
            return 0.0, 0
        return float((total - filled) / total), (total - filled)

    # ── Main entry point ──────────────────────────────────────────────────────

    def recommend(
        self,
        candidate_id=None,
        candidate_obj=None,
        top_n: int = 5,
        min_stipend: int = 0,
    ) -> list[dict]:
        """
        Parameters
        ----------
        candidate_id  : int | None  — DB id for saved candidates
        candidate_obj : Candidate   — transient object for anonymous flows
        top_n         : int         — max results
        min_stipend   : int         — monthly stipend floor (0 = no filter).
                        If no internships meet the floor, relaxes to 80% and
                        includes a stipend_warning on every result.
                        stipend_note added to reasons dict only when > 0.
        """
        if not self._is_loaded:
            self.load_internships()

        candidate = candidate_obj if candidate_obj else Candidate.query.get(candidate_id)
        if not candidate:
            return []

        # ── Stipend pre-filter ────────────────────────────────────────────────
        stipend_warning: str | None = None
        if min_stipend > 0:
            work_pool = [i for i in self.internships_data if i['stipend_monthly'] >= min_stipend]
            if not work_pool:
                relaxed   = int(min_stipend * 0.8)
                work_pool = [i for i in self.internships_data if i['stipend_monthly'] >= relaxed]
                stipend_warning = (
                    f"No internships found above \u20b9{min_stipend:,}/month. "
                    f"Showing results above \u20b9{relaxed:,}/month instead."
                )
        else:
            work_pool = self.internships_data

        # Keep original TF-IDF row indices aligned with work_pool items
        pool_with_indices = [
            (orig_idx, item)
            for orig_idx, item in enumerate(self.internships_data)
            if item in work_pool
        ]

        # Normalise candidate skills once
        cand_norm = normalize_skills(self._parse_skills(candidate.skills))

        recommendations: list[dict] = []

        for orig_idx, internship in pool_with_indices:
            # 1. Skill (35%)
            skill_score, matched, missing = self._calculate_skill_match(
                cand_norm, internship, orig_idx
            )
            # 2. Education (25%)
            edu_score, edu_reason = self._calculate_education_match(
                candidate.education_level, internship['min_education']
            )
            # 3. Sector (20%)
            sector_score, sector_reason = self._calculate_sector_match(
                candidate.sector_interests, internship['sector']
            )
            # 4. Location (15%)
            loc_score, loc_reason = self._calculate_location_match(
                candidate.state, internship['location_state']
            )
            # 5. Capacity (5%)
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

            reasons: dict = {
                "skill_match": {
                    "score":                round(skill_score, 2),
                    "matched_skills":       matched,
                    "missing_skills":       missing,
                    "skill_gap_percentage": (
                        int(len(missing) / len(internship['required_skills']) * 100)
                        if internship['required_skills'] else 0
                    ),
                    "courses_for_missing":  get_courses_for_missing(missing),
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

            stipend         = internship['stipend_monthly']
            min_stipend_met: bool | None = None

            if min_stipend > 0:
                min_stipend_met = stipend >= min_stipend
                if min_stipend_met:
                    reasons['stipend_note'] = {
                        "score": 1.0,
                        "note":  f"\u20b9{stipend:,}/month meets your \u20b9{min_stipend:,} minimum",
                    }
                else:
                    reasons['stipend_note'] = {
                        "score": 0.8,
                        "note":  f"\u20b9{stipend:,}/month slightly below your \u20b9{min_stipend:,} preference",
                    }

            result: dict = {
                "internship_id":   internship['id'],
                "company":         internship['company'],
                "role":            internship['role'],
                "sector":          internship['sector'],
                "required_skills": _to_display(internship['required_skills']),
                "location_state":  internship['location_state'],
                "stipend_monthly": stipend,
                "final_score":     round(final_score, 4),
                "reasons":         reasons,
            }
            if min_stipend_met is not None:
                result['min_stipend_met'] = min_stipend_met
            if stipend_warning:
                result['stipend_warning'] = stipend_warning

            recommendations.append(result)

        recommendations.sort(key=lambda x: x['final_score'], reverse=True)
        return recommendations[:top_n]


# Global singleton
content_based_recommender = ContentBasedRecommender()
