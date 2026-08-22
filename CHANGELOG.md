# Changelog

All notable changes to the **NEXORA** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2026-08-19 - Phase 7 AI Intelligence & Recommendations

### Added
- **AI Intelligence Architecture & Recommendation Engine (`backend/src/services/aiIntelligence.service.js`)**:
  - `Recommendation.model.js`: Persistent schema tracking `userId`, `fingerprint`, `title`, `description`, `type`, `actionableSteps`, `relevanceScore`, `feedback` (`helpful`, `not_useful`, `accepted`, `rejected`, `pending`), and `status`.
  - Recommendation Fingerprinting: Normalized fingerprint duplicate key check ensuring no duplicate recommendations are stored.
  - Deterministic Signals + LLM Synthesis: Backend computes priority skill gaps, task deadlines, and study duration signals while reusing Phase 5/6 LLM client for structured synthesis.
  - Response Parser JSON Schema Validation: `ResponseParser.parseJSON`, `validateRoadmapSchema`, and `validateRecommendationSchema` to strictly validate model outputs.

- **AI Intelligence REST APIs (`/api/v1/ai/`)**:
  - `POST /api/v1/ai/skill-analysis`: Executes AI Skill Gap Analysis combining calculated backend metrics with LLM explanation.
  - `POST /api/v1/ai/generate-roadmap`: Synthesizes and validates 3-stage structured career roadmap JSON.
  - `POST /api/v1/ai/recommend`: Generates non-duplicate recommendations based on priority signals.
  - `GET /api/v1/ai/recommendations`: Fetches user recommendations.
  - `PUT /api/v1/ai/recommendations/:id/feedback`: Records user feedback (`helpful`, `not_useful`, `accepted`, `rejected`).
  - `POST /api/v1/ai/recommendations/give-another`: Generates distinct non-duplicate recommendation avoiding past rejected items.

- **Frontend AI Intelligence Components**:
  - `RecommendationsWidget.jsx`: Interactive card on Dashboard & Career pages with feedback buttons ("Helpful", "Not Useful", "Accept", "Give Another").
  - `AIRoadmapView.jsx`: Timeline view displaying 3-stage roadmap with milestone actions and skill tags.
  - Updated `Career.jsx` & `Dashboard.jsx`: Embedded AI Skill Analysis action and AI Recommendation widgets.

- **Automated AI Intelligence Test Suite (`backend/tests/ai_intelligence.test.js`)**:
  - Unit and integration tests covering skill analysis, structured roadmap JSON validation, recommendation generation, feedback loop, fingerprint duplicate detection, and `give-another` non-duplicate generation.

---

## [0.6.0] - 2026-08-19 - Phase 6 NEXORA Memory System

### Added
- **Multi-Level Assistant Memory Architecture (`backend/src/ai/`)**:
  - `Memory.model.js`: Mongoose schema tracking `userId`, `memory`, `type` (`long_term`, `session`, `preference`, `career`, `fact`), `importance` (1-5), `source` (`user_explicit`, `system_extracted`, `preference`), `createdAt`, `updatedAt`.
  - `MemoryRetriever`: Deterministic keyword, category, and importance relevance scorer limiting context to top-5 memories.
  - `ContextBuilder`: Multi-source context engine assembling student profile, target career goal, skill gaps, recent study activity, persistent memories, and bounded short-term conversation context (last 15 messages).

- **Memory Management REST APIs (`/api/v1/memories` & `/api/v1/memory`)**:
  - `GET /api/v1/memories`: Returns user memories with optional `?type=` filter.
  - `POST /api/v1/memories`: Stores explicit user memory items.
  - `PUT /api/v1/memories/:id`: Updates memory content, type, or importance rating.
  - `DELETE /api/v1/memories/:id`: Deletes specific memory item.
  - `DELETE /api/v1/memories`: Clears all memories for the authenticated user.

