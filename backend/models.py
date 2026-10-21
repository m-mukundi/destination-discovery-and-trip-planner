"""PostgreSQL models for destinations, saved places and trips.

Destination data (the Nominatim record, Wikivoyage overview and nearby places)
is shared by everyone and stored once. What belongs to a person (saved places,
trips) points at a user, so accounts can be added without changing the tables.
"""

import re
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import CheckConstraint, Index, JSON, UniqueConstraint

db = SQLAlchemy()


def utc_now():
    return datetime.now(timezone.utc)


def place_key(place):
    """Stable id for a Nominatim result. Matches placeKey() in src/utils/place.js."""
    osm_type = place.get("osm_type") or "x"
    osm_id = place.get("osm_id") or place.get("place_id")
    return f"{osm_type}-{osm_id}"


def normalize_term(text):
    """'  Mombasa  ' and 'mombasa' are the same search."""
    return re.sub(r"\s+", " ", text).strip().casefold()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    display_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)


class Destination(db.Model):
    """A place returned by Nominatim, plus any details fetched for it.

    `overview_fetched_at` / `nearby_fetched_at` are set once the detail has
    been fetched, so a destination with no Wikivoyage page (overview is null)
    is not fetched again.
    """

    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True)
    place_key = db.Column(db.String(100), nullable=False, unique=True)
    name = db.Column(db.Text, nullable=False)
    display_name = db.Column(db.Text)
    lat = db.Column(db.Numeric(9, 6), nullable=False)
    lon = db.Column(db.Numeric(9, 6), nullable=False)
    # SQLAlchemy's portable JSON type works in both the local SQLite database
    # and PostgreSQL (where the production migration uses JSONB).
    raw = db.Column(JSON, nullable=False)  # the full Nominatim result
    overview = db.Column(JSON)
    overview_fetched_at = db.Column(db.DateTime(timezone=True))
    nearby = db.Column(JSON)
    nearby_fetched_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    def to_place(self):
        """The Nominatim-shaped object the frontend works with."""
        return {**self.raw, "place_key": self.place_key}


class SearchTerm(db.Model):
    """A search keyword and the destinations it returned, in order."""

    __tablename__ = "search_terms"

    id = db.Column(db.Integer, primary_key=True)
    term = db.Column(db.String(200), nullable=False, unique=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    results = db.relationship(
        "SearchTermResult",
        order_by="SearchTermResult.rank",
        cascade="all, delete-orphan",
        back_populates="search_term",
    )


class SearchTermResult(db.Model):
    __tablename__ = "search_term_results"

    search_term_id = db.Column(
        db.Integer, db.ForeignKey("search_terms.id", ondelete="CASCADE"), primary_key=True
    )
    destination_id = db.Column(
        db.Integer, db.ForeignKey("destinations.id", ondelete="CASCADE"), primary_key=True
    )
    rank = db.Column(db.Integer, nullable=False)

    search_term = db.relationship("SearchTerm", back_populates="results")
    destination = db.relationship("Destination")


# The other results from the search a place was saved from, e.g. saving
# "Mombasa" links "Mombasa County" here. Related places are not listed as saved.
saved_place_related = db.Table(
    "saved_place_related",
    db.Column(
        "saved_place_id",
        db.Integer,
        db.ForeignKey("saved_places.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    db.Column(
        "destination_id",
        db.Integer,
        db.ForeignKey("destinations.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class SavedPlace(db.Model):
    __tablename__ = "saved_places"
    __table_args__ = (UniqueConstraint("user_id", "destination_id"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    destination_id = db.Column(
        db.Integer, db.ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False
    )
    # The keyword the place was saved from, if any.
    search_term_id = db.Column(
        db.Integer, db.ForeignKey("search_terms.id", ondelete="SET NULL")
    )
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    destination = db.relationship("Destination")
    search_term = db.relationship("SearchTerm")
    related = db.relationship("Destination", secondary=saved_place_related)

    def to_dict(self):
        return {
            "id": self.id,
            "place": self.destination.to_place(),
            "query": self.search_term.term if self.search_term else None,
            "related": [
                {"place_key": d.place_key, "name": d.name} for d in self.related
            ],
            "saved_at": self.created_at.isoformat(),
        }


class Trip(db.Model):
    __tablename__ = "trips"
    __table_args__ = (
        UniqueConstraint("user_id", "destination_id"),
        CheckConstraint(
            "start_date IS NULL OR end_date IS NULL OR end_date >= start_date",
            name="trip_dates_in_order",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    destination_id = db.Column(
        db.Integer, db.ForeignKey("destinations.id"), nullable=False
    )
    name = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    accommodation = db.Column(db.String(255), nullable=False, default="")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    destination = db.relationship("Destination")
    items = db.relationship(
        "ItineraryItem", cascade="all, delete-orphan", back_populates="trip"
    )

    def to_dict(self):
        """Same shape the frontend used when trips lived in localStorage."""
        itinerary = {}
        ordered = sorted(
            self.items,
            key=lambda i: (i.item_date, i.item_time is None, i.item_time, i.id),
        )
        for item in ordered:
            itinerary.setdefault(item.item_date.isoformat(), []).append(item.to_dict())

        return {
            "id": self.id,
            "name": self.name,
            "destinationKey": self.destination.place_key,
            "destination": self.destination.to_place(),
            "dates": {
                "start": self.start_date.isoformat() if self.start_date else None,
                "end": self.end_date.isoformat() if self.end_date else None,
            },
            "accommodation": self.accommodation,
            "itinerary": itinerary,
        }


class ItineraryItem(db.Model):
    __tablename__ = "itinerary_items"
    __table_args__ = (Index("idx_items_trip_date", "trip_id", "item_date", "item_time"),)

    id = db.Column(db.Integer, primary_key=True)
    trip_id = db.Column(
        db.Integer, db.ForeignKey("trips.id", ondelete="CASCADE"), nullable=False
    )
    item_date = db.Column(db.Date, nullable=False)
    item_time = db.Column(db.Time)
    title = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)

    trip = db.relationship("Trip", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "time": self.item_time.strftime("%H:%M") if self.item_time else "",
        }
