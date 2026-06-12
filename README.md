# Crime Hotspot Mapping and Crime Analytics Dashboard

An interactive MERN stack web application for Chennai Police officers to monitor crime hotspots, analyze trends, and submit crime reports in real time.

## Features

- **JWT Authentication** — Login, Signup, protected routes (Admin & Officer roles)
- **Interactive Chennai Map** — OpenStreetMap with heatmap, clustering, circle hotspot markers, zoom/pan/fullscreen
- **Crime Data Entry** — Officers can submit new crime reports with validation
- **Analytics Dashboard** — Stat cards, 6 chart types, area ranking table
- **Global Filters** — Crime type, date/time range, severity, location — updates map + charts instantly
- **Auto Seed** — 220+ synthetic Chennai crime records seeded automatically on first run

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, React Router, Axios, React Leaflet, Leaflet Heat, Chart.js |
| Backend | Node.js, Express (MVC) |
| Database | MongoDB, Mongoose |

## Project Structure

```
CCP/
├── backend/
│   ├── controllers/     # Auth & Crime business logic
│   ├── database/        # MongoDB connection
│   ├── middleware/      # JWT auth, validation
│   ├── models/          # User & Crime schemas
│   ├── routes/          # API routes
│   ├── seed/            # Seed scripts
│   └── server.js
├── frontend/
│   └── src/
│       ├── charts/      # Chart.js components
│       ├── components/  # Shared UI components
│       ├── hooks/       # Auth & dashboard data hooks
│       ├── map/         # Leaflet map component
│       ├── pages/       # Login, Signup, Dashboard, Add Crime
│       └── services/    # Axios API layer
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port 27017

## Setup & Run

### 1. Clone / Open Project

```bash
cd "d:\FINAL YEAR PROJECT\CCP"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy environment file (already included as `.env`):

```bash
# .env contents
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/crime_hotspot_db
JWT_SECRET=crime_hotspot_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
```

**Seed database manually (optional — auto-seeds on server start if empty):**

```bash
npm run seed
```

**Start backend:**

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@chennaipolice.gov.in | admin123 |
| Officer | officer@chennaipolice.gov.in | officer123 |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register new user |
| POST | `/auth/login` | No | Login & get JWT |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/crime/add` | Yes | Add crime report |
| GET | `/crime` | Yes | Get all crimes |
| GET | `/crime/filter` | Yes | Get filtered crimes |
| GET | `/crime/hotspots` | Yes | Get aggregated hotspots |
| GET | `/crime/analytics` | Yes | Get analytics & chart data (alias) |
| GET | `/analytics` | Yes | Get analytics & chart data |

### Filter Query Parameters

All filter/analytics/hotspot endpoints accept:

- `crimeType`, `location`, `severity`
- `dateFrom`, `dateTo` (YYYY-MM-DD)
- `timeFrom`, `timeTo` (HH:MM)

## Hotspot Color Legend

| Crime Count | Color |
|-------------|-------|
| 0–5 | Green |
| 6–15 | Yellow |
| 16–30 | Orange |
| 31+ | Red |

## Chennai Locations (Seed Data)

T Nagar, Velachery, Anna Nagar, Tambaram, Adyar, Porur, Guindy, Kodambakkam, Perambur, Royapuram, Mylapore, Ambattur, Sholinganallur, OMR, Egmore

**Crime distribution:** High — T Nagar, Velachery | Medium — Anna Nagar, Tambaram | Low — Adyar, Mylapore

## Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## License

Built for academic / final year project use.
