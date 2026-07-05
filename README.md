# Inventory Management System

A full-stack Next.js inventory management app built with Tailwind CSS, PostgreSQL, and Neon serverless database support.

## Overview

This project is an inventory and sales dashboard that includes:
- User authentication with database-backed login and registration
- Role-based permissions for admin and sales users
- Product, vendor, customer, invoice, deal, and trash management
- Export utilities for PDF and Excel
- Theme toggle support and responsive UI
- Neon PostgreSQL integration via `DATABASE_URL`

## Tech Stack

- Next.js 15 (App Router)
- React 18
- Tailwind CSS v4
- PostgreSQL (Neon serverless)
- `pg` PostgreSQL client
- `next-themes` for theme switching
- TypeScript

## Key Files

- `app/page.tsx` - main dashboard shell and page layout
- `app/login/page.tsx` - login page
- `app/signup/page.tsx` - signup page
- `app/forgot-password/page.tsx` - forgot password page
- `app/api/auth/route.ts` - auth API route
- `app/api/login-requests/route.ts` - login request list API
- `app/api/db-test/route.ts` - DB health check API
- `lib/db.ts` - PostgreSQL connection and query helper
- `lib/auth.ts` - authentication, user, and login request helpers
- `scripts/create_tables.sql` - DB schema SQL file
- `scripts/init-db.js` / `scripts/init-db.ts` - scripts to initialize DB tables

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/SidraTanveer/Inventory_management_system.git
   cd inventorymanagement7
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```

4. Initialize the database schema:
   ```bash
   npm run init-db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open the app:
   - `http://localhost:3000`

## Environment Variables

Required local and production environment variable:

- `DATABASE_URL` - PostgreSQL connection string for Neon or any PostgreSQL server.

Example:
```env
DATABASE_URL=postgresql://neondb_owner:password@ep-sweet-glade-atz88net-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

## Database Schema

The app supports the following core tables:
- `users`
- `login_requests`
- `vendors`
- `customers`
- `products`
- `purchase_history_items`
- `invoices`
- `invoice_items`
- `sales_history_items`
- `deals`
- `trash_items`

To update the schema:
1. Edit `scripts/create_tables.sql`
2. Run:
   ```bash
   npm run init-db
   ```

> For production databases, use migrations or manual schema updates. The init script is primarily for local setup.

## API Endpoints

- `POST /api/auth` - handle login and registration
- `GET /api/login-requests` - fetch login requests
- `GET /api/db-test` - verify database connectivity

## Scripts

- `npm run dev` - start the app in development mode
- `npm run build` - create a production build
- `npm run lint` - run ESLint checks
- `npm run init-db` - execute database schema creation

## Deployment

This project is configured for Vercel deployment.

### Deploy to Vercel

1. Push the repo to GitHub.
2. Create a new Vercel project and connect the GitHub repository.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
4. Deploy the project.

### Verify Deployment

- Visit the deployed Vercel URL
- Check the health endpoint:
  - `/api/db-test`
- Test login, signup, and dashboard pages

## Security Notes

- Do not commit `.env.local` or any secret keys to GitHub.
- Use Vercel environment variables for production secrets.
- Ensure `DATABASE_URL` is not exposed in client-side code.

## GitHub Repository

The project is available at:
- `https://github.com/SidraTanveer/Inventory_management_system`

## Troubleshooting

- If the app cannot reach the DB, verify the `DATABASE_URL` is correct and the Neon DB is accessible.
- If build fails, run `npm run lint` and inspect TypeScript/JSX errors.
- Use `npm run init-db` again after schema changes.

## License

This project has no license specified.
