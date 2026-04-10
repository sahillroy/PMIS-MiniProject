from flask import Flask, jsonify

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    from app.models import db
    db.init_app(app)

    # Register blueprints
    from app.routes.recommend import recommend_bp
    from app.routes.profile import profile_bp
    from app.routes.internships import internships_bp

    app.register_blueprint(recommend_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(internships_bp)

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

    return app
