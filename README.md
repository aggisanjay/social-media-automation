# Zernio — Social Media Automation & Post Scheduler

A modern, developer-friendly social media automation platform that lets you compose, schedule, and publish posts across multiple platforms (LinkedIn, Instagram, X/Twitter, and Facebook) using AI-powered captions, tones, and image generation.

---

## Architecture

```mermaid
graph TD
    Client[Client: React & TanStack Start] <-->|HTTP / REST API| Backend[Backend: Express API]
    Backend <-->|Data Persistence| DB[(MongoDB Atlas)]
    Backend <-->|Queue / Delayed Jobs| Redis[(Upstash Redis / BullMQ)]
    Backend -->|Publishing engine| Zernio[Zernio Social Publishing API]
    Backend -->|Media Storage| Cloudinary[Cloudinary CDN]
    Backend -->|AI Generation| AI[Groq / Gemini APIs]
```

---

## Features

- **Multi-Platform Posting**: Compose a single post and schedule it across LinkedIn, Instagram, Facebook, and X (Twitter).
- **Social Account Management**: Link and sync multiple accounts. Automatically retrieves connected profiles directly from Zernio.
- **Smart Scheduling Queue**: Delayed job queue managed via **BullMQ** (with an automatic in-memory scheduler fallback if Redis is offline).
- **AI Composer**: Generate captivating post content in various tones (Professional, Creative, Funny, etc.) and generate relevant images using AI models.
- **Robust Error Handling**: Auto-retry logic for rate-limited platform API requests and real-time logging of partial delivery successes/failures.

---

## Technology Stack

### Frontend (Client)
- **Framework**: React 19 + TanStack Start (Vite, TypeScript)
- **Styling**: Tailwind CSS v4 + Lucide Icons + Shadcn UI
- **State Management**: TanStack React Query v5

### Backend
- **Server**: Node.js + Express
- **Database**: Mongoose (MongoDB Atlas)
- **Task Queue**: BullMQ + ioredis (Upstash Redis)
- **Storage**: Cloudinary (media assets)
- **Logs**: Winston logger

---

## Project Structure

```
social-media-automation/
├── backend/
│   ├── src/
│   │   ├── config/       # Database & Redis config
│   │   ├── controllers/  # API route controllers
│   │   ├── jobs/         # BullMQ queue workers
│   │   ├── middleware/   # Auth & error middlewares
│   │   ├── models/       # Mongoose schemas (Post, SocialAccount, etc.)
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Third-party integrations (Groq, Zernio, Cloudinary)
│   │   └── utils/        # Loggers & token helpers
│   └── tests/            # Jest test suites
├── client/
│   ├── src/
│   │   ├── components/   # Reusable UI widgets & Shadcn UI
│   │   ├── lib/          # Axios API services
│   │   ├── routes/       # React page routes (TanStack Router)
│   │   └── styles.css    # Global Tailwind v4 configuration
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URI
- Upstash Redis credentials
- Zernio API key (for publishing engine)
- Groq / Gemini API keys (for AI content composer)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd social-media-automation
   ```

2. **Configure Backend environment**:
   Create `backend/.env` (see `backend/.env.example`):
   ```ini
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   REDIS_URL=rediss://default:your_redis_token@your_redis_host:port
   ACCESS_TOKEN_SECRET=your_jwt_access_secret
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
   ZERNIO_API_KEY=your_zernio_api_key
   GROQ_API_KEY=your_groq_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

3. **Start the Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start the Client**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open `http://localhost:8081` in your browser.

---

## Running Tests & Verifications

To run the backend test suite:
```bash
cd backend
npm run test
```

To build the frontend production client:
```bash
cd client
npm run build
```
