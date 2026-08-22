# NEXORA — System Architecture & Engineering Specification

> **Current Phase:** Phase 5 — AI Foundation Implemented  
> **Architecture Pattern:** Modular Monolith  
> **Backend Language:** JavaScript (Node.js + Express.js)  
> **Database:** MongoDB + Mongoose  
> **Frontend:** React + Vite + Tailwind CSS + Recharts  

---

## 1. System Architecture Overview

NEXORA is designed as a **modular monolith**. All backend logic, business rules, security middleware, and AI context orchestration reside within a single version-controlled Node.js + Express application. The frontend is a React single-page application (SPA) built with Vite that interacts exclusively with the backend via a versioned REST API (`/api/v1`).

```
USER
  │
  ▼
React + Vite + Tailwind CSS (frontend/src)
  │
  ▼ REST / JSON (versioned /api/v1)
  │
Node.js + Express Backend (backend/src)
  │
  ├──► Middleware (express.json, cookieParser, CORS, Auth, Error Handling)
  │
  ├──► Controllers (ai.controller.js, conversation.controller.js)
  │
  ├──► Services / Business Logic (ai.service.js, conversation.service.js)
  │       │
  │       ├──► AI Abstraction Layer (src/ai/)
  │       │       ├──► PromptManager
  │       │       ├──► LLMClient Factory (LLM_PROVIDER)
  │       │       ├──► Provider Adapters (mock.provider.js, openai.provider.js)
  │       │       └──► ResponseParser (Sanitizer)
  │       │
  │       └──► MongoDB / Mongoose (Conversation.model.js, Message.model.js)
  │
  ▼
Hosted Pre-trained LLM Provider (API Call)
```

---

## 2. Implemented API Map

| Module | Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SYSTEM** | `GET` | `/api/v1/health` | Public | Liveness and readiness status check |
| **AUTH** | `POST` | `/api/v1/auth/register` | Public | Register new user account |
| **AUTH** | `POST` | `/api/v1/auth/login` | Public | Authenticate user & set httpOnly refresh cookie |
| **AUTH** | `POST` | `/api/v1/auth/refresh` | Cookie | Rotate refresh session & issue access token |
| **AUTH** | `POST` | `/api/v1/auth/logout` | Cookie | Revoke refresh session & clear cookie |
| **AUTH** | `GET` | `/api/v1/auth/me` | Protected | Fetch current authenticated user context |
| **USERS** | `GET/PUT/DELETE` | `/api/v1/users/me` | Protected | Profile management & cascade account deletion |
| **TASKS** | `GET/POST/PUT/DELETE` | `/api/v1/tasks` | Protected | Task management & completion tracking |
| **STUDY** | `GET/POST/DELETE` | `/api/v1/study/sessions` | Protected | Study session recording & subject focus |
| **SKILLS** | `GET/POST/PUT/DELETE` | `/api/v1/skills` & `/users/me/skills` | Protected | Skill catalog & proficiency ratings |
| **CAREER** | `GET/PUT` | `/api/v1/careers` & `/users/me/career` | Protected | Target role & deterministic skill gap analysis |
| **PROJECTS**| `GET/POST/PUT/DELETE` | `/api/v1/projects` | Protected | Student portfolio projects |
| **ANALYTICS**| `GET` | `/api/v1/analytics/dashboard` | Protected | Deterministic analytics overview |
| **AI** | `POST` | `/api/v1/ai/chat` | Protected | Generate AI Coach response via LLMClient |
| **CONVERSATIONS** | `GET/POST` | `/api/v1/conversations` | Protected | List and create chat conversation sessions |
| **MESSAGES** | `GET/POST` | `/api/v1/conversations/:id/messages` | Protected | Fetch & append messages to conversation |

---

## 3. Provider-Agnostic AI Adapter Pipeline

1. **Strict Abstraction:** All LLM calls pass through `LLMClient`. Components, services, and controllers **NEVER** import or reference provider SDKs directly.
2. **Context Bounding:** `PromptManager.prepareContext()` restricts context window to the last 15 messages of the active chat.
3. **Response Sanitization:** `ResponseParser.parse()` strips dangerous tags from model outputs before sending payload to the frontend.
4. **Secret Isolation:** Provider credentials (`LLM_API_KEY`, `LLM_MODEL`) are kept strictly on the backend.
