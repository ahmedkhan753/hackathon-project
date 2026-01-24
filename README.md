# Neighbourly

A hyper-local marketplace where community members exchange skills, tools, and services—from local tutoring and equipment rental to specialized repair work.

---

## Stage 1: The Neighborhood Pilot — Single Community MVP

This repository implements **Stage 1** of the Neighbourly evolution. The focus is a **single-neighborhood pilot** to validate core listing and booking logic before scaling.

### What Stage 1 Delivers

| Area | Scope |
|------|--------|
| **Core entities** | User (Provider or Seeker), Service Listing, Booking Request |
| **Provider flow** | Register → Log in → Post a service (title, description, category) |
| **Seeker flow** | Register → Log in → Search services → Book a slot |
| **Validations** | A user **cannot book their own service**; no overlapping bookings for the same service slot |
| **Storage** | MySQL (via Docker); REST API for all operations |
| **Frontend** | React app with registration, login, and a placeholder dashboard (ready for Stage 2) |

### What Stage 1 Does *Not* Include (Later Stages)

- Multi-community or multi-tenant support  
- Advanced trust & verification (e.g. ratings, badges)  
- Real-time coordination beyond basic overlap checks  
- Async processing, caching, or production-scale reliability  
- Full dashboard UX (listing views, “my services”, etc.) — UI scaffolding only  

---

## Business Context

In modern urban life, digital connectivity is high but **physical community engagement** is often split across many platforms. Neighbourly aims to centralize it:

- **Providers** offer skills, tools, or services (e.g. tutoring, equipment rental, repairs).  
- **Seekers** discover and book those services in their neighborhood.  
- The system must support **trust**, **scalability**, and **data integrity** as it grows from a single community to many.

Stage 1 establishes the foundation: users, services, and bookings with clear rules and a simple, working API.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy, PyMySQL, JWT (python-jose), bcrypt |
| **Database** | MySQL 8 |
| **Frontend** | React 18, Vite, React Router, Framer Motion, Lucide React, Tailwind (CDN) |
| **Infra** | Docker Compose (backend, frontend, MySQL, Adminer, MinIO) |

---

## Project Structure

```
├── backend/                 # FastAPI app
│   ├── app/
│   │   ├── db/              # DB connection, engine
│   │   ├── models/          # User, Service, Booking
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── routers/         # users, services, bookings
│   │   ├── services/        # Business logic (user, service, booking)
│   │   ├── dependencies.py  # Auth, DB session
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── tests/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # App, routing
│   │   ├── pages/           # AuthPage, Dashboard
│   │   ├── services/        # api, auth (API client)
│   │   └── styles/
│   ├── Dockerfile
│   └── nginx.conf           # Serves built app on port 3000
├── docker-compose.yml       # db, adminer, minio, backend, frontend
├── .env                     # DATABASE_URL, etc. (not committed)
└── README.md
```

---

## Prerequisites

- **Docker** and **Docker Compose**  
- **Node.js 18+** and **npm** (only if running frontend locally)  
- **Python 3.10+** (only if running backend locally)

---

## Getting Started

### 1. Run everything with Docker (recommended)

```bash
# From project root
docker-compose up --build
```

| Service | URL | Purpose |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | React app (login, register, dashboard) |
| **Backend API** | http://localhost:8000 | REST API |
| **API docs (Swagger)** | http://localhost:8000/docs | Interactive API UI |
| **Adminer** | http://localhost:8081 | MySQL admin (user: `user`, pass: `pass`, DB: `neighbourly`) |
| **MinIO** | http://localhost:9001 | Object storage (Stage 2+) |

### 2. Backend only (local Python)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

Set `DATABASE_URL` (e.g. in `.env`) to your MySQL instance. Default:

```text
DATABASE_URL=mysql+pymysql://user:pass@localhost:3307/neighbourly
```

(Use `3307` if MySQL runs via Docker on that port.)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend only (local dev)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on the Vite dev port (e.g. 5173). Ensure `VITE_API_URL` points to your backend (default `http://localhost:8000`).

---

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | MySQL connection string (e.g. `mysql+pymysql://user:pass@db:3306/neighbourly`) |
| `SECRET_KEY` | Backend | JWT signing key (default: `supersecretkey`; set in production) |
| `VITE_API_URL` | Frontend (build) | Backend base URL (default: `http://localhost:8000`) |

`.env` is loaded by the backend and by Docker Compose where configured. Do not commit secrets.

---

## API Overview

### Base URL

