from flask import Blueprint, jsonify, request
from app.models import db, Candidate

profile_bp = Blueprint('profile', __name__, url_prefix='/api/v1/profile')

@profile_bp.route('/', methods=['GET'])
def get_profile():
    return jsonify({"message": "Profile endpoint"})

@profile_bp.route('/create', methods=['POST'])
def create_profile():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    new_candidate = Candidate(
        name=data.get('name'),
        education_level=data.get('education_level'),
        field_of_study=data.get('field_of_study'),
        cgpa=data.get('cgpa'),
        skills=data.get('skills', []),
        sector_interests=data.get('sector_interests', []),
        state=data.get('state'),
        district=data.get('district'),
        is_rural=data.get('is_rural', False),
        category=data.get('category'),
        has_prior_internship=data.get('has_prior_internship', False)
    )

    db.session.add(new_candidate)
    db.session.commit()

    return jsonify({"message": "Profile created successfully", "candidate_id": new_candidate.id}), 201
