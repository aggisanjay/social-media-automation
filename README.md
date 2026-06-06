# 🌐 Zernio Social Media Automation & Post Scheduler

A modern, high-performance, developer-friendly social media automation platform. It allows you to compose, schedule, and publish posts across multiple platforms (LinkedIn, Instagram, X/Twitter, and Facebook) using AI-powered captions, tones, and image generation.

---

## 🏗️ Architecture

```mermaid
graph TD
    Client[Client: React & TanStack Start] <-->|HTTP / REST API| Backend[Backend: Express API]
    Backend <-->|Data Persistence| DB[(MongoDB Atlas)]
    Backend <-->|Queue & Scheduled Jobs| Redis[(Upstash Redis / BullMQ)]
    Backend -->|Publishing Engine| Zernio[Zernio Social SDK]
    Backend -->|Media Storage| Cloudinary[Cloudinary CDN]
    Backend -->|AI Generation| AI[Groq / Gemini APIs]
```

---

## ✨ Key Features

- **Multi-Platform Posting**: Compose a single post and schedule it across LinkedIn, Instagram, Facebook, and X (Twitter).
- **Zernio OAuth Account Connection**: Production-ready connection architecture supporting complete OAuth callbacks, secure state token management, and account listings.
- **Smart Scheduling Queue**: Robust delayed scheduling managed via **BullMQ** (with an automatic in-memory scheduler fallback if Redis is offline).
- **AI Composer**: Generate captivating post captions tailored to custom prompts/tones (Professional, Creative, Funny, etc.) and generate relevant images.
- **Resilient Soft Deletion**: Seamlessly disconnect and reconnect social profiles without database duplication key issues, courtesy of a dynamic soft delete query option bypass.
- **Dynamic Origin Redirection**: Automatically tracks the user's initiating frontend port/origin and redirects them back to their active session on port **8080** (or any other dev port) without logging them out.

---

## 🛠️ Technology Stack

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

## 📂 Project Structure

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

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection URI
- Upstash Redis credentials
- Zernio API key (for publishing engine)
- Groq / Gemini API keys (for AI content composer)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd social-media-automation
   ```

2. **Configure Backend Environment**:
   Create a `.env` file in the `backend/` directory:
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
   FRONTEND_URL=http://localhost:8080
   ```

3. **Configure Frontend Environment**:
   Create a `.env` file in the `client/` directory:
   ```ini
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. **Start the Client**:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open **`http://localhost:8080`** in your browser.

---

## 🔒 Zernio OAuth Connections & Troubleshooting

> [!NOTE]
> **Dynamic Redirection**: When clicking "Connect Account" on the frontend, the backend automatically extracts the active host origin (e.g. `http://localhost:8080`) from the request headers and passes it to Zernio. After authorization, you will be redirected back to the correct port/session, preserving your local session variables.

> [!WARNING]
> **Free Tier Constraints**: The Zernio Free Tier is restricted to a maximum of **2 connected accounts**. Connecting a third platform will trigger a `402 PAYMENT_REQUIRED` error. To link a different channel, disconnect an existing account first.

> [!IMPORTANT]
> **Database Unique Key Reconnections**: The system soft deletes accounts on disconnect. During reconnection, query options bypass the soft-delete filter (`withDeleted: true`) to find the original record and restore it, preventing database unique index conflicts (`E11000 duplicate key`).

---

## 🧪 Testing & Building

### Run Backend Unit Tests
To execute backend test coverage:
```bash
cd backend
npm run test
```

### Build Client Production Code
To compile frontend production code:
```bash
cd client
npm run build
```
