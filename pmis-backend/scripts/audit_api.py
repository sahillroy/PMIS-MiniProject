import requests
import json
import sys
import time

BASE_URL = "http://127.0.0.1:5000"
ENDPOINT = f"{BASE_URL}/api/v1/recommend/"

# Sample Demo Profile: Rural, SC, Computer Basics
SAMPLE_PROFILE = {
    "profile": {
        "name": "Arjun Kumar",
        "education_level": "Graduate",
        "skills": ["Computer Basics", "English Speaking"],
        "sector_interests": ["IT/Software", "Education"],
        "preferred_state": "Uttar Pradesh",
        "district": "Bastar", # Aspirational district
        "is_rural": True,
        "category": "SC",
        "min_stipend_preference": 5000
    }
}

def audit_recommendations():
    print(f"--- API AUDIT: {ENDPOINT} ---")
    start_time = time.time()
    try:
        response = requests.post(ENDPOINT, json=SAMPLE_PROFILE, timeout=5)
    except Exception as e:
        print(f"FAIL: Could not connect to API: {e}")
        sys.exit(1)
    
    duration = time.time() - start_time
    
    if response.status_code != 200:
        print(f"FAIL: Server returned {response.status_code}")
        print(response.text)
        sys.exit(1)

    data = response.json()
    recs = data.get("recommendations", [])
    
    if not recs:
        print("FAIL: No recommendations returned.")
        sys.exit(1)

    print(f"Response Time: {duration:.4f}s {'[PASS]' if duration < 2.0 else '[FAIL: Too slow]'}")
    
    card = recs[0]
    checks = [
        ("match_percentage",               lambda c: isinstance(c.get("match_percentage"), (int, float))),
        ("company",                        lambda c: "company" in c),
        ("role",                           lambda c: "role" in c),
        ("sector",                         lambda c: "sector" in c),
        ("location",                       lambda c: "location" in c),
        ("stipend_monthly",                lambda c: "stipend_monthly" in c),
        ("reasons.skill_match.matched",    lambda c: isinstance(c.get("reasons", {}).get("skill_match", {}).get("matched_skills"), list)),
        ("reasons.skill_match.missing",    lambda c: isinstance(c.get("reasons", {}).get("skill_match", {}).get("missing_skills"), list)),
        ("reasons.skill_match.courses",    lambda c: isinstance(c.get("reasons", {}).get("skill_match", {}).get("courses_for_missing"), list)),
        ("reasons.affirmative_boosts",     lambda c: isinstance(c.get("reasons", {}).get("affirmative_boosts_applied"), list)),
        ("confidence.lower",               lambda c: isinstance(c.get("confidence", {}).get("confidence_lower"), (int, float))),
        ("confidence.upper",               lambda c: isinstance(c.get("confidence", {}).get("confidence_upper"), (int, float))),
    ]

    print("\nField Validation (Top Card):")
    passed_all = True
    for label, check in checks:
        if check(card):
            print(f"  [PASS] {label}")
        else:
            print(f"  [FAIL] {label}")
            passed_all = False

    if passed_all:
        print("\nOVERALL AUDIT: PASS")
    else:
        print("\nOVERALL AUDIT: FAIL")
        sys.exit(1)

if __name__ == "__main__":
    audit_recommendations()
