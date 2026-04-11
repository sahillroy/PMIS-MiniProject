"""
PMIS Recommend Routes
======================
Routes:
  POST /api/v1/recommend/          — main recommendation endpoint
  POST /api/v1/feedback            — thumbs up/down; triggers async CF retrain
  GET  /api/v1/feedback/status     — interaction count + scoring mode info
  GET  /api/v1/cf/retrain          — admin: force synchronous CF retrain
"""

import threading
import time
from flask import Blueprint, jsonify, request
from app.models import db, Candidate, Application
from app.ml.hybrid_scorer import hybrid_scorer
from app.ml.collaborative import collaborative_filter

recommend_bp = Blueprint('recommend', __name__, url_prefix='/api/v1')


# ─── Main recommendation endpoint ────────────────────────────────────────────

@recommend_bp.route('/recommend/', methods=['POST'])
def get_recommendations():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    candidate_id = data.get('candidate_id')
    profile      = data.get('profile')

    if candidate_id:
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
            "candidate_name":   anon_candidate.name,
            "scoring_mode":     "content_only",
            "min_stipend_used": min_stipend if min_stipend > 0 else None,
            "recommendations":  results,
        })

    else:
        return jsonify({"error": "Must provide candidate_id or profile"}), 400


# ─── Feedback endpoint ────────────────────────────────────────────────────────

@recommend_bp.route('/feedback', methods=['POST'])
def record_feedback():
    """
    Record a thumbs-up / thumbs-down interaction and trigger async CF retrain.

    Body: {
      "candidate_id":  1,
      "internship_id": 5,
      "feedback":      "positive" | "negative" | "neutral"
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    candidate_id  = data.get('candidate_id')
    internship_id = data.get('internship_id')
    feedback      = data.get('feedback', 'neutral')

    if not candidate_id or not internship_id:
        return jsonify({"error": "candidate_id and internship_id are required"}), 400
    if feedback not in ('positive', 'negative', 'neutral'):
        return jsonify({"error": "feedback must be 'positive', 'negative', or 'neutral'"}), 400

    # Map feedback to Application columns
    feedback_map = {
        'positive': ('accepted', 5.0),
        'negative': ('rejected', 1.0),
        'neutral':  ('applied',  3.0),
    }
    status, score = feedback_map[feedback]

    # Upsert: update existing application or create a new one
    existing = Application.query.filter_by(
        candidate_id=candidate_id,
        internship_id=internship_id,
    ).first()

    if existing:
        existing.status               = status
        existing.recommendation_score = score
    else:
        app_record = Application(
            candidate_id=candidate_id,
            internship_id=internship_id,
            status=status,
            recommendation_score=score,
        )
        db.session.add(app_record)

    db.session.commit()

    # Trigger async retrain (daemon thread — won't block the response)
    def _retrain_async():
        collaborative_filter.retrain()

    threading.Thread(target=_retrain_async, daemon=True).start()

    return jsonify({
        "recorded":    True,
        "feedback":    feedback,
        "retraining":  True,
        "message":     "Feedback recorded. Personalising your recommendations...",
    }), 201


# ─── Feedback status endpoint ─────────────────────────────────────────────────

@recommend_bp.route('/feedback/status', methods=['GET'])
def feedback_status():
    """
    GET /api/v1/feedback/status?candidate_id=1
    Returns interaction count, scoring mode, and CF observability data.
    """
    try:
        candidate_id = int(request.args.get('candidate_id', 0)) or None
    except ValueError:
        candidate_id = None

    status = collaborative_filter.get_status(candidate_id)
    return jsonify(status)


# ─── Admin: force synchronous CF retrain ─────────────────────────────────────

@recommend_bp.route('/cf/retrain', methods=['GET'])
def force_retrain():
    """
    GET /api/v1/cf/retrain
    Forces a synchronous CF retrain. Returns timing and sample count.
    """
    t0      = time.time()
    success = collaborative_filter.retrain()
    took_ms = int((time.time() - t0) * 1000)

    return jsonify({
        "retrained":       success,
        "training_samples": collaborative_filter.training_sample_count,
        "took_ms":         took_ms,
        "last_trained_at": (
            collaborative_filter.last_trained_at.isoformat()
            if collaborative_filter.last_trained_at else None
        ),
    })
