from flask import Blueprint, jsonify, request
from app.models import db, Application

apply_bp = Blueprint('apply', __name__, url_prefix='/api/v1/apply')

@apply_bp.route('/', methods=['POST'])
def submit_application():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input provided"}), 400
        
    candidate_id = data.get('candidate_id')
    internship_id = data.get('internship_id')
    
    if not candidate_id or not internship_id:
        return jsonify({"error": "candidate_id and internship_id required"}), 400
        
    # Check if already applied
    existing = Application.query.filter_by(candidate_id=candidate_id, internship_id=internship_id).first()
    if existing:
        return jsonify({"error": "Already applied to this internship"}), 409
        
    new_app = Application(
        candidate_id=candidate_id,
        internship_id=internship_id,
        status='applied',
        recommendation_score=0.0 # Will be populated by ML ideally later
    )
    
    db.session.add(new_app)
    db.session.commit()
    
    return jsonify({
        "application_id": new_app.id,
        "status": "applied",
        "message": "Application submitted successfully"
    }), 201
