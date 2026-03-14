# TalentBridge - Job Portal

A full-stack job portal connecting HR professionals with job candidates. Built with React, Node.js, PostgreSQL, Redis, and Docker.

## Features

### Candidate
- Multi-step profile builder with skills taxonomy and resume upload
- Job search with filters (skills, location, type, experience, salary, date)
- Job recommendations with match scoring (0-100)
- One-click application with questionnaire support
- Application tracker with status badges
- Save/bookmark jobs

### HR / Recruiter
- Multi-step job posting with rich description, skills with weights, and questionnaire builder
- Candidate search with smart skill expansion and scoring algorithm
- Kanban pipeline (drag-and-drop) for application management
- Bulk email composer with merge fields
- Analytics dashboard with charts
- Internal notes on candidates

### Platform
- JWT authentication (access + refresh tokens) with role-based access control
- Rate limiting on auth endpoints
- Job expiry cron job (auto-closes past deadline)
- Profile completion nudge for candidates (<60%)
- Duplicate application prevention
- Health check endpoint
- Seed data with 90+ skills, test users, and sample jobs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Zustand, React Hook Form, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Nodemailer (Mailtrap for dev) |
| File Upload | Multer (PDF, max 5MB) |
| Drag & Drop | @hello-pangea/dnd |
| Validation | Zod (backend), React Hook Form (frontend) |
| Containerization | Docker + Docker Compose |

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Run
```bash
# Clone the repository
git clone https://github.com/SamarthaKhare/TalentBridge.git
cd TalentBridge

# Copy environment file
cp .env.example .env

# Start all services
docker compose up --build
```

The app will be available at:
- **Frontend**: http://localhost (via Nginx) or http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Seed the Database
```bash
docker compose exec backend npx prisma db seed
```

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| HR | hr@talentbridge.com | HR@Talent2024 |
| Candidate | alice@example.com | Alice@1234 |
| Candidate | bob@example.com | Bob@1234 |
| Candidate | carol@example.com | Carol@1234 |
| Candidate | david@example.com | David@1234 |
| Candidate | emma@example.com | Emma@1234 |

## Local Development (without Docker)

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | Register |
| POST | /api/auth/login | - | Login |
| POST | /api/auth/refresh | - | Refresh token |
| POST | /api/auth/logout | Yes | Logout |
| GET | /api/profile/candidate | Candidate | Get profile |
| PUT | /api/profile/candidate | Candidate | Update profile |
| POST | /api/profile/resume | Candidate | Upload resume |
| GET | /api/jobs | - | List jobs |
| GET | /api/jobs/:id | - | Job detail |
| POST | /api/jobs | HR | Create job |
| PUT | /api/jobs/:id | HR | Update job |
| DELETE | /api/jobs/:id | HR | Delete job |
| POST | /api/jobs/:id/duplicate | HR | Duplicate job |
| POST | /api/applications | Candidate | Apply |
| GET | /api/applications/mine | Candidate | My applications |
| GET | /api/applications/job/:id | HR | Job applications |
| PUT | /api/applications/:id/status | HR | Update status |
| DELETE | /api/applications/:id | Candidate | Withdraw |
| POST | /api/applications/:id/notes | HR | Add note |
| GET | /api/search/jobs | - | Search jobs |
| GET | /api/search/candidates | HR | Search candidates |
| GET | /api/search/skills/suggest | - | Skill autocomplete |
| GET | /api/recommendations/jobs | Candidate | Job recommendations |
| POST | /api/outreach/send | HR | Send bulk email |
| GET | /api/outreach/history | HR | Email history |
| GET | /api/dashboard/hr | HR | HR dashboard |
| GET | /api/dashboard/candidate | Candidate | Candidate dashboard |
| GET | /api/health | - | Health check |

## Project Structure

```
TalentBridge/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── prisma/          # Schema + seed script
│   └── src/
│       ├── config/      # DB, Redis, env config
│       ├── middleware/   # Auth, rate limiter, upload, error handler
│       ├── modules/     # auth, jobs, applications, candidates, search, outreach, dashboard
│       ├── services/    # Email, scoring, recommendations
│       └── utils/       # Zod validators, helpers
├── frontend/
│   └── src/
│       ├── api/         # Axios client + query functions
│       ├── components/  # UI (Button, Badge, Modal, ScoreRing), layout (Navbar)
│       ├── pages/       # auth/, candidate/, hr/
│       ├── router/      # React Router config
│       └── store/       # Zustand auth store
└── nginx/               # Reverse proxy config
```

## Scoring Algorithm

Candidate match score (0-100) is calculated as:
- **Skill match (60 pts)**: Sum of (weight x proficiency_multiplier) for matched skills / max possible
- **Experience match (20 pts)**: Within range = 20, partially = 10
- **Location match (10 pts)**: Exact = 10, same country = 5
- **Notice period fit (10 pts)**: Within requirement = 10
