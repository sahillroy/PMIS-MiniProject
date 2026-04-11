from flask import Blueprint, jsonify
from app.models import Candidate
from app.ml.hybrid_scorer import hybrid_scorer

debug_bp = Blueprint('debug', __name__, url_prefix='/api/v1/debug')

@debug_bp.route('/sample-recommendations', methods=['GET'])
def sample_recommendations():
    scenarios = [
        {
            "name": "Scenario 1 (CS Graduate, Python+SQL, IT, MH)",
            "profile": {
                "name": "S1",
                "education_level": "Graduate",
                "field_of_study": "Computer Science",
                "skills": ["Python", "SQL"],
                "sector_interests": ["IT"],
                "state": "Maharashtra",
                "is_rural": False,
                "category": "GEN"
            }
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
            }
        },
        {
            "name": "Scenario 3 (Commerce Grad, Tally+Accounting, Banking, GJ)",
            "profile": {
                "name": "S3",
                "education_level": "Graduate",
                "field_of_study": "Commerce",
                "skills": ["Tally", "Accounting"],
                "sector_interests": ["Banking", "Finance"],
                "state": "Gujarat",
                "is_rural": False,
                "category": "GEN"
            }
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
            }
        },
        {
            "name": "Scenario 5 (Graduate, Mixed skills, Pan-India)",
            "profile": {
                "name": "S5",
                "education_level": "Graduate",
                "field_of_study": "Any",
                "skills": ["Communication", "Excel", "Data Entry"],
                "sector_interests": [],
                "state": "", # Pan-India
                "is_rural": False,
                "category": "GEN"
            }
        }
    ]

    results = []
    for s in scenarios:
        p = s['profile']
        c = Candidate(
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
        recs = hybrid_scorer.get_recommendations(candidate_id=None, top_n=5, candidate_obj=c)
        results.append({
            "scenario": s['name'],
            "profile": p,
            "recommendations": recs
        })

    return jsonify(results)
