"""Saved places and trips, stored in PostgreSQL per user.

GET    /api/saved-places
POST   /api/saved-places               { place, query?, results? }
DELETE /api/saved-places/<place_key>

GET    /api/trips
POST   /api/trips                      { destination, dates?, accommodation? }
GET    /api/trips/<id>
PATCH  /api/trips/<id>                 { name?, dates?, accommodation? }
DELETE /api/trips/<id>
POST   /api/trips/<id>/items           { date, time?, title }
DELETE /api/trips/<id>/items/<item_id>
"""

from datetime import date, time

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from models import ItineraryItem, SavedPlace, Trip, db
from store import (
    InvalidInput,
    get_current_user,
    get_or_create_term,
    link_term_results,
    stored_destination,
    upsert_destination,
)

MAX_RELATED_RESULTS = 20


def read_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise InvalidInput("Send a JSON object")
    return body


def parse_date(value, field):
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise InvalidInput(f"{field} must be a date like 2026-12-24") from None


def parse_time(value):
    if value in (None, ""):
        return None
    try:
        return time.fromisoformat(value)
    except (TypeError, ValueError):
        raise InvalidInput("time must look like 14:30") from None


def parse_dates(value):
    if value is None:
        return None, None
    if not isinstance(value, dict):
        raise InvalidInput("dates must be an object with start and end")

    start = parse_date(value.get("start"), "dates.start")
    end = parse_date(value.get("end"), "dates.end")
    if start and end and end < start:
        raise InvalidInput("The end date must be on or after the start date")
    return start, end


def parse_text(value, field, max_length, required=False):
    if value is None:
        value = ""
    if not isinstance(value, str):
        raise InvalidInput(f"{field} must be text")

    text = value.strip()
    if required and not text:
        raise InvalidInput(f"{field} is required")
    if len(text) > max_length:
        raise InvalidInput(f"{field} must be at most {max_length} characters")
    return text


