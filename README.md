# FRA Atlas — Forest Rights Act Claims Management Platform

A full-stack MERN application for managing Forest Rights Act (FRA) claims across a multi-level government workflow.

## Workflow
```
Claimant → Gram Sabha → FRC Verification → Gram Sabha Decision → SDLC Review → DLC Decision
```

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT (HTTP-only cookies)
- **Frontend**: React (Vite), React Router, Axios, Bootstrap

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

---

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your values in .env
npm run dev       # Development (nodemon)
npm start         # Production
npm run seed      # Seed sample data (optional)
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev       # Development on http://localhost:3000
npm run build     # Production build → dist/
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `PORT` | Backend port (default `8100`) |
| `MONGO_URI` | MongoDB Atlas SRV connection string |
| `JWT_SECRET` | Long random secret string |
| `CLIENT_URL` | Frontend URL for CORS (e.g. `http://localhost:3000`) |

---

## Seed Data (Demo Accounts)

Run `npm run seed` inside `backend/` to populate the database.

| Email | Password | Role |
|---|---|---|
| admin@fra.gov.in | password123 | Admin |
| frc@fra.gov.in | password123 | Officer — FRC |
| gramsabha@fra.gov.in | password123 | Officer — Gram Sabha |
| sdlc@fra.gov.in | password123 | Officer — SDLC |
| dlc@fra.gov.in | password123 | Officer — DLC |
| viewer@fra.gov.in | password123 | Viewer |

---

## Deployment

### Backend (Render / Railway)
1. Set environment variables in the platform dashboard
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Output directory: `dist`
3. Update `vite.config.js` proxy target to your deployed backend URL (or use `VITE_API_URL`)

---

## Project Structure

```
FRA-Project/
├── backend/
│   ├── controllers/      # Route handlers
│   ├── middleware/        # auth, authorize, errorHandler
│   ├── models/            # Mongoose schemas (10 models)
│   ├── routes/            # Express routers
│   ├── utils/             # auditLogger
│   ├── seed.js            # Database seeder
│   └── server.js          # Entry point
└── frontend/
    └── src/
        ├── components/    # Layout, Sidebar
        ├── context/       # AuthContext
        ├── pages/         # 17 pages
        └── services/      # Axios instance
```

## API Routes

| Route | Description |
|---|---|
| `POST /api/auth/register` | Register (requires admin approval) |
| `POST /api/auth/login` | Login |
| `GET /api/claims` | List claims (filtered) |
| `POST /api/claims` | Create claim |
| `POST /api/claims/:id/forward` | Forward to FRC |
| `POST /api/claims/:id/verification` | FRC verification |
| `POST /api/claims/:id/decisions` | Record decision |
| `PATCH /api/users/:id/approve` | Admin: approve user |
