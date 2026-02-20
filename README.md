# IPS Academy Timetable Management System

A production-ready MERN stack web application for managing college timetable scheduling at IPS Academy – Institute of Engineering & Science.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Frontend:** React 18 (Vite), TailwindCSS
- **Auth:** JWT
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod

## Features

- Subjects, Teachers, Classes, Labs CRUD
- Schedule management with conflict detection
- Hard constraint engine (8 mandatory rules)
- Dashboard with stats and charts
- JWT authentication
- Responsive admin panel UI

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Docker)

## Setup

### 1. Clone and install

```bash
cd timetable-ips
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, PORT
npm install
npm run seed   # Optional: seed sample data
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 4. Environment Variables

**Backend `.env`:**
```
MONGODB_URI=mongodb://localhost:27017/timetable_ips
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
NODE_ENV=development
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000
```

If using Vite proxy (default), leave `VITE_API_URL` empty.

### 5. Seed Data

After running `npm run seed` in backend:

- **Login:** admin@ips.academy
- **Password:** admin123

## Docker (Optional)

```bash
# Start MongoDB only
docker-compose up -d mongodb

# Or start backend + MongoDB
docker-compose up -d
```

## API Overview

| Resource  | Endpoints                          | Auth |
|-----------|------------------------------------|------|
| Auth      | POST /api/auth/login, register, GET /me | -    |
| Subjects  | GET, POST, GET/:id, PUT/:id, DELETE/:id | Yes  |
| Teachers  | Same CRUD                          | Yes  |
| Classes   | Same CRUD                          | Yes  |
| Labs      | Same CRUD                          | Yes  |
| Rooms     | Same CRUD                          | Yes  |
| Schedules | Same CRUD + conflict validation    | Yes  |
| Dashboard | GET /api/dashboard/stats           | Yes  |

Pagination: `?page=1&limit=10&search=...`

## Project Structure

```
timetable-ips/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/        # Includes conflictService.js
│   │   ├── middlewares/
│   │   ├── validators/
│   │   └── index.js
│   ├── scripts/
│   │   └── seed.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layout/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Conflict Engine

Schedule creation/update is validated against:

1. No student overlap (same class)
2. No teacher overlap
3. No room overlap
4. Valid time range (09:00–17:00)
5. Valid semester range
6. Lunch break restriction (13:00–14:00)
7. Capacity constraint

## License

MIT