def create_user_data_blueprint(on_destination_stored):
    """`on_destination_stored(destination_id)` runs after a place is saved or
    a trip is created, so the app can fetch and store that place's details."""

    bp = Blueprint("user_data", __name__, url_prefix="/api")

    @bp.errorhandler(InvalidInput)
    def invalid_input(error):
        db.session.rollback()
        return jsonify({"error": str(error)}), 400

    @bp.errorhandler(SQLAlchemyError)
    def database_error(error):
        db.session.rollback()
        current_app.logger.exception("Database request failed")
        return jsonify({"error": "Saved data is unavailable right now"}), 503

    def user_trip_or_404(trip_id):
        trip = Trip.query.filter_by(id=trip_id, user_id=get_current_user().id).first()
        if trip is None:
            return None, (jsonify({"error": "Trip not found"}), 404)
        return trip, None

    # ---- Saved places --------------------------------------------------

    @bp.get("/saved-places")
    def list_saved_places():
        saved = (
            SavedPlace.query.filter_by(user_id=get_current_user().id)
            .order_by(SavedPlace.created_at.desc())
            .all()
        )
        return jsonify([s.to_dict() for s in saved])

    @bp.post("/saved-places")
    def save_place():
        body = read_body()
        user = get_current_user()

        results = body.get("results") or []
        if not isinstance(results, list):
            raise InvalidInput("results must be a list")
        results = results[:MAX_RELATED_RESULTS]

        destination = upsert_destination(body.get("place"))
        result_destinations = [upsert_destination(r) for r in results]
        if destination.id not in {d.id for d in result_destinations}:
            result_destinations.insert(0, destination)

        query = parse_text(body.get("query"), "query", 200)
        term = get_or_create_term(query) if query else None
        if term:
            link_term_results(term, result_destinations)

        saved = SavedPlace.query.filter_by(
            user_id=user.id, destination_id=destination.id
        ).first()
        created = saved is None
        if created:
            saved = SavedPlace(user_id=user.id, destination_id=destination.id)
            db.session.add(saved)
        if term and saved.search_term_id is None:
            saved.search_term_id = term.id

        for related in result_destinations:
            if related.id != destination.id and related not in saved.related:
                saved.related.append(related)

        db.session.commit()
        on_destination_stored(destination.id)
        return jsonify(saved.to_dict()), 201 if created else 200

    @bp.delete("/saved-places/<path:key>")
    def unsave_place(key):
        destination = stored_destination(key)
        saved = (
            SavedPlace.query.filter_by(
                user_id=get_current_user().id, destination_id=destination.id
            ).first()
            if destination
            else None
        )
        if saved is None:
            return jsonify({"error": "This place is not saved"}), 404

        # The destination itself stays: it is shared data that searches,
        # trips and other people's saved places can still use.
        db.session.delete(saved)
        db.session.commit()
        return "", 204

    # ---- Trips ---------------------------------------------------------

    @bp.get("/trips")
    def list_trips():
        trips = (
            Trip.query.filter_by(user_id=get_current_user().id)
            .order_by(Trip.created_at.desc())
            .all()
        )
        return jsonify([t.to_dict() for t in trips])

    @bp.post("/trips")
    def create_trip():
        body = read_body()
        user = get_current_user()
        destination = upsert_destination(body.get("destination"))

        # One trip per place per person: return the existing one.
        existing = Trip.query.filter_by(
            user_id=user.id, destination_id=destination.id
        ).first()
        if existing:
            db.session.commit()
            return jsonify(existing.to_dict()), 200

        start, end = parse_dates(body.get("dates"))
        trip = Trip(
            user_id=user.id,
            destination_id=destination.id,
            name=destination.name,
            start_date=start,
            end_date=end,
            accommodation=parse_text(body.get("accommodation"), "accommodation", 255),
        )
        db.session.add(trip)
        db.session.commit()
        on_destination_stored(destination.id)
        return jsonify(trip.to_dict()), 201

    @bp.get("/trips/<int:trip_id>")
    def get_trip(trip_id):
        trip, error = user_trip_or_404(trip_id)
        return error or jsonify(trip.to_dict())

    @bp.patch("/trips/<int:trip_id>")
    def update_trip(trip_id):
        trip, error = user_trip_or_404(trip_id)
        if error:
            return error
        body = read_body()

        if "name" in body:
            trip.name = parse_text(body["name"], "name", 200, required=True)
        if "accommodation" in body:
            trip.accommodation = parse_text(body["accommodation"], "accommodation", 255)
        if "dates" in body:
            trip.start_date, trip.end_date = parse_dates(body["dates"])

        db.session.commit()
        return jsonify(trip.to_dict())

    @bp.delete("/trips/<int:trip_id>")
    def delete_trip(trip_id):
        trip, error = user_trip_or_404(trip_id)
        if error:
            return error
        db.session.delete(trip)
        db.session.commit()
        return "", 204

    @bp.post("/trips/<int:trip_id>/items")
    def add_itinerary_item(trip_id):
        trip, error = user_trip_or_404(trip_id)
        if error:
            return error
        body = read_body()

        item_date = parse_date(body.get("date"), "date")
        if item_date is None:
            raise InvalidInput("date is required")

        trip.items.append(
            ItineraryItem(
                item_date=item_date,
                item_time=parse_time(body.get("time")),
                title=parse_text(body.get("title"), "title", 255, required=True),
            )
        )
        db.session.commit()
        return jsonify(trip.to_dict()), 201

    @bp.delete("/trips/<int:trip_id>/items/<int:item_id>")
    def remove_itinerary_item(trip_id, item_id):
        trip, error = user_trip_or_404(trip_id)
        if error:
            return error

        item = next((i for i in trip.items if i.id == item_id), None)
        if item is None:
            return jsonify({"error": "Itinerary item not found"}), 404

        trip.items.remove(item)
        db.session.commit()
        return jsonify(trip.to_dict())

    return bp
