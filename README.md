## School SaaS (Next.js + Supabase)

Starter admin panel for a school management SaaS (students, attendance, fees, events).

## Local setup

### 1) Create Supabase project + tables

- Create a Supabase project.
- In Supabase **SQL Editor**, run `supabase/schema.sql`.

### 2) Environment variables

- Copy `.env.example` to `.env.local`
- Fill in:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3) Run dev server

From this folder:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and you should land on `/dashboard`.

## Deployment (Vercel)

- Import the repo into Vercel.
- Add the same env vars in **Vercel → Project → Settings → Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deploy.

## Next modules (recommended order)

- Students: admission form, profile, bulk import
- Attendance: daily marking + reports
- Fees: fee structures, invoices, receipts
- Settings/Master: classes/sections/subjects/users/permissions
- Communication: notifications + email/SMS

