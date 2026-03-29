# Drug Interaction Checker API

An AI-powered REST API that analyzes potential drug-drug interactions using Google Gemini. Submit two drug names and receive a structured clinical analysis covering severity, mechanism, side effects, risks, poisoning potential, and recommendations.

---

## Prerequisites

- Python 3.11+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

## Installation

```bash
# 1. Clone / navigate to the project directory
cd drug-interaction-checker

# 2. (Recommended) Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Configuration

```bash
cp .env.example .env
```

Open `.env` and set your values:

```env
GEMINI_API_KEY=your_gemini_api_key_here   # required
JWT_SECRET=change_this_to_a_long_random_string
DATABASE_URL=sqlite+aiosqlite:///./drug_checker.db
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

The app will refuse to start if `GEMINI_API_KEY` or `JWT_SECRET` are missing.

---

## Running the server

```bash
uvicorn app.main:app --reload
```

The API is now available at **http://127.0.0.1:8000**.

---

## API Documentation

FastAPI auto-generates interactive documentation:

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/docs | Swagger UI — try every endpoint in the browser |
| http://127.0.0.1:8000/redoc | ReDoc — clean read-only reference |

---

## Endpoint Reference

### Health check

```bash
curl http://localhost:8000/health
# {"status":"healthy"}
```

---

### Register

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123","name":"Alice"}'
```

Response (201):
```json
{"id":1,"email":"alice@example.com","name":"Alice","created_at":"..."}
```

---

### Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

Response (200):
```json
{"access_token":"eyJ...","token_type":"bearer"}
```

Save the token — every protected endpoint requires it:
```bash
TOKEN="eyJ..."
```

---

### Current user

```bash
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### Check drug interaction

```bash
curl -X POST http://localhost:8000/api/v1/check-interaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drug_1":"Aspirin","drug_2":"Warfarin"}'
```

Response (200):
```json
{
  "success": true,
  "data": {
    "drug_1": "Aspirin",
    "drug_2": "Warfarin",
    "interaction_found": true,
    "severity": "severe",
    "summary": "...",
    "mechanism": "...",
    "side_effects": ["Bleeding", "..."],
    "risks": ["Major hemorrhage", "..."],
    "poisoning_risk": {
      "exists": true,
      "description": "..."
    },
    "recommendations": ["Avoid concurrent use", "..."],
    "disclaimer": "This is AI-generated information for educational purposes only..."
  },
  "timestamp": "2026-03-29T12:00:00Z"
}
```

Rate limit: **10 requests per minute per user**. Exceeding it returns HTTP 429.

To link a check to a patient, include `patient_id`:

```bash
curl -X POST http://localhost:8000/api/v1/check-interaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"drug_1":"Aspirin","drug_2":"Warfarin","patient_id":1}'
```

---

### Query history (last 10)

```bash
curl http://localhost:8000/api/v1/history \
  -H "Authorization: Bearer $TOKEN"
```

---

## Patient Management

Every authenticated user is a **doctor**. Each doctor manages their own isolated set of patients — no doctor can see or modify another doctor's data.

### Add a patient

```bash
curl -X POST http://localhost:8000/api/v1/patients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "age": 52,
    "status": "Under Treatment",
    "phone": "555-9876",
    "address": "456 Elm St",
    "clinical_notes": "Type 2 diabetes, hypertension"
  }'
```

Status must be one of: `"Stable"`, `"Under Treatment"`, `"Critical"`.

### List patients

```bash
curl "http://localhost:8000/api/v1/patients?skip=0&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Search patients

Searches across `full_name`, `phone`, and `status` (case-insensitive, OR logic):

```bash
# Returns patients whose name contains "jane", phone contains "jane", or status contains "jane"
curl "http://localhost:8000/api/v1/patients/search?q=jane" \
  -H "Authorization: Bearer $TOKEN"

# Returns all patients with status "Critical"
curl "http://localhost:8000/api/v1/patients/search?q=critical" \
  -H "Authorization: Bearer $TOKEN"
```

### Get a single patient

```bash
curl http://localhost:8000/api/v1/patients/1 \
  -H "Authorization: Bearer $TOKEN"
```

Returns 404 if the patient does not exist or belongs to a different doctor.

### Update a patient (partial)

```bash
curl -X PUT http://localhost:8000/api/v1/patients/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Critical", "clinical_notes": "Admitted to ICU"}'
```

Only fields included in the request body are updated.

### Delete a patient

```bash
curl -X DELETE http://localhost:8000/api/v1/patients/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Get interaction history for a patient

```bash
curl http://localhost:8000/api/v1/patients/1/interactions \
  -H "Authorization: Bearer $TOKEN"
```

Returns all drug-interaction checks that were linked to this patient.

---

## Data Isolation Model

- Each `User` (doctor) can only access patients they created (`doctor_id = current_user.id`).
- Every patient query is filtered by `doctor_id` — cross-doctor access returns **404**, not 403, to avoid revealing whether a patient exists.
- Interaction history linked to a patient is only visible to that patient's doctor.
- The same isolation applies to searching, updating, and deleting.

---

## Switching from SQLite to PostgreSQL

1. Install the async PostgreSQL driver:
   ```bash
   pip install asyncpg
   ```

2. Update `DATABASE_URL` in `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/drug_checker
   ```

3. Restart the server — tables are created automatically on startup via `metadata.create_all`.

No other code changes are required.

---

## Running tests

```bash
pip install pytest pytest-asyncio anyio httpx
pytest tests/ -v
```

---

## Project structure

```
drug-interaction-checker/
├── app/
│   ├── main.py          # FastAPI app, global error handlers, startup/shutdown
│   ├── config.py        # Settings (pydantic-settings, reads .env)
│   ├── api/
│   │   ├── router.py    # POST /api/v1/check-interaction, GET /api/v1/history
│   │   ├── schemas.py   # Request / response Pydantic models
│   │   └── dependencies.py  # get_current_user, rate_limit_check
│   ├── auth/
│   │   ├── models.py    # User + QueryHistory SQLAlchemy models
│   │   ├── schemas.py   # Auth Pydantic models
│   │   ├── router.py    # /auth/register, /auth/login, /auth/me
│   │   ├── service.py   # Registration, authentication, password hashing
│   │   └── jwt_handler.py  # JWT create / decode
│   ├── gemini/
│   │   ├── client.py    # Async Gemini wrapper, GeminiServiceError
│   │   └── prompts.py   # Prompt template
│   ├── database/
│   │   ├── base.py      # SQLAlchemy DeclarativeBase
│   │   └── session.py   # Async engine + session factory
│   └── middleware/
│       └── rate_limiter.py  # In-memory token-bucket limiter
└── tests/
    ├── test_auth.py
    └── test_interactions.py
```

---

## CORS

By default CORS is open (`allow_origins=["*"]`). In production, restrict it in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.example.com"],
    ...
)
```

---

## Disclaimer

> **This application uses AI-generated content for educational purposes only.**
> Drug interaction information provided by this API should never replace professional
> medical advice, diagnosis, or treatment. Always consult a qualified healthcare
> provider before making any medication decisions.
