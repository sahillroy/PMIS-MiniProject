from flask import Blueprint, jsonify

internships_bp = Blueprint('internships', __name__, url_prefix='/api/internships')

@internships_bp.route('/', methods=['GET'])
def get_internships():
    return jsonify({"message": "Internships endpoint"})
