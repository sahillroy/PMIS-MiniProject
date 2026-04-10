from flask import Blueprint, jsonify

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

@profile_bp.route('/', methods=['GET'])
def get_profile():
    return jsonify({"message": "Profile endpoint"})
