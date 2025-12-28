# PlayPulse

A modern gaming platform dashboard built with Next.js, Prisma, and TailwindCSS.

## Features

- **Authentication**: Login and registration with JWT-based auth
- **Admin Panel**: User management for admins
- **Fixed Sidebar**: Persistent navigation that doesn't reload on tab change
- **Modern UI**: Beautiful gradient-based design with TailwindCSS

## Tech Stack

- Next.js 15 (App Router)
- Prisma with PostgreSQL
- TailwindCSS
- JWT Authentication
- Lucide Icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
DATABASE_URL="your-postgres-connection-string"
JWT_SECRET="your-secret-key"
```

3. Push database schema:
```bash
npx prisma db push
```

4. Seed the admin user:
```bash
node scripts/seed.mjs
```

5. Run the development server:
```bash
npm run dev
```

## Default Admin Credentials

- Email: `admin@playpulse.com`
- Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── api/auth/       # Auth API routes
│   ├── dashboard/      # Dashboard pages
│   ├── login/          # Login page
│   └── register/       # Registration page
├── components/
│   └── Sidebar.tsx     # Fixed sidebar component
└── lib/
    ├── auth.ts         # Auth utilities
    └── prisma.ts       # Prisma client
```
