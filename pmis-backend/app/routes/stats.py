from flask import Blueprint, jsonify
from app.models import Candidate, Internship, Application

stats_bp = Blueprint('stats', __name__, url_prefix='/api/v1/stats')

@stats_bp.route('/', methods=['GET'])
def get_stats():
    total_candidates = Candidate.query.count()
    total_internships = Internship.query.count()
    total_applications = Application.query.count()
    
    conversion_rate = "0.0%"
    if total_candidates > 0:
        conversion_rate = f"{(total_applications / total_candidates) * 100:.1f}%"
        
    return jsonify({
        "total_candidates": total_candidates,
        "total_internships": total_internships,
        "total_applications": total_applications,
        "conversion_rate": conversion_rate
    })
