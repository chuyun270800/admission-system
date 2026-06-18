from flask import Blueprint, request
from werkzeug.exceptions import BadRequest, MethodNotAllowed
from werkzeug.security import check_password_hash

from ..models import User


auth_bp = Blueprint("auth", __name__)


@auth_bp.errorhandler(BadRequest)
def handle_bad_request(_error):
    return {"error": "Request body must be valid JSON."}, 400


@auth_bp.errorhandler(MethodNotAllowed)
def handle_method_not_allowed(_error):
    return {
        "error": "Method not allowed.",
        "allowed_methods": ["POST"],
    }, 405


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not username or not password:
        return {"error": "Username and password are required."}, 400

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password_hash, password):
        return {"error": "Invalid username or password."}, 401

    return user.to_dict()
