# TalentBridge - Job Portal

A full-stack job portal connecting HR professionals with job candidates. Built with React, Node.js, PostgreSQL, Redis, and Docker.

## Features

### Candidate
- **Profile Builder** — multi-step form: basic info, skills (with typeahead autocomplete from 90+ skill taxonomy), experience, education, preferences
- **Resume Upload** — PDF only, max 5MB, stored on server
- **Profile Completion Nudge** — banner appears on every page if profile < 60% complete
- **Job Discovery & Search** — paginated list of open jobs with live filters (skills, location, job type, experience range, salary range, date posted), full-text search on title + description
- **Job Recommendations** — "Recommended for You" section on dashboard, scored and cached in Redis (1hr TTL)
- **Job Application** — one-click apply with optional questionnaire (TEXT, NUMBER, DATE, BOOLEAN, SELECT types), validated and submitted atomically
- **Application Tracker** — view all applied jobs with color-coded status badges (Applied, Shortlisted, Interview, Offer, Rejected), withdraw applications to re-apply later
- **Save/Bookmark Jobs** — save jobs for later review

### HR / Recruiter
- **Job Posting** — multi-step form: details (title, description, location, type, experience range, salary range, deadline) → skills (with required toggle and weight slider 1-10) → questionnaire builder (add/remove/reorder questions) → review & publish/draft
- **Job Management** — edit, close, pause, reopen, duplicate, and delete jobs
- **Candidate Search** — all candidates shown by default, filter by skills, location, experience, notice period, CTC; results scored with match percentage
- **Smart Skill Suggestions** — search bar expands queries using skill aliases and categories from pre-seeded taxonomy
- **Candidate Scoring** — 0-90 match score displayed as colored ring on every candidate card
- **Kanban Pipeline** — drag-and-drop columns (Applied → Shortlisted → Interview → Offer → Rejected), status change auto-triggers email to candidate
- **Resume Viewer** — HR can view candidate's resume PDF in a modal directly from pipeline or search results
- **Internal Notes** — add private notes on candidate applications (not visible to candidate)
- **Bulk Email** — select multiple candidates, compose email with merge fields (`{{candidate_name}}`, `{{job_title}}`, `{{company_name}}`), send via Nodemailer
- **Outreach History** — view all sent emails with recipient details
- **Analytics Dashboard** — overview metrics (total jobs, applications, avg match score, interviews, offers), per-job pipeline breakdown, top skills in demand bar chart

### Platform
- **JWT Authentication** — access token (15min) + refresh token (7-day, httpOnly cookie), silent re-auth
- **Role-Based Access Control** — HR and Candidate roles enforced at middleware level
- **Password Strength Validation** — min 8 chars, 1 uppercase, 1 number, 1 special char
- **Show/Hide Password** — eye icon toggle on login and register forms
- **Proper Error Handling** — inline error banners for auth failures, field-specific Zod validation errors on profile update
- **Rate Limiting** — 10 requests per 15 minutes on auth endpoints
- **Job Expiry Cron** — daily cron auto-closes jobs past their deadline
- **Duplicate Application Prevention** — backend guard + frontend disable
- **Health Check** — `GET /api/health` returns service + DB status
- **Seed Data** — 92 skills with aliases, 1 HR user, 5 candidate users with profiles and skills, 3 sample jobs with questionnaires, 2 sample applications
- **Currency** — all salary values displayed in ₹ (INR) format

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Zustand, React Hook Form, Recharts, react-hot-toast |
| Backend | Node.js, Express.js, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Nodemailer (Mailtrap for dev) |
| File Upload | Multer (PDF, max 5MB) |
| Drag & Drop | @hello-pangea/dnd |
| Validation | Zod (backend), React Hook Form (frontend) |
| Cron | node-cron |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx |

## Quick Start

### Option 1: Docker Compose (recommended)

**Prerequisites:** Docker and Docker Compose installed

```bash
# Clone the repository
git clone https://github.com/SamarthaKhare/TalentBridge.git
cd TalentBridge

# Copy environment file
cp .env.example .env

# Start all services (postgres, redis, backend, frontend, nginx)
docker compose up --build

# Seed the database (in a new terminal)
docker compose exec backend npx prisma db seed
```

The app will be available at:
- **App**: http://localhost (via Nginx)
- **Frontend (direct)**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Option 2: Local Development (without Docker)

