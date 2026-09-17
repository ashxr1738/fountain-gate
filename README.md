# Church Equipment

A full-stack application for equipment management: add equipment, request it, approve/check it out, then return it.

## Architecture

This project is structured as a monorepo containing:
- **`frontend/`**: Next.js App Router frontend with Tailwind CSS, UI components, QR code generation, and client/SSR workflows.
- **`backend/`**: Express + TypeScript backend service housing authentication endpoints (`/api/auth/*`), Supabase services, and database migrations.

## Project Structure

```
fgcn/
├── frontend/
│   ├── app/                 # Next.js pages and layouts (login, protected dashboard, assets, requests)
│   ├── components/          # UI components and navigation
│   ├── lib/                 # Auth client, Supabase config, utilities
│   ├── public/              # Static assets, icons, manifest
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── auth/            # Auth service, controller, middleware, and routes
│   │   ├── supabase/        # Backend Supabase client and config
│   │   ├── types/           # Core domain and auth types
│   │   └── server.ts        # Express server entry point
│   ├── database/
│   │   └── migrations/      # Supabase SQL migrations
│   ├── package.json
│   └── tsconfig.json
│
├── package.json             # Root monorepo workspace configuration
└── README.md
```

## Quick Start

### 1. Database Setup
1. Create a Supabase project.
2. Run [`backend/database/migrations/202609160001_initial.sql`](backend/database/migrations/202609160001_initial.sql) in the Supabase SQL Editor.
3. In Supabase Authentication, enable email/password sign-in.

### 2. Environment Variables
- Copy `frontend/.env.example` to `frontend/.env.local`
- Copy `backend/.env.example` to `backend/.env`

### 3. Install & Run
Install dependencies at the root:
```bash
npm install
```

Start the applications:
- **Run Frontend**: `npm run dev:frontend` (starts at http://localhost:3000)
- **Run Backend**: `npm run dev:backend` (starts at http://localhost:5000)
- **Run Both**: `npm run dev:all`

### 4. Admin Role
Promote the first church administrator in the Supabase SQL Editor:
```sql
update public.users set role = 'ADMIN' where email = 'admin@yourchurch.org';
```
