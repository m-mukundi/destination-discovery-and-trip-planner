# Backend

Flask API for destination search, details, saved places and trips.

- **PostgreSQL** stores users, saved places, trips and the destinations they refer to (with each destination's overview and nearby places).
- **SQLite** (`cache.db`, created automatically) caches responses from the public APIs.
- Weather is always fetched live.

## Setup

1. Install the dependencies in a virtual environment:

   ```sh
   python -m venv venv
   # macOS/Linux: source venv/bin/activate    Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Run the API on http://127.0.0.1:5001 (the Vite dev server forwards `/api` to it):

   ```sh
   python app.py
   ```

   With no configuration, the API creates `trip_planner.db` locally and is
   ready to use. To use PostgreSQL instead, copy `.env.example` to `.env`, set
   `DATABASE_URL`, and apply the migrations with `flask --app app db upgrade`.

## Changing the database

Edit the models in `models.py`, then create and apply a migration:

```sh
flask --app app db migrate -m "Describe the change"
flask --app app db upgrade
```

## Accounts

There is no login yet. Every saved place and trip belongs to a user, and for now that is always one guest user. To add accounts, change `get_current_user()` in `store.py` to look the user up from the session or token.