**Prerequisites:**
- Node.js 20+
- PostgreSQL 15 (running on port 5432)
- Redis 7 (running on port 6379)

On macOS you can install these with Homebrew:
```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**Setup & Run:**

```bash
# Clone the repository
git clone https://github.com/SamarthaKhare/TalentBridge.git
cd TalentBridge

# Create the database
createdb talentbridge

# Backend setup
cd backend
npm install
cp ../.env.example .env
# Edit .env — update DATABASE_URL to: postgresql://YOUR_USER@localhost:5432/talentbridge
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# Backend runs on http://localhost:5000

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000 (proxies /api and /uploads to backend)
```

> **Note (macOS):** Port 5000 may be used by AirPlay Receiver. If so, set `PORT=5001` in `backend/.env` and update the proxy target in `frontend/vite.config.ts` from `5000` to `5001`.

## Test Credentials (Seeded)

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| HR | hr@talentbridge.com | HR@Talent2024 | Sarah Johnson, Senior HR Manager at TechCorp Solutions |
| Candidate | alice@example.com | Alice@1234 | Alice Chen, Full Stack Developer, 4 yrs exp, San Francisco |
| Candidate | bob@example.com | Bob@1234 | Bob Martinez, Backend Engineer (Java), 6 yrs exp, Austin |
| Candidate | carol@example.com | Carol@1234 | Carol Williams, Frontend Developer (Vue/React), 3 yrs exp, London |
| Candidate | david@example.com | David@1234 | David Kim, Data Engineer (Python/ML), 5 yrs exp, Seoul |
| Candidate | emma@example.com | Emma@1234 | Emma Davis, DevOps Engineer (AWS/K8s), 7 yrs exp, Berlin |

### Seeded Jobs
- **Senior Full Stack Developer** — Hybrid, San Francisco, $100k-$150k, React/Node.js/TypeScript required
- **Backend Engineer - Java** — Remote, Austin, $110k-$160k, Java/Spring Boot required
- **DevOps Engineer** — Onsite, Berlin, $90k-$140k, AWS/Docker/Kubernetes required

### Seeded Applications
- Alice → Senior Full Stack Developer (Shortlisted, 82% match)
- Bob → Backend Engineer - Java (Interview, 91% match)

## Scoring Algorithm

Candidate match score ranges from **0 to 90** (never 100) and is calculated as:

### Skills (70 points)
- **Required skills (50 pts):** `(matched required skills / total required skills) × 50`
- **Optional skills (20 pts):** `(matched optional skills / total optional skills) × 20`
- If no skills are marked as "required", all job skills share the full 70 points equally

### Experience (30 points)
- **Within range:** full 30 points
- **Overqualified:** gradual reduction (min 15 points)
- **Under-experienced:** proportional credit based on `candidateExperience / requiredMin`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | - | Register (email, password, name, role) |
| POST | /api/auth/login | - | Login (returns access token + sets refresh cookie) |
| POST | /api/auth/refresh | - | Refresh access token via httpOnly cookie |
| POST | /api/auth/logout | Yes | Logout (blacklists tokens via Redis) |
| GET | /api/profile/candidate | Candidate | Get candidate profile with skills |
| PUT | /api/profile/candidate | Candidate | Update profile + skills |
| POST | /api/profile/resume | Candidate | Upload resume (PDF, max 5MB) |
| GET | /api/jobs | - | List open jobs (paginated) |
| GET | /api/jobs/:id | - | Job detail with skills + questionnaire |
| POST | /api/jobs | HR | Create job with skills + questionnaire |
| PUT | /api/jobs/:id | HR | Update job (including status: DRAFT/OPEN/CLOSED/PAUSED) |
| DELETE | /api/jobs/:id | HR | Delete job |
| POST | /api/jobs/:id/duplicate | HR | Duplicate job as draft |
| POST | /api/applications | Candidate | Apply to job (with questionnaire answers) |
| GET | /api/applications/mine | Candidate | List my applications |
| DELETE | /api/applications/:id | Candidate | Withdraw (deletes application, allows re-apply) |
| GET | /api/applications/job/:jobId | HR | List applications for a job |
| PUT | /api/applications/:id/status | HR | Update application status |
| POST | /api/applications/:id/notes | HR | Add internal note |
| GET | /api/applications/saved-jobs | Candidate | List saved/bookmarked jobs |
| POST | /api/applications/saved-jobs/:jobId | Candidate | Toggle save/unsave job |
| GET | /api/search/jobs | - | Search jobs with filters |
| GET | /api/search/candidates | HR | Search candidates with filters + scoring |
| GET | /api/search/skills/suggest?q= | - | Skill autocomplete with alias expansion |
| GET | /api/recommendations/jobs | Candidate | Personalized job recommendations |
| POST | /api/outreach/send | HR | Send bulk email to candidates |
| GET | /api/outreach/history | HR | View sent email history |
| GET | /api/dashboard/hr | HR | HR analytics dashboard data |
| GET | /api/dashboard/candidate | Candidate | Candidate dashboard data |
| GET | /api/health | - | Health check (DB connectivity) |

## Project Structure

```
TalentBridge/
├── docker-compose.yml          # PostgreSQL, Redis, Backend, Frontend, Nginx
├── .env.example                # Environment variables template
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       # 14 tables with relations
│   │   └── seed.ts             # 92 skills, 6 users, 3 jobs, 2 applications
│   └── src/
│       ├── index.ts            # Express app entry + cron jobs + route wiring
│       ├── config/             # DB (Prisma), Redis, env config
│       ├── middleware/         # JWT auth + RBAC, rate limiter, file upload, error handler
│       ├── modules/
│       │   ├── auth/           # Register, login, refresh, logout
│       │   ├── jobs/           # CRUD, duplicate, status management
│       │   ├── applications/   # Apply, withdraw, status, notes, saved jobs
│       │   ├── candidates/     # Profile CRUD, resume upload
│       │   ├── search/         # Job search, candidate search, skill suggestions
│       │   ├── outreach/       # Bulk email send, history
│       │   └── dashboard/      # HR analytics, candidate dashboard
│       ├── services/
│       │   ├── email.service.ts          # Nodemailer transporter + bulk send
│       │   ├── scoring.service.ts        # Match score algorithm (0-90)
│       │   └── recommendation.service.ts # Redis-cached job recommendations
│       └── utils/
│           ├── validators.ts   # Zod schemas for all endpoints
│           └── helpers.ts      # Profile completion calculator
├── frontend/
│   ├── Dockerfile              # Multi-stage build (Vite → Nginx)
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Layout with Navbar + Toaster
│       ├── router/             # React Router (auth, candidate, HR routes)
│       ├── store/authStore.ts  # Zustand (login, register, logout, token persist)
│       ├── api/
│       │   ├── client.ts       # Axios with token interceptor + silent refresh
│       │   └── queries.ts      # All API endpoint wrappers
│       ├── components/
│       │   ├── ui/             # Button, Input (forwardRef), Badge, Modal, ScoreRing
│       │   └── layout/         # Navbar, ProfileCompletionBanner
│       └── pages/
│           ├── auth/           # LoginPage, RegisterPage (with show/hide password)
│           ├── candidate/      # Dashboard, JobSearch, JobDetail, Applications, SavedJobs, Profile
│           └── hr/             # Dashboard, JobList, JobPost, Pipeline (Kanban), CandidateSearch, Outreach
└── nginx/
    ├── Dockerfile
    └── nginx.conf              # Reverse proxy: / → frontend, /api → backend, /uploads → backend
```

## Environment Variables

See `.env.example` for all variables. Key ones:

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:password@postgres:5432/talentbridge |
| REDIS_URL | Redis connection string | redis://redis:6379 |
| JWT_SECRET | Secret for access tokens | (change in production) |
| JWT_REFRESH_SECRET | Secret for refresh tokens | (change in production) |
| SMTP_HOST/PORT/USER/PASS | SMTP config (Mailtrap for dev) | smtp.mailtrap.io |
| PORT | Backend port | 5000 |

### Email Configuration

Email features (application confirmation, status change notifications, bulk outreach) require valid SMTP credentials. The default `.env.example` uses placeholder values that **will not send real emails**.

**For development (sandbox — no real delivery):**
Sign up at [Mailtrap](https://mailtrap.io), create an inbox, and copy the credentials:
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<your_mailtrap_user>
SMTP_PASS=<your_mailtrap_pass>
EMAIL_FROM=noreply@talentbridge.com
```

**For real email delivery (Gmail):**
Generate a [Gmail App Password](https://myaccount.google.com/apppasswords) and use:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=<your_app_password>
EMAIL_FROM=your_gmail@gmail.com
```

> Without valid SMTP credentials, the app works fully — emails will silently fail and log errors to the console, but all other functionality is unaffected.
