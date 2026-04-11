from flask import Blueprint, jsonify, request
from app.models import Candidate
from app.ml.hybrid_scorer import hybrid_scorer

recommend_bp = Blueprint('recommend', __name__, url_prefix='/api/v1/recommend')


@recommend_bp.route('/', methods=['POST'])
def get_recommendations():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    candidate_id = data.get('candidate_id')
    profile      = data.get('profile')

    if candidate_id:
        # ── DB lookup mode ────────────────────────────────────────────────────
        candidate = Candidate.query.get(candidate_id)
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404

        min_stipend = int(data.get('min_stipend', 0))

        results = hybrid_scorer.get_recommendations(
            candidate_id=candidate_id,
            top_n=5,
            min_stipend=min_stipend,
        )
        return jsonify({
            "candidate_name": candidate.name,
            "scoring_mode":   results[0].get('scoring_mode', 'content_only') if results else 'content_only',
            "recommendations": results,
        })

    elif profile:
        # ── Anonymous profile mode ────────────────────────────────────────────
        # Read min_stipend_preference from the profile object; fall back to 0
        min_stipend = int(profile.get('min_stipend_preference', data.get('min_stipend', 0)))

        anon_candidate = Candidate(
            name=profile.get('name', 'Anonymous User'),
            education_level=profile.get('education_level'),
            field_of_study=profile.get('field_of_study'),
            cgpa=profile.get('cgpa'),
            skills=profile.get('skills', []),
            sector_interests=profile.get('sector_interests', []),
            state=profile.get('state') or profile.get('preferred_state'),
            district=profile.get('district'),
            is_rural=profile.get('is_rural', False),
            category=profile.get('category'),
            has_prior_internship=profile.get('has_prior_internship', False),
        )

        results = hybrid_scorer.get_recommendations(
            candidate_id=None,
            top_n=5,
            candidate_obj=anon_candidate,
            min_stipend=min_stipend,
        )
        return jsonify({
            "candidate_name":  anon_candidate.name,
            "scoring_mode":    "content_only",
            "min_stipend_used": min_stipend if min_stipend > 0 else None,
            "recommendations": results,
        })

    else:
        return jsonify({"error": "Must provide candidate_id or profile"}), 400
