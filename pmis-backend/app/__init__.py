from flask import Flask

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

    return app
