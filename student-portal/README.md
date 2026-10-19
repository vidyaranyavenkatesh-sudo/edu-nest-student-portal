# EduNest — Student Portal

This is the student-facing half of EduNest. It pairs with the **School Portal** (the other file you were given), which admins and teachers use, and both share one Supabase backend.

**Set up the backend first using the School Portal's README** (creating the Supabase project, running `supabase/schema.sql` and `storage.sql`, and creating the first admin account) — that only needs to be done once, from the School Portal's files, since the database lives in Supabase, not in either website. Once that's done, come back here.

## Run it on your computer (localhost)

You need Node.js 18.18 or newer installed.

```bash
cd student-portal
cp .env.example .env.local
```

Edit `.env.local` with two values from your Supabase project (**Project Settings → API**): `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the **same values** as the School Portal's `.env.local` — but **do not** put the service role key here; the Student Portal never needs it and it must never reach a browser.

```bash
npm install
npm run dev
```

This starts the Student Portal at **http://localhost:3001**.

### Running both websites at once

Open a second terminal for the School Portal (see its README) — it runs on port 3000, this one runs on port 3001, so both stay up at the same time:

```bash
# Terminal 1
cd school-portal && npm run dev     # http://localhost:3000

# Terminal 2
cd student-portal && npm run dev    # http://localhost:3001
```

Log in to each with a different account (an admin or teacher ID on the School Portal, a student ID here) — using one normal browser window and one private/incognito window keeps the two logins from clashing, since both use browser cookies.

A student can only log in here, and a teacher or admin can only log in to the School Portal — each website rejects the other's kind of login ID with a message saying which website to use.

## Deploy

This app deploys the same way as any Next.js project — for example, a Vercel or Netlify project with its *root directory* set to this folder, and the two environment variables above added under its settings. Give it its own domain (e.g. `student.yourdomain.in`) separate from the School Portal's.

## What was tested

This app was tested end to end together with the School Portal against a local database with the same security rules Supabase uses: attendance appearing the moment a teacher marks it, missed-class notes with attachments, report cards through to publishing, messaging with teachers and classmates (including reporting a message), the timetable showing substitute teachers automatically, and that a teacher or admin login is rejected here with a clear message pointing to the School Portal. It has not been tested against your actual Supabase project yet — do a walkthrough with a couple of real student accounts first.
