import os
from flask import Flask, jsonify, request
from supabase import create_client, Client
from postgrest import APIError
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
)

@app.route('/')
def index():
    try:
        response = supabase.table('users').select("*").execute()
    except APIError as error:
        return f'<p>Error loading users: {error.message}</p>'

    users = response.data

    html = '<h1>users</h1><ul>'
    for user in users:
        html += f'<li>{user["email"]}</li>'
    html += '</ul>'

    return html


@app.get('/healthz')
def health_check():
    return jsonify({"status": "ok"})


@app.get('/api/events')
def list_events():
    try:
        response = supabase.table('events').select('*').execute()
    except APIError:
        return jsonify({"error": "Database request failed"}), 500

    return jsonify(response.data)


@app.get('/api/events/<event_id>')
def get_event(event_id):
    try:
        response = supabase.table('events').select('*').eq('id', event_id).execute()
    except APIError:
        return jsonify({"error": "Database request failed"}), 500

    if not response.data:
        return jsonify({"error": "Event not found"}), 404
    return jsonify(response.data[0])


@app.post('/api/registrations')
def create_registration():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get('user_id')
    event_id = payload.get('event_id')
    if not user_id or not event_id:
        return jsonify({"error": "user_id and event_id are required"}), 400

    try:
        event_response = (
            supabase.table('events')
            .select('id, capacity')
            .eq('id', event_id)
            .execute()
        )
        if not event_response.data:
            return jsonify({"error": "Event not found"}), 404

        duplicate_response = (
            supabase.table('registrations')
            .select('id')
            .eq('user_id', user_id)
            .eq('event_id', event_id)
            .execute()
        )
        if duplicate_response.data:
            return jsonify({"error": "User is already registered for this event"}), 409

        capacity = event_response.data[0].get('capacity')
        if capacity is not None:
            registrations_response = (
                supabase.table('registrations')
                .select('id')
                .eq('event_id', event_id)
                .execute()
            )
            if len(registrations_response.data) >= capacity:
                return jsonify({"error": "Event is at capacity"}), 409

        registration_response = (
            supabase.table('registrations')
            .insert({"user_id": user_id, "event_id": event_id})
            .execute()
        )
    except APIError as error:
        if getattr(error, 'code', None) == '23505':
            return jsonify({"error": "User is already registered for this event"}), 409
        return jsonify({"error": "Database request failed"}), 500

    registration = registration_response.data[0] if registration_response.data else {}
    return jsonify(registration), 201


@app.get('/api/me/registrations')
def list_user_registrations():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400

    try:
        response = (
            supabase.table('registrations')
            .select('*')
            .eq('user_id', user_id)
            .execute()
        )
    except APIError:
        return jsonify({"error": "Database request failed"}), 500

    return jsonify(response.data)


@app.get('/api/events/<event_id>/registrations')
def list_event_registrations(event_id):
    try:
        event_response = supabase.table('events').select('id').eq('id', event_id).execute()
        if not event_response.data:
            return jsonify({"error": "Event not found"}), 404

        response = (
            supabase.table('registrations')
            .select('*')
            .eq('event_id', event_id)
            .execute()
        )
    except APIError:
        return jsonify({"error": "Database request failed"}), 500

    return jsonify(response.data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', '10000')), debug=False)