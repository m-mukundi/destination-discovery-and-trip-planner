from flask import Blueprint, render_template

auth_bp = Blueprint(
    "auth",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/auth/static",
)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    # Skeleton only: just renders the page
    return render_template("auth/login.html")


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    # Skeleton only: just renders the page
    return render_template("auth/signup.html")