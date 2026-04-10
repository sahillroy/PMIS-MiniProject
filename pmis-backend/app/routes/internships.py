from flask import Blueprint, jsonify, request
from app.models import Internship

internships_bp = Blueprint('internships', __name__, url_prefix='/api/v1/internships')

@internships_bp.route('/', methods=['GET'])
def get_internships():
    sector = request.args.get('sector')
    state = request.args.get('state')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)

    query = Internship.query

    if sector:
        query = query.filter(Internship.sector == sector)
    if state:
        query = query.filter(Internship.location_state == state)

    pagination = query.paginate(page=page, per_page=limit, error_out=False)

    return jsonify({
        "items": [{
            "id": i.id,
            "company": i.company,
            "role": i.role,
            "sector": i.sector,
            "location_state": i.location_state,
            "location_city": i.location_city,
            "stipend_monthly": i.stipend_monthly,
            "total_slots": i.total_slots,
            "filled_slots": i.filled_slots,
            "is_active": i.is_active
        } for i in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    })

@internships_bp.route('/<int:id>', methods=['GET'])
def get_internship(id):
    internship = Internship.query.get_or_404(id)
    return jsonify({
        "id": internship.id,
        "company": internship.company,
        "role": internship.role,
        "sector": internship.sector,
        "required_skills": internship.required_skills,
        "min_education": internship.min_education,
        "preferred_field": internship.preferred_field,
        "location_state": internship.location_state,
        "location_city": internship.location_city,
        "stipend_monthly": internship.stipend_monthly,
        "total_slots": internship.total_slots,
        "filled_slots": internship.filled_slots,
        "is_active": internship.is_active
    })