- **Docker:** `http://localhost:8000`  
- **Local backend:** `http://localhost:8000` (or your `uvicorn` host/port)

### Authentication

Protected routes use **Bearer token** auth. No API keys or client secrets.

1. **Register:** `POST /register` (JSON: `username`, `name`, `email`, `password`).  
2. **Login:** `POST /login` with `Content-Type: application/x-www-form-urlencoded` and body `username=...&password=...`.  
3. Response includes `access_token`. Send it as:  
   `Authorization: Bearer <access_token>`.

**Swagger (/docs):**

1. Call `POST /login` via “Try it out” with your credentials.  
2. Copy the `access_token` from the response.  
3. Click **Authorize**, paste **only the token** (no `Bearer ` prefix) into **Value**, then **Authorize** → **Close**.  
4. All subsequent requests in Swagger will send the Bearer header.

**cURL example:**

```bash
# Login
curl -X POST "http://localhost:8000/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&password=secret123"

# Use token (replace TOKEN)
curl -X POST "http://localhost:8000/services" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Math tutoring","description":"K-12 math","category":"teaching"}'
```

---

## API Endpoints

### Users (no auth unless noted)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | No | Create account |
| `POST` | `/login` | No | Get JWT `access_token` |
| `GET` | `/me` | Yes | Current user profile |

### Services

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/services` | Yes | Create service (provider) |
| `GET` | `/services` | No | List active services (`?q=`, `?category=`, `?provider_id=`, `?skip=`, `?limit=`) |
| `GET` | `/services/{id}` | No | Get one service |
| `PATCH` | `/services/{id}` | Yes | Update own service |
| `DELETE` | `/services/{id}` | Yes | Delete own service |

### Bookings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/bookings` | Yes | Create booking (seeker); cannot book own service |
| `GET` | `/bookings` | Yes | List own bookings (`?as_seeker=`, `?as_provider=`) |
| `GET` | `/bookings/{id}` | Yes | Get one booking (seeker or provider) |
| `PATCH` | `/bookings/{id}` | Yes | Update status: `cancelled` (seeker/provider), `confirmed` / `completed` (provider only) |

---

## User Flows

### Provider: “I want to offer a service”

1. Register → Log in.  
2. `POST /services` with `title`, `description`, `category`.  
3. Service appears in `GET /services` (and optionally `?provider_id=<your_id>`).  
4. Use `PATCH /bookings/{id}` to confirm or complete bookings from seekers.

### Seeker: “I want to book a service”

1. Register → Log in.  
2. `GET /services` (optionally `?q=...` or `?category=...`).  
3. `POST /bookings` with `service_id`, `slot_start`, `slot_end` (ISO 8601).  
4. You **cannot** book your own service; overlapping slots for the same service are rejected.

---

## Validations and Rules

- **Own-service booking:** A user cannot create a booking for a service they provide.  
- **Overlapping slots:** No two `pending` or `confirmed` bookings for the same service may overlap in time.  
- **Service state:** Only `active` services can be booked.  
- **Booking status:** Only `pending` bookings can be updated to `confirmed`, `completed`, or `cancelled`.  
- **Ownership:** Only the provider can update/delete a service; only seeker or provider can cancel a booking; only the provider can confirm or mark completed.

---

## Frontend (Stage 1)

The React app provides:

- **Registration / Login** — Integrated with `/register` and `/login`; stores JWT in `localStorage`.  
- **Dashboard** — Redirect after login; placeholder for “view listing” and “my services” (Stage 2).  
- **Auth-guarded routes** — Unauthenticated users are redirected to login.

The frontend talks to the backend at `VITE_API_URL` (e.g. `http://localhost:8000` when using Docker).

---

## Database

MySQL stores **users**, **services**, and **bookings**. Tables are created automatically on backend startup via `Base.metadata.create_all(bind=engine)`.

- **Adminer:** http://localhost:8081 — use the same credentials as in `DATABASE_URL` (e.g. `user` / `pass`, database `neighbourly`).

---

## Tests

```bash
cd backend
pytest
```

Requires a running MySQL instance and correct `DATABASE_URL`.

---

## License and Contributing

This project is part of a staged challenge. See the repo root and any CONTRIBUTING file for license and contribution guidelines.

---

## Summary

**Stage 1** delivers a working single-community MVP: user registration and JWT auth, service listings (create, list, search, update, delete), and bookings with “no self-booking” and overlap checks. The API is RESTful, documented via Swagger, and ready for the frontend to implement full listing and booking flows in Stage 2.
