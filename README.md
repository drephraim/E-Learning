# AdaptiveLearn - Intelligent E-Learning & Adaptive Learning Platform

Developed for University of Energy and Natural Resources (Group 5B).

AdaptiveLearn is an AI-powered e-learning platform that generates customized course modules, practical tasks, quizzes, flashcards, and summaries using advanced language models and automated web/academic research.

---

## Technical Stack & Architecture

- **Frontend**: React (Vite), Lucide Icons, Modern Responsive UI
- **Backend**: NestJS (TypeScript), Prisma ORM, Neon PostgreSQL
- **AI & Integrations**: Google Gemini API, Groq LLM API, Tavily Search API, YouTube Data API, OpenAlex API

---

## Getting Started & Setup Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm

### 2. Environment Configuration & API Keys
Create a `.env` file inside the `backend/` directory (you can copy `.env.example`):

```bash
cd backend
cp .env.example .env
```

Ensure your `backend/.env` contains the required database URL and API keys:

```env
DATABASE_URL="postgresql://neondb_owner:npg_6Bp2SLuqGhQU@100.51.95.243:5432/neondb?sslmode=require&options=endpoint%3Dep-royal-salad-anihxqyx-pooler"

GEMINI_API_KEY="<your_gemini_api_key>"
GROQ_API_KEY="<your_groq_api_key>"
TAVILY_API_KEY="<your_tavily_api_key>"
YOUTUBE_API_KEY="<your_youtube_api_key>"
OPENALEX_API_KEY="7aRpYl0NULfjYvalbsyrd5"
```

### 3. Installing Dependencies & Running Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```
The NestJS backend API runs at `http://localhost:3000`.

### 4. Running Frontend

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```
The Vite development server runs at `http://localhost:5173`.

---

## Project Structure

```
E-Learning/
├── backend/            # NestJS API, AI Services & Prisma ORM
│   ├── src/            # Controllers, Services, Auth, Courses
│   ├── prisma/         # Prisma Schema & Database Models
│   ├── .env.example    # Environment Variables Template
├── frontend/           # React App (Vite)
│   ├── src/            # Components, Portals, Dashboards
├── vercel.json         # Deployment Config
└── README.md           # Documentation
```
