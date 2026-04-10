from flask import Blueprint, jsonify

recommend_bp = Blueprint('recommend', __name__, url_prefix='/api/v1/recommend')

@recommend_bp.route('/', methods=['GET'])
def get_recommendations():
    return jsonify({"message": "Recommendations endpoint"})
