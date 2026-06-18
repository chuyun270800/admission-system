import os
from pathlib import Path

from flask import Flask, send_from_directory

from .config import Config
from .extensions import cors, db
from .legacy_cleanup import remove_legacy_demo_data
from .routes.auth import auth_bp
from .routes.dashboard import dashboard_bp
from .routes.dev import dev_bp
from .routes.import_export import import_export_bp
from .routes.interviews import interviews_bp
from .routes.results import results_bp
from .routes.schedules import schedules_bp
from .routes.students import students_bp
from .schema import ensure_schema
from .seed import seed_database


def create_app():
    app = Flask(__name__, instance_relative_config=True, static_folder=None)
    app.config.from_object(Config)
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(dev_bp, url_prefix="/api/dev")
    app.register_blueprint(import_export_bp, url_prefix="/api")
    app.register_blueprint(interviews_bp, url_prefix="/api/interviews")
    app.register_blueprint(results_bp, url_prefix="/api/results")
    app.register_blueprint(students_bp, url_prefix="/api/students")
    app.register_blueprint(schedules_bp, url_prefix="/api/schedules")

    @app.get("/api/health")
    def healthcheck():
        return {"status": "ok"}

    frontend_build_dir = Path(__file__).resolve().parents[2] / "build"

    @app.get("/")
    def serve_react_app():
        if not frontend_build_dir.exists():
            return {"message": "React build not found. Run npm run build first."}, 404

        return send_from_directory(frontend_build_dir, "index.html")

    @app.get("/<path:path>")
    def serve_react_routes(path):
        if path.startswith("api/"):
            return {"error": "API endpoint not found."}, 404

        requested_file = frontend_build_dir / path
        if requested_file.is_file():
            return send_from_directory(frontend_build_dir, path)

        if not frontend_build_dir.exists():
            return {"message": "React build not found. Run npm run build first."}, 404

        return send_from_directory(frontend_build_dir, "index.html")

    @app.cli.command("init-db")
    def init_db_command():
        db.create_all()
        ensure_schema()
        print("Database initialized.")

    @app.cli.command("seed-db")
    def seed_db_command():
        db.create_all()
        ensure_schema()
        seed_database()
        print("Database seeded.")

    with app.app_context():
        db.create_all()
        ensure_schema()
        remove_legacy_demo_data()
        seed_database()

    return app
