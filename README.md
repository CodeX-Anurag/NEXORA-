# NEXORA — AI-Powered Student Productivity & Career Intelligence Platform

> **Current Phase:** Phase 5 — AI Foundation Implemented  
> **Status:** AI Coach Integrated (React 19 + Provider-Agnostic LLM Adapter + Bounded Chat Context ↔ Express.js REST APIs ↔ MongoDB Mongoose)  

---

## 1. Project Overview & Vision

**NEXORA** is a full-stack, AI-powered student productivity and career intelligence platform designed to bridge the gap between daily academic habits and long-term career readiness.

---

## 2. Final Technology Stack

| Layer | Technology Choice | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 6 | Fast, modern single-page student user experience |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive design system |
| **Backend Runtime** | Node.js + Express.js | Unified JavaScript API & business logic server |
| **Database** | MongoDB + Mongoose | Document storage for tasks, study sessions, conversations & messages |
| **Authentication** | JWT + httpOnly Refresh Cookies | Short-lived JWTs with server-side session rotation & reuse detection |
| **AI Integration** | Hosted Pre-trained LLM (Provider Adapter) | Provider-agnostic adapter (`LLMClient`) supporting OpenAI & Mock providers |
| **Testing** | Jest + Supertest + RTL + Vitest | Unit, API integration, UI, and E2E smoke testing |
| **CI/CD** | GitHub Actions | Automated linting, test enforcement, and release gates |

---

## 3. Implemented API Map

### AI Coach & Conversations Endpoints (`/api/v1/ai` & `/api/v1/conversations`)
- `POST /api/v1/ai/chat` — Generate AI Coach response using LLMClient (Protected)
- `GET /api/v1/conversations` — List user's chat sessions (Protected)
- `POST /api/v1/conversations` — Create a new chat session (Protected)
- `GET /api/v1/conversations/:id/messages` — Fetch message history for session (Protected)
- `POST /api/v1/conversations/:id/messages` — Append message & generate AI response (Protected)

### Student Platform & Identity Endpoints
- Tasks (`/api/v1/tasks`)
- Study Tracker (`/api/v1/study/sessions`)
- Skills & Career Intelligence (`/api/v1/skills`, `/api/v1/careers`, `/api/v1/users/me/career`)
- Projects Portfolio (`/api/v1/projects`)
- Analytics (`/api/v1/analytics`)
- Authentication (`/api/v1/auth`, `/api/v1/users`)

---

## 4. How to Run the Project

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start Backend Server (http://localhost:5000)
cd backend && npm run dev

# Start Frontend Server (http://localhost:5173)
cd frontend && npm run dev

# Run linting across projects
npm run lint

# Run all test suites
npm run test

# Build production frontend bundle
npm run build
```
