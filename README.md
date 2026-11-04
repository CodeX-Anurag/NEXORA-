<div align="center">

<img src="docs/assets/banner.svg" alt="NEXORA — AI-Powered Student Productivity & Career Intelligence Platform" width="100%"/>

<br/>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

**[Features](#-features) · [Architecture](#-system-architecture) · [Tech Stack](#-technology-stack) · [Getting Started](#-getting-started) · [Roadmap](#-roadmap)**

</div>

---

## 📌 Overview

Students often manage coursework, personal goals, projects, and career preparation across several disconnected tools.

**NEXORA** brings these into a single workspace. It helps students plan tasks, log study sessions, track progress, explore career skills, build resumes, and learn with AI-powered support.

It is a full-stack web application built with **React**, **Node.js + Express**, **MongoDB**, and the **Google Gemini API**.

## 🎯 Problem & Solution

| Challenge students face | How NEXORA helps |
|---|---|
| Juggling many tasks and deadlines | Prioritized task management and a unified dashboard |
| Inconsistent study habits | Study tracker with progress review |
| No clear view of progress | Analytics with charts |
| Scattered projects and career prep | Projects portfolio, career intelligence, resume builder |
| Limited access to learning support | AI Coach and AI Socratic Viva |

## ✨ Features

<div align="center">
<img src="docs/assets/features.svg" alt="NEXORA feature overview" width="100%"/>
</div>

<br/>

```mermaid
mindmap
  root((NEXORA))
    Productivity
      Dashboard
      Task Management
      Study Tracker
      Analytics
    Career
      Career Intelligence
      Projects Portfolio
      Resume Builder
    AI Learning
      AI Coach
      AI Socratic Viva
      Memory and Privacy
    Platform
      JWT Authentication
```

| Module | Description |
|---|---|
| 📊 **Dashboard** | Central view of activities, workload, and progress |
| ✅ **Task Management** | Create, organize, and prioritize tasks with deadlines |
| 📚 **Study Tracker** | Record study activity and review learning progress |
| 🧭 **Career Intelligence** | Explore career information, skills, and learning roadmaps |
| 💻 **Projects Portfolio** | Organize and showcase technical projects |
| 📄 **Resume Builder** | Create and manage resumes |
| 📈 **Analytics** | Charts for productivity and learning trends |
| 🤖 **AI Coach** | AI assistant for explanations, learning support, and guidance |
| 🎓 **AI Socratic Viva** | Interactive question-driven practice to deepen understanding |
| 🧠 **Memory & Privacy** | Manage AI memory and privacy settings |
| 🔐 **Authentication** | JWT-based protected access |

## 🖥️ Screenshots

<table>
  <tr>
    <td align="center" width="50%"><b>Dashboard</b><br/><img src="docs/Screenshots/Dashboard.png" alt="Dashboard"/></td>
    <td align="center" width="50%"><b>Task Management</b><br/><img src="docs/Screenshots/Task.png" alt="Task Management"/></td>
  </tr>
  <tr>
    <td align="center"><b>Analytics</b><br/><img src="docs/Screenshots/Analytics.png" alt="Analytics"/></td>
    <td align="center"><b>Career Intelligence</b><br/><img src="docs/Screenshots/Career%20Intelligence.png" alt="Career Intelligence"/></td>
  </tr>
  <tr>
    <td align="center"><b>Resume Builder</b><br/><img src="docs/Screenshots/Resume%20Builder.png" alt="Resume Builder"/></td>
    <td align="center"><b>AI Coach</b><br/><img src="docs/Screenshots/AI%20COACH.png" alt="AI Coach"/></td>
  </tr>
  <tr>
    <td align="center"><b>AI Socratic Viva</b><br/><img src="docs/Screenshots/AI%20Socratic%20Viva.png" alt="AI Socratic Viva"/></td>
    <td></td>
  </tr>
</table>

## 🏗️ System Architecture

NEXORA follows a **client–server architecture**. The React frontend talks to the Express backend over a REST API; the backend handles authentication, business logic, database access, and AI integration.

<div align="center">
<img src="docs/assets/architecture.svg" alt="NEXORA system architecture" width="100%"/>
</div>

<br/>

```mermaid
flowchart LR
    User(["👤 Student"])

    subgraph FE["Frontend · React + Vite"]
        UI["UI & Modules"]
        AIUI["AI Coach Interface"]
    end

    subgraph BE["Backend · Node.js + Express"]
        API["REST API"]
        Auth["JWT Auth & Middleware"]
        Logic["Application Logic"]
        AIS["AI Service"]
    end

    DB[("MongoDB Atlas")]
    Gemini["Google Gemini API"]

    User --> UI
    User --> AIUI
    UI --> API
    AIUI --> API
    API --> Auth --> Logic
    Logic <--> DB
    Logic --> AIS
    AIS <--> Gemini

    classDef fe fill:#eef2ff,stroke:#6366f1,color:#1e1b4b
    classDef be fill:#ecfdf5,stroke:#10b981,color:#064e3b
    classDef ext fill:#fff7ed,stroke:#f59e0b,color:#78350f
    class UI,AIUI fe
    class API,Auth,Logic,AIS be
    class DB,Gemini ext
```

| Layer | Responsibility |
|---|---|
| **Frontend** | Renders the interface and handles user interaction |
| **Backend** | Validates requests and runs application logic |
| **Authentication** | Protects routes using JWT |
| **Database** | Persists application data in MongoDB |
| **AI Integration** | Connects AI features to Google Gemini via API |

## 🔄 How NEXORA Works

### Standard request flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant F as React Frontend
    participant B as Express Backend
    participant D as MongoDB

    S->>F: Interact with the UI
    F->>B: API request (JWT in header)
    B->>B: Authenticate & validate
    B->>D: Read / write data
    D-->>B: Result
    B-->>F: JSON response
    F-->>S: Updated interface
```

### AI-powered request flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant F as React Frontend
    participant B as Express Backend
    participant G as Gemini API

    S->>F: Ask a question (AI Coach / Viva)
    F->>B: Authenticated request
    B->>B: Validate & build prompt
    B->>G: Generate response
    G-->>B: AI output
    B-->>F: Response
    F-->>S: Display answer
```

> The Gemini API key lives only on the backend and is never exposed to the browser.

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| AI Integration | Google Gemini API |
| Visualization | Recharts |
| Icons | Lucide |
| Tooling | Git, GitHub |
| Deployment | Render |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/CodeX-Anurag/NEXORA-.git
cd NEXORA-
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the server:

```bash
npm start
```

### 3. Set up the frontend

In a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

### Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `PORT` | backend | Server port |
| `MONGODB_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign JWTs |
| `GEMINI_API_KEY` | backend | Google Gemini API key |
| `VITE_API_URL` | frontend | Base URL of the backend API |

## 🔐 Security

- Keep `.env` files out of version control.
- Never expose private API keys in frontend code.
- Use long, random values for `JWT_SECRET`.
- Restrict database network access to trusted sources.
- Avoid logging passwords, tokens, or credentials.
- Use separate configuration for development and production.

## 🧪 Testing

```bash
npm test
```

Run this from the `backend` or `frontend` directory, according to the scripts defined in each `package.json`.

## 🧠 AI Integration

NEXORA calls Google Gemini through its API, so no model is hosted or trained locally. The backend sends requests to the provider and returns responses to the frontend.

AI features are meant to **support** learning and productivity, not replace independent study or guarantee academic or career outcomes.

## 🔮 Roadmap

```mermaid
timeline
    title NEXORA Roadmap
    section AI
        Reliability : AI provider fallback : Improved quota handling
        Learning : RAG over notes and documents : Personalized study plans : AI-generated quizzes
    section Product
        Insights : Improved study analytics
        Career : More interview practice tools
    section Platform
        Operations : Monitoring : Deployment reliability
```

- [ ] AI provider fallback and improved quota handling
- [ ] Retrieval-Augmented Generation (RAG) for notes and documents
- [ ] Personalized AI study-plan generation
- [ ] AI-generated quizzes and revision material
- [ ] Improved study analytics and progress insights
- [ ] Stronger monitoring and deployment reliability
- [ ] Additional career preparation and interview practice tools

## 🤝 Contributing

Suggestions and improvements are welcome. Open an issue to discuss a change, or fork the repository and submit a pull request.

## 👨‍💻 Author

**Anurag Soni** — B.Tech, Computer Science & Engineering
GitHub: [@CodeX-Anurag](https://github.com/CodeX-Anurag)

## 🙏 Acknowledgements

NEXORA was built as a student software project and learning experience, with implementation, testing, debugging, and refinement supported by AI-assisted development tools.

## 📄 License

No license has been specified yet. Add a `LICENSE` file (for example, MIT) to let others use, modify, or distribute the project.

---

<div align="center">

**NEXORA — Your journey from student productivity to career readiness.**

</div>
