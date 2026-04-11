# -*- coding: utf-8 -*-
import sys
import requests
import time

# Force UTF-8 output for Windows terminals
sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:5000/api/v1/recommend/"

test_payload = {
    "profile": {
        "candidate_id": 9999,
        "education_level": "Graduate",
        "skills": ["Python", "Java", "SQL"],
        "sector_interests": ["IT/Software"],
        "preferred_state": "Maharashtra",
        "has_prior_internship": False,
        "category": "SC",
        "is_rural": True
    }
}

PASS = "PASS"
FAIL = "FAIL"

def check(name, condition):
    status = PASS if condition else FAIL
    marker = "[OK]" if condition else "[!!]"
    print(f"  {marker} {status}: {name}")

def audit():
    print("=" * 55)
    print("  PMIS API Audit Report")
    print("=" * 55)
    print(f"  Target: {API_URL}")
    print("=" * 55)

    start = time.time()
    try:
        response = requests.post(API_URL, json=test_payload, timeout=10)
        response_time = time.time() - start

        print(f"\n[Endpoint] POST /api/v1/recommend/")
        print(f"  Response Time: {response_time:.3f}s")
        check("Response Time < 2.0s", response_time < 2.0)
        check("HTTP 200 OK", response.status_code == 200)

        data = response.json()
        
        # API returns an object wrapper: {"recommendations": [...], ...}
        is_wrapped = isinstance(data, dict) and "recommendations" in data
        check("Response has 'recommendations' key", is_wrapped)
        
        recs = data.get("recommendations", []) if is_wrapped else (data if isinstance(data, list) else [])
        check("At least 1 recommendation returned", len(recs) > 0)
        check("candidate_name in response", "candidate_name" in data if is_wrapped else True)

        if len(recs) > 0:
            item = recs[0]
            print(f"\n[Shape] Checking first recommendation item:")
            
            # Core Fields
            print(f"\n  -- Core Fields --")
            for f in ["company", "role", "sector", "location", "stipend_monthly", "match_percentage"]:
                check(f"has field '{f}'", f in item)

            check("match_percentage is a number (0-100)",
                  isinstance(item.get("match_percentage"), (int, float))
                  and 0 <= item.get("match_percentage", -1) <= 100)

            # Skill Match
            print(f"\n  -- reasons.skill_match --")
            reasons = item.get("reasons", {})
            sm = reasons.get("skill_match", {})
            check("reasons.skill_match exists", isinstance(sm, dict))
            check("matched_skills is a list", isinstance(sm.get("matched_skills"), list))
            check("missing_skills is a list", isinstance(sm.get("missing_skills"), list))
            check("courses_for_missing is a list", isinstance(sm.get("courses_for_missing"), list))

            # Affirmative Action
            print(f"\n  -- reasons.affirmative_action --")
            aa = reasons.get("affirmative_action", {})
            check("affirmative_action exists", isinstance(aa, dict))
            check("affirmative_boosts_applied is a list",
                  isinstance(aa.get("affirmative_boosts_applied", []), list))
            
            # Confidence Interval
            print(f"\n  -- confidence --")
            conf = item.get("confidence", {})
            check("confidence object exists", isinstance(conf, dict))
            check("confidence_lower is a number", isinstance(conf.get("confidence_lower"), (int, float)))
            check("confidence_upper is a number", isinstance(conf.get("confidence_upper"), (int, float)))
            check("confidence_lower <= confidence_upper",
                  conf.get("confidence_lower", 0) <= conf.get("confidence_upper", 0))

        print("\n" + "=" * 55)
        print("  Audit Complete")
        print("=" * 55)

    except requests.exceptions.ConnectionError:
        print("  [!!] FAIL: Cannot connect to backend. Is Flask running on port 5000?")
    except requests.exceptions.Timeout:
        print("  [!!] FAIL: Request timed out after 10s.")
    except Exception as e:
        print(f"  [!!] Unexpected error: {e}")

if __name__ == "__main__":
    audit()
