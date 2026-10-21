"""Database helpers shared by the search, details and user-data routes."""

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from models import (
    Destination,
    SavedPlace,
    SearchTerm,
    SearchTermResult,
    User,
    db,
    normalize_term,
    place_key,
    utc_now,
)

# Until accounts exist, everything belongs to this one user.
GUEST_EMAIL = "guest@localhost"

# Fields the API adds to a place; they are not part of the Nominatim record.
API_ONLY_FIELDS = {"place_key", "source", "saved"}


class InvalidInput(ValueError):
    """The request body is missing something or has a bad value (HTTP 400)."""


def dialect_insert(model):
    """Return an INSERT statement with ON CONFLICT support for the active DB."""
    if db.session.get_bind().dialect.name == "sqlite":
        return sqlite_insert(model)
    return pg_insert(model)


def get_current_user():
    """The person making the request.

    When login is added, replace this with a lookup from the session or token.
    Nothing else needs to change: every saved place and trip is already
    stored against a user.
    """
    user = User.query.filter_by(email=GUEST_EMAIL).first()
    if user:
        return user

    db.session.execute(
        dialect_insert(User)
        .values(email=GUEST_EMAIL, display_name="Guest", created_at=utc_now())
        .on_conflict_do_nothing()
    )
    db.session.commit()
    return User.query.filter_by(email=GUEST_EMAIL).one()


def saved_place_keys(user):
    rows = (
        db.session.query(Destination.place_key)
        .join(SavedPlace, SavedPlace.destination_id == Destination.id)
        .filter(SavedPlace.user_id == user.id)
    )
    return {key for (key,) in rows}


def stored_destination(key):
    return Destination.query.filter_by(place_key=key).first() if key else None


def upsert_destination(place):
    """Insert a Nominatim result, or refresh the stored copy. Returns the row."""
    if not isinstance(place, dict):
        raise InvalidInput("Each place must be an object")

    try:
        lat = float(place["lat"])
        lon = float(place["lon"])
    except (KeyError, TypeError, ValueError):
        raise InvalidInput("Each place needs valid lat and lon") from None

    if not (place.get("osm_id") or place.get("place_id")):
        raise InvalidInput("Each place needs an osm_id or place_id")

    display_name = place.get("display_name") or ""
    name = place.get("name") or display_name.split(",")[0].strip()
    if not name:
        raise InvalidInput("Each place needs a name")

    raw = {k: v for k, v in place.items() if k not in API_ONLY_FIELDS}
    values = {
        "name": name,
        "display_name": display_name or None,
        "lat": lat,
        "lon": lon,
        "raw": raw,
        "updated_at": utc_now(),
    }

    destination_id = db.session.execute(
        dialect_insert(Destination)
        .values(place_key=place_key(place), created_at=utc_now(), **values)
        .on_conflict_do_update(index_elements=["place_key"], set_=values)
        .returning(Destination.id)
    ).scalar_one()

    return db.session.get(Destination, destination_id, populate_existing=True)


def get_or_create_term(text):
    term = normalize_term(text)
    if not term or len(term) > 200:
        raise InvalidInput("query must be 1 to 200 characters")

    db.session.execute(
        dialect_insert(SearchTerm)
        .values(term=term, created_at=utc_now())
        .on_conflict_do_nothing()
    )
    return SearchTerm.query.filter_by(term=term).one()


def link_term_results(term, destinations):
    """Record which destinations a keyword returned, in display order."""
    for rank, destination in enumerate(destinations):
        db.session.execute(
        dialect_insert(SearchTermResult)
            .values(search_term_id=term.id, destination_id=destination.id, rank=rank)
            .on_conflict_do_update(
                index_elements=["search_term_id", "destination_id"],
                set_={"rank": rank},
            )
        )
