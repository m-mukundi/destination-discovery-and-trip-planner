"""Email + password accounts using a Flask session cookie.

POST /api/auth/register  { email, password, name }
POST /api/auth/login     { email, password }
POST /api/auth/logout
GET  /api/auth/me        -> { user: {...} } or { user: null }
"""

import re

from email_validator import EmailNotValidError, validate_email
from flask import Blueprint, jsonify, session
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from models import User, db
from store import InvalidInput, get_current_user
from user_routes import parse_text, read_body

MIN_PASSWORD = 8
MAX_PASSWORD = 128

auth_bp = Blueprint("auth_api", __name__, url_prefix="/api/auth")


@auth_bp.errorhandler(InvalidInput)
def invalid_input(error):
    db.session.rollback()
    return jsonify({"error": str(error)}), 400


def clean_email(value):
    if not isinstance(value, str) or not value.strip():
        raise InvalidInput("Email is required")
    try:
        result = validate_email(value.strip(), check_deliverability=False)
    except EmailNotValidError:
        raise InvalidInput("Enter a valid email address") from None
    email = result.normalized.lower()
    if len(email) > 255:
        raise InvalidInput("Email is too long")
    return email


def check_password(value):
    if not isinstance(value, str) or len(value) < MIN_PASSWORD:
        raise InvalidInput(f"Password must be at least {MIN_PASSWORD} characters")
    if len(value) > MAX_PASSWORD:
        raise InvalidInput(f"Password must be at most {MAX_PASSWORD} characters")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise InvalidInput("Password must include at least one letter and one number")
    return value


def start_session(user):
    session.clear()  # drop any old session data before logging in
    session["user_id"] = user.id
    session.permanent = True


@auth_bp.post("/register")
def register():
    body = read_body()
    email = clean_email(body.get("email"))
    password = check_password(body.get("password"))
    name = parse_text(body.get("name"), "name", 100, required=True)

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        email=email,
        display_name=name,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:  # two sign-ups with the same email at once
        db.session.rollback()
        return jsonify({"error": "An account with this email already exists"}), 409

    start_session(user)
    return jsonify({"user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    body = read_body()
    email = clean_email(body.get("email"))
    password = body.get("password")

    user = User.query.filter_by(email=email).first()
    # Same message for "no such email" and "wrong password".
    if (
        user is None
        or not user.password_hash
        or not isinstance(password, str)
        or not check_password_hash(user.password_hash, password)
    ):
        return jsonify({"error": "Invalid email or password"}), 401

    start_session(user)
    return jsonify({"user": user.to_dict()})


@auth_bp.post("/logout")
def logout():
    session.clear()
    return "", 204


@auth_bp.get("/me")
def me():
    user = get_current_user()
    return jsonify({"user": user.to_dict() if user else None})