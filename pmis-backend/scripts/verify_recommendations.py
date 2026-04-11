"""
PMIS — End-to-End Recommendation Quality Verifier
Run from pmis-backend directory:
    .\\venv\\Scripts\\python.exe scripts\\verify_recommendations.py
"""
import os
import sys
import subprocess

# Ensure app/ is importable from scripts/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.models import Candidate
from app.ml.hybrid_scorer import hybrid_scorer


def _unique_sectors(recs, max_per_sector=2, take=5):
    """Return up to `take` results with at most `max_per_sector` per sector."""
    counts = {}
    result = []
    for r in recs:
        s = r.get('sector', '__unknown__')
        if counts.get(s, 0) < max_per_sector:
            result.append(r)
            counts[s] = counts.get(s, 0) + 1
        if len(result) >= take:
            break
    return result


# ─── Test Scenarios ───────────────────────────────────────────────────────────
# Each scenario must define:
#   name, profile dict, verify(recs) -> bool, expected str
# For Scenario 5 the verify receives the raw top-15 list; diversity is handled inside.

SCENARIOS = [
    {
        "name": "Scenario 1 (CS Graduate, Python+ML, IT, MH)",
        "profile": {
            "name": "S1",
            "education_level": "Graduate",
            "field_of_study": "Computer Science",
            # Use skills actually present in real_internships.json
            "skills": ["Python", "Data Analysis", "Machine Learning"],
            "sector_interests": ["IT"],
            "state": "Maharashtra",
            "is_rural": False,
            "category": "GEN"
        },
        "verify": lambda recs: (
            len(recs) > 0
            and recs[0]['sector'] in ("IT", "IT/Software", "Telecom")
            and len(
                set(recs[0].get('required_skills', [])).intersection(
                    {"Python", "Data Analysis", "Machine Learning",
                     "JavaScript", "Java", "C++", "SQL"}
                )
            ) >= 1
        ),
        "expected": "Top result is IT family; >= 1 tech skill overlaps",
        "top_n": 5
    },
    {
        "name": "Scenario 2 (12th Pass, Communication+MS Office, Rural SC, RJ)",
        "profile": {
            "name": "S2",
            "education_level": "12th",
            "field_of_study": "Any",
            "skills": ["Communication", "MS Office"],
            "sector_interests": [],
            "state": "Rajasthan",
            "is_rural": True,
            "category": "SC"
        },
        "verify": lambda recs: len(recs) > 0 and recs[0].get('affirmative_boost', 0) > 0.10,
        "expected": "affirmative_boost > 0.10 in top result",
        "top_n": 5
    },
    {
        "name": "Scenario 3 (Commerce Grad, Tally+Accounting, Banking, GJ)",
        "profile": {
            "name": "S3",
            "education_level": "Graduate",
            "field_of_study": "Commerce",
            "skills": ["Tally", "Accounting"],
            "sector_interests": ["Banking"],
            "state": "Gujarat",
            "is_rural": False,
            "category": "GEN"
        },
        "verify": lambda recs: len(recs) > 0 and recs[0]['sector'] in ("Banking", "Finance"),
        "expected": "Top result sector in ['Banking', 'Finance']",
        "top_n": 5
    },
    {
        "name": "Scenario 4 (ITI, Electrical Work + Welding, Manufacturing, UP)",
        "profile": {
            "name": "S4",
            "education_level": "ITI",
            "field_of_study": "Electrical",
            "skills": ["Electrical Work", "Welding"],
            "sector_interests": ["Manufacturing"],
            "state": "Uttar Pradesh",
            "is_rural": False,
            "category": "GEN"
        },
        "verify": lambda recs: (
            len(recs) > 0
            and len(
                set(recs[0].get('required_skills', [])).intersection(
                    {"Electrical Work", "Welding", "Mechanical"}
                )
            ) > 0
        ),
        "expected": "Top result required_skills overlaps with Electrical/Welding/Mechanical",
        "top_n": 5
    },
    {
        "name": "Scenario 5 (Graduate, Mixed skills, Pan-India / no sector pref)",
        "profile": {
            "name": "S5",
            "education_level": "Graduate",
            "field_of_study": "Any",
            "skills": ["Communication", "Excel", "Data Entry"],
            "sector_interests": [],
            "state": "",             # empty string → treated as pan-India
            "is_rural": False,
            "category": "GEN"
        },
        # fetch 15, diversity-deduplicate (max 2 per sector), check >= 3 sectors
        "verify": lambda recs: len(set(r['sector'] for r in _unique_sectors(recs, 2, 5))) >= 3,
        "expected": "At least 3 unique sectors across diversity-deduped top-5",
        "top_n": 15            # fetch more so diversity can be assessed
    },
]


def run_tests(skip_reseed=False):
    # ── Step 1: Re-seed ───────────────────────────────────────────────────────
    if not skip_reseed:
        print("=" * 60)
        print("Re-seeding database via generate_seed.py...")
        print("=" * 60)
        seed_script = os.path.join(os.path.dirname(__file__), '..', 'seed', 'generate_seed.py')
        try:
            subprocess.run(
                [sys.executable, seed_script],
                check=True,
                cwd=os.path.join(os.path.dirname(__file__), '..')
            )
        except subprocess.CalledProcessError as e:
            print(f"ERROR: Seed script failed — {e}")
            return

    print("\nDatabase ready. Running scenarios...\n")

    # ── Step 2: Run scenarios inside Flask context ────────────────────────────
    app = create_app()
    with app.app_context():
        passed = 0

        for s in SCENARIOS:
            print("-" * 60)
            print(f"  {s['name']}")
            print(f"  Expected : {s['expected']}")

            p = s['profile']
            candidate = Candidate(
                name=p['name'],
                education_level=p['education_level'],
                field_of_study=p['field_of_study'],
                skills=p['skills'],
                sector_interests=p['sector_interests'],
                state=p['state'],
                district="",
                is_rural=p['is_rural'],
                category=p['category']
            )
            recs = hybrid_scorer.get_recommendations(
                candidate_id=None,
                top_n=s['top_n'],
                candidate_obj=candidate
            )

            try:
                is_pass = s['verify'](recs)
            except Exception as exc:
                print(f"  VERIFY ERROR: {exc}")
                is_pass = False

            status = "PASS" if is_pass else "FAIL"
            if is_pass:
                passed += 1

            print(f"  Result   : {status}")

            if recs:
                top = recs[0]
                print(f"  Top Match: {top['role']} @ {top['company']} [{top['sector']}]")
                overlap = set(top.get('required_skills', [])).intersection(p['skills'])
                print(f"  Skill Overlap   : {sorted(overlap) or '(none)'}")
                print(f"  Affirmative Boost: {top.get('affirmative_boost', 0):.2f}")

            if s['top_n'] > 5:
                diverse = _unique_sectors(recs, max_per_sector=2, take=5)
                sectors = [r['sector'] for r in diverse]
                print(f"  Diversity sectors: {sectors}")

            print()

        # ── Summary ───────────────────────────────────────────────────────────
        print("=" * 60)
        print(f"  SUMMARY: {passed}/{len(SCENARIOS)} scenarios passed")
        print("=" * 60)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--skip-reseed', action='store_true', help='Skip DB re-seed')
    args = parser.parse_args()
    run_tests(skip_reseed=args.skip_reseed)
