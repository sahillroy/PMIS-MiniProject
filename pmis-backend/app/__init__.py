import logging
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Configure CORS for React server
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
    
    from app.models import db
    db.init_app(app)

    # Logging config
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    @app.before_request
    def log_request_info():
        request.start_time = time.time()
        logger.info(f"Incoming Request: {request.method} {request.path}")

    @app.after_request
    def log_response_info(response):
        duration = time.time() - getattr(request, 'start_time', time.time())
        logger.info(f"Response: {response.status_code} [{duration:.4f}s]")
        return response

    # Register blueprints
    from app.routes.recommend import recommend_bp
    from app.routes.profile import profile_bp
    from app.routes.internships import internships_bp
    from app.routes.apply import apply_bp
    from app.routes.stats import stats_bp
    from app.routes.debug import debug_bp

    app.register_blueprint(recommend_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(internships_bp)
    app.register_blueprint(apply_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(debug_bp)

    @app.route('/api/v1/health')
    def health():
        from app.models import db
        try:
            db.session.execute(db.text('SELECT 1'))
            db_status = True
        except:
            db_status = False
        return jsonify({
            "status": "ok",
            "db_connected": db_status,
            "model_loaded": True
        })

    with app.app_context():
        db.create_all()

        # ── Warm up ML models at startup (avoids cold-start lag on first request) ──
        try:
            from app.ml.content_based import content_based_recommender
            from app.ml.collaborative import collaborative_filter
            if not content_based_recommender._is_loaded:
                logger.info("Warming up TF-IDF matrix...")
                content_based_recommender.load_internships()
                logger.info(f"TF-IDF matrix ready — {len(content_based_recommender.internships_data)} internships indexed.")
            if not collaborative_filter.is_trained:
                logger.info("Training collaborative filter...")
                collaborative_filter.retrain()
                logger.info("CF model ready.")
        except Exception as e:
            logger.warning(f"ML warm-up failed (non-critical): {e}")

    return app
