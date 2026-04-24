# Moment — Full-Stack Social Media App

Moment is a full-stack social media application built from the ground up. Users can create accounts, follow each other, post text and images, like and comment on posts, and chat in real time — all within a clean, modern UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Why This Stack](#why-this-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)

---

## Features

### Authentication & Security
- **Signup / Login** with email and password
- **Strong password enforcement** — minimum 8 characters, requires uppercase, lowercase, number, and special character; live strength checker shown as you type on the signup page
- **JWT access tokens** (15-minute expiry) + **refresh token rotation** — access tokens are silently refreshed in the background when they expire; no manual re-login required
- **Refresh tokens hashed in the database** (SHA-256) and rotated on every use — old token is invalidated the moment a new one is issued
- **Rate limiting** on the login endpoint — max 5 attempts per minute to prevent brute-force attacks
- **Auto-logout** on 401 — if a token is ever rejected by the server, the user is cleanly logged out and redirected to login
- Email normalization (lowercased and trimmed) to prevent duplicate accounts

### Posts
- Create posts with text and optional image upload
- Upload images from your device (JPG or PNG) with drag-and-drop or file picker
- Instant image preview before submitting
- Like / unlike posts with real-time count updates
- Delete your own posts

### Comments
- Expand and collapse comments per post
- Add comments with Enter key or submit button
- Like / unlike individual comments
- Delete your own comments

### Follow System
- Send and cancel follow requests
- Accept or decline incoming follow requests
- Follower / following counts on profiles

### Real-Time Chat
- Direct messages between users
- Start a conversation from any profile page
- Real-time message delivery via WebSockets (Socket.io)
- Conversation list with per-conversation message history

### Notifications
- Badge counters directly on Chat and Friend Requests nav items (no separate notifications page)
- Chat badge increments on every new incoming message
- Social badge increments on new follow requests and follow acceptances
- Badges clear automatically when you visit the relevant page

### Profiles
- View any user's profile: bio, post count, follower/following counts
- Profile avatar (initials fallback when no image set)
- All posts by a user listed on their profile page
- Message button to start a direct conversation directly from a profile

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **NestJS** | v11 | REST API framework |
| **TypeScript** | v5 | Type-safe server code |
| **Prisma** | v6 | ORM and database migrations |
| **PostgreSQL** | — | Primary relational database |
| **Socket.io** | v4 | Real-time WebSocket communication |
| **Passport + JWT** | — | Authentication strategy |
| **bcrypt** | v5 | Password hashing |
| **class-validator / class-transformer** | — | Request validation and DTO transformation |
| **@nestjs/throttler** | v6 | Rate limiting |
| **Multer** | — | Multipart file upload handling |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | v19 | UI component framework |
| **TypeScript** | v6 | Type-safe client code |
| **Vite** | v6 | Build tool and dev server |
| **React Router** | v7 | Client-side routing |
| **Axios** | v1 | HTTP client with interceptors |
| **Socket.io Client** | v4 | Real-time WebSocket connection |
| **CSS (custom)** | — | All styling written by hand, no UI library |

---

## Why This Stack

### NestJS over Express (raw)
Express is minimal by design — it gives you a router and middleware, nothing else. That's fine for tiny services but becomes a problem as the codebase grows. NestJS sits on top of Express and adds a **module system, dependency injection, guards, interceptors, and decorators** out of the box. Every concern (auth, posts, chat, upload) lives in its own self-contained module. You get the raw performance of Express with the structure of a production framework. It also has first-class TypeScript support, whereas Express retrofits it.

### Prisma over raw SQL or other ORMs
Prisma generates a **fully type-safe client** from your schema — your editor knows every field on every model, and a typo in a query is a compile error, not a runtime crash. Compared to Sequelize or TypeORM (which rely on decorators and can diverge from actual DB state), Prisma's schema file is the single source of truth. Running `prisma db push` and `prisma generate` keeps the database and the client in sync in one command. Migrations are readable plain SQL that you can version-control and review.

### PostgreSQL over MongoDB
The data in a social app is inherently relational: users follow users, posts belong to users, comments belong to posts, likes belong to both users and posts. A document database like MongoDB handles each of these as nested documents or manual references — which means your application code has to manage joins and consistency. PostgreSQL handles this natively with foreign keys, cascade deletes, and `@@unique` constraints, making data integrity a database guarantee rather than an application concern.

### Socket.io over raw WebSockets
Raw WebSockets give you a bidirectional channel and nothing else. Socket.io adds **rooms, namespaces, automatic reconnection, and event-based messaging** on top of that. The chat and notifications each run in their own namespace (`/chat`, `/notifications`), so the two concerns are isolated. Each user is auto-joined to a private room keyed by their ID, so targeted delivery (send a notification to exactly one user) is a single `server.to(room).emit(...)` call. Socket.io also handles fallback transports for environments where raw WebSocket connections are blocked.

### React over other frontend frameworks
React's component model maps directly to the feature-based folder structure used here — each feature owns its own components, API functions, and context. React 19's concurrent rendering makes the UI feel fast even during background token refreshes or image uploads. React Router v7 provides file-free programmatic routing, and the Context API covers the auth and notification state without needing a third-party state manager for an app of this size.

### Vite over Create React App / Webpack
Vite uses native ES modules in development — there is no bundle step. The dev server starts in milliseconds regardless of project size, and Hot Module Replacement applies changes in under 50ms. CRA is deprecated and Webpack-based setups require significant configuration to match the same DX. Vite also produces smaller, better-optimized production bundles via Rollup.

### JWT + Refresh Tokens over session-based auth
Sessions require server-side storage (Redis or a DB table), which adds infrastructure and a single point of failure. JWTs are stateless — the server just verifies the signature. For the short-lived access token (15 minutes), if a token is leaked it expires quickly. The refresh token is long-lived (30 days) but stored hashed in the database, so it can be revoked on logout or suspicious activity. Token rotation means each refresh issues a new pair and invalidates the old refresh token — replaying a stolen refresh token is immediately detected.

### Custom CSS over Tailwind or a component library
A UI library like Chakra or MUI makes early development fast but then fights you whenever you want to deviate from its design system. Tailwind avoids that by being utility-first, but it bloats JSX with dozens of class names per element, making components hard to read. The approach here is hand-written semantic CSS with BEM-style class names. Every class name is readable (`feed-card__author`, `image-dropzone--active`), styles live in one file, and there is no dependency to update or break.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│  React + Vite (port 5173)                   │
│  ┌──────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Auth     │  │ Posts/Feed │  │  Chat   │ │
│  │ Context  │  │ Components │  │ Sockets │ │
│  └──────────┘  └────────────┘  └─────────┘ │
│       │  HTTP (Axios)   │  WS (Socket.io)   │
└───────┼─────────────────┼───────────────────┘
        │                 │
┌───────▼─────────────────▼───────────────────┐
│             NestJS API (port 3000)          │
│  ┌────────┐ ┌───────┐ ┌──────┐ ┌────────┐  │
│  │  Auth  │ │ Posts │ │ Chat │ │Notifs  │  │
│  │ Module │ │Module │ │ GW   │ │  GW    │  │
│  └────────┘ └───────┘ └──────┘ └────────┘  │
│  ┌──────────────────────────────────────┐   │
│  │           PrismaService              │   │
│  └──────────────────────────────────────┘   │
│         static /uploads/* files             │
└─────────────────────────────────────────────┘
        │
┌───────▼──────────────────┐
│   PostgreSQL database    │
│   (project_vibecode)     │
└──────────────────────────┘
```

**Request flow:**
1. Every HTTP request from the browser goes to NestJS via Axios
2. A request interceptor attaches the stored JWT access token to every request
3. A response interceptor catches 401s — if a refresh token is stored, it silently calls `POST /auth/refresh`, gets new tokens, and retries the failed request; if the refresh also fails, the user is logged out
4. WebSocket connections authenticate on connect by reading the stored token and re-reading it on each reconnect (so token refreshes are picked up automatically)
5. Uploaded images are stored on disk under `uploads/` and served as static assets by the same NestJS server

---

## Project Structure

```
Project_Vibecode/
├── src/                        # NestJS backend
│   ├── auth/                   # JWT auth, login, register, refresh, logout
│   │   ├── dto/                # RegisterDto, LoginDto, RefreshTokenDto
│   │   ├── guards/             # JwtAuthGuard
│   │   └── strategies/         # JWT passport strategy
│   ├── users/                  # User profiles, follow/unfollow
│   ├── posts/                  # Create, delete, get feed, get by user
│   ├── comments/               # Add, delete, like/unlike comments
│   ├── likes/                  # Like/unlike posts
│   ├── conversations/          # Start and list conversations
│   ├── messages/               # Send and list messages
│   ├── chat/                   # Socket.io gateway (/chat namespace)
│   ├── notifications/          # Notification model, gateway (/notifications)
│   ├── upload/                 # POST /upload — file upload endpoint
│   ├── prisma/                 # PrismaService (global module)
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   └── schema.prisma           # Database schema (single source of truth)
│
├── uploads/                    # Uploaded images stored here, served at /uploads/*
│
└── client/                     # React frontend
    └── src/
        ├── app/                # Router setup
        ├── layouts/            # AppShell (sidebar nav + content area)
        ├── pages/              # FeedPage, LoginPage, SignupPage, ProfilePage, ChatPage, etc.
        ├── features/
        │   ├── auth/           # Auth API, AuthContext, token storage, JWT decode
        │   ├── posts/          # Post API functions, CreatePostForm, PostComments
        │   ├── chat/           # Chat API, ChatWindow component, useChat hook
        │   ├── notifications/  # NotificationContext (badge counts)
        │   └── users/          # Follow/unfollow API, user profile API
        ├── components/
        │   └── navigation/     # NavLinkCard with badge support
        ├── services/
        │   └── api/client.ts   # Axios instance with auth + auto-refresh interceptors
        ├── types/              # Shared TypeScript types (Post, Comment, User, Auth)
        └── utils/              # resolveMediaUrl (maps /uploads/ paths to full URLs)
```

---

## How to Run

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- `npm` or compatible package manager

### 1. Clone and install

```bash
git clone <repo-url>
cd Project_Vibecode

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Configure environment

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/project_vibecode?schema=public"
JWT_SECRET="a-long-random-secret-string"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

For the frontend, create `client/.env` (optional — defaults to localhost):

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000/chat
```

### 3. Set up the database

```bash
npx prisma db push
npx prisma generate
```

### 4. Run the backend

```bash
# Development (watch mode — auto-reloads on changes)
npm run start:dev

# Production
npm run build
node dist/main.js
```

The API will be available at `http://localhost:3000`.

### 5. Run the frontend

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key used to sign JWT tokens — use a long random string in production |
| `PORT` | No | Port the API listens on (default: `3000`) |
| `CORS_ORIGIN` | No | Comma-separated list of allowed frontend origins |

### Frontend (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |
| `VITE_SOCKET_URL` | `http://localhost:3000/chat` | Socket.io chat namespace URL |

---

## API Overview

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account — returns access + refresh token |
| `POST` | `/auth/login` | Login — rate limited to 5/min, returns access + refresh token |
| `POST` | `/auth/refresh` | Exchange refresh token for new token pair |
| `POST` | `/auth/logout` | Revoke refresh token |

### Posts
| Method | Path | Description |
|---|---|---|
| `GET` | `/posts` | Get feed (posts from followed users) |
| `POST` | `/posts` | Create a post |
| `GET` | `/posts/user/:userId` | Get all posts by a specific user |
| `DELETE` | `/posts/:postId` | Delete your own post |

### Comments
| Method | Path | Description |
|---|---|---|
| `GET` | `/comments/post/:postId` | Get comments for a post |
| `POST` | `/comments/post/:postId` | Add a comment |
| `DELETE` | `/comments/:commentId` | Delete your own comment |
| `POST` | `/comments/:commentId/like` | Like a comment |
| `DELETE` | `/comments/:commentId/like` | Unlike a comment |

### Likes
| Method | Path | Description |
|---|---|---|
| `POST` | `/likes/post/:postId` | Like a post |
| `DELETE` | `/likes/post/:postId` | Unlike a post |

### Users & Following
| Method | Path | Description |
|---|---|---|
| `GET` | `/users/:userId` | Get a user's profile |
| `POST` | `/users/:userId/follow` | Send a follow request |
| `DELETE` | `/users/:userId/follow` | Unfollow or cancel request |
| `GET` | `/users/follow-requests` | Get your pending received requests |
| `POST` | `/users/follow-requests/:requestId/accept` | Accept a follow request |
| `POST` | `/users/follow-requests/:requestId/decline` | Decline a follow request |

### Conversations & Messages
| Method | Path | Description |
|---|---|---|
| `POST` | `/conversations/start` | Start or retrieve a direct conversation |
| `GET` | `/conversations` | List your conversations |
| `GET` | `/messages/:conversationId` | Get message history |

### Notifications
| Method | Path | Description |
|---|---|---|
| `GET` | `/notifications/unread-counts` | Get `{ chat, social }` unread badge counts |
| `PATCH` | `/notifications/read-chat` | Mark all chat notifications as read |
| `PATCH` | `/notifications/read-social` | Mark all social notifications as read |

### Upload
| Method | Path | Description |
|---|---|---|
| `POST` | `/upload` | Upload a JPG or PNG image — returns `{ url: "/uploads/uuid.ext" }` |

---

## Database Schema (summary)

```
User ──< Post ──< Comment
     ──< Like
     ──< CommentLike
     ──< Follow
     ──< FollowRequest
     ──< ConversationParticipant >── Conversation ──< Message
     ──< Notification
     ──< RefreshToken
```

All foreign key relationships use cascade delete — removing a user removes all their posts, comments, likes, messages, tokens, and notifications automatically.