- **Privacy & Fresh Chat Controls**:
  - User Privacy Switches: `aiMemoryEnabled`, `profileMemoryEnabled`, `conversationMemoryEnabled`, and `preferenceMemoryEnabled`.
  - Fresh / Private Chat Mode: `isFreshChat` flag on conversation sessions bypassing long-term memory reads and persistent storage.

- **Frontend Memory Management UI (`frontend/src/pages/MemorySettings.jsx`)**:
  - `memory.service.js`: API service wrapper for memory endpoints.
  - `MemorySettings.jsx`: Inspector interface for filtering memory categories, creating custom memories, deleting items, clearing all memories, and toggling privacy controls.
  - `AIChat.jsx` & `Sidebar.jsx`: Integrated Fresh Chat mode toggle, active session badges, and `/memory-settings` navigation item.

- **Automated Memory Test Suite (`backend/tests/memory.test.js`)**:
  - Unit and integration tests for memory CRUD, user ownership isolation, privacy setting enforcement, fresh chat session isolation, and AI prompt context injection.

---

## [0.5.0] - 2026-08-19 - Phase 5 AI Foundation

### Added
- **Provider-Agnostic AI Architecture (`backend/src/ai/`)**:
  - `llmClient.js`: Factory client selecting LLM provider via `LLM_PROVIDER` environment variable.
  - `providers/mock.provider.js`: Deterministic mock adapter for fast, zero-cost testing.
  - `providers/openai.provider.js`: Hosted pre-trained LLM adapter for OpenAI API integration.
  - `promptManager.js`: System prompt formatting and bounded context manager (last 15 messages).
  - `responseParser.js`: Sanitizes and parses raw model output, stripping dangerous HTML tags.

- **Conversation & Message Data Models (`backend/src/models/`)**:
  - `Conversation.model.js`: Mongoose schema tracking `userId`, `title`, `timestamps`.
  - `Message.model.js`: Mongoose schema tracking `conversationId`, `userId`, `role` (`user`, `assistant`, `system`), `content`, `timestamps`.

- **AI & Conversation REST APIs (`/api/v1/ai` & `/api/v1/conversations`)**:
  - `POST /api/v1/ai/chat`: Generates AI Coach responses, saves user/assistant messages to MongoDB, and returns JSON payload.
  - `GET /api/v1/conversations`: Retrieves user's conversation sessions.
  - `POST /api/v1/conversations`: Creates a new conversation session.
  - `GET /api/v1/conversations/:id/messages`: Retrieves message history for a conversation.
  - `POST /api/v1/conversations/:id/messages`: Appends message and generates AI response.

- **Frontend AI Coach Interface (`frontend/src/pages/AIChat.jsx`)**:
  - `ai.service.js`: Frontend API service wrapper for AI chat and conversation management.
  - `AIChat.jsx`: Interactive AI Coach chat page with conversation list sidebar, message bubbles, auto-scrolling history, loading indicators, and error handling with retries.
  - Updated `Sidebar.jsx` & `App.jsx`: Enabled active `/ai-coach` route.

- **Automated Testing Suite (`backend/tests/ai.test.js`)**:
  - Unit and integration tests covering MockProviderAdapter contract, ResponseParser sanitization, AI chat generation, conversation ownership, message persistence, and error handling.

---

## [0.4.0] - 2026-08-19 - Phase 4 Career + Projects + Analytics

### Added
- Skill and CareerGoal catalog seeding, UserSkill proficiency ratings, Skill Gap Analysis engine, NEXORA Career Readiness Score, Project portfolio CRUD, Recharts analytics dashboard.

---

## [0.3.0] - 2026-08-19 - Phase 2 Authentication & User Identity

### Added
- User & AuthSession models, JWT access tokens, httpOnly refresh cookies, token rotation, reuse detection, and account deletion.

---

## [0.2.0] - 2026-08-19 - Phase 1 Development Foundation

### Added
- Node.js + Express backend baseline (`GET /api/v1/health`), React + Vite frontend baseline.
