# Felfam Maintenance

Mobile-first maintenance ticket app for field teams.

## What it does

- Create maintenance requests (title, property, assignee, notes, priority, due date)
- Upload photos and documents
- Track status: `open` → `in_progress` → `waiting` → `closed`
- Add work log details (hours, total cost, work summary)
- Add comments and completion files
- Manage dropdown lists in-app (Properties, Vendors, Categories)
- Filter/sort dashboard by property, assignee, priority, status

Built for fast phone usage (large tap targets, bottom nav, simple forms).

---

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase PostgreSQL** (data)
- **Supabase Storage** (`maintenance-files` bucket)
- **Vercel** (hosting)

---

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.local.example .env.local
```

3. Fill `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`

---

## Supabase setup

### 1) Create a new Supabase project
Use a new standalone Supabase project for this app (separate from PigJet).

### 2) Run schema SQL
In Supabase Dashboard → **SQL Editor**, run:

`supabase/schema.sql`

This creates:
- `properties`
- `vendors`
- `categories`
- `requests`
- `comments`
- `attachments`

And seeds:
- Properties: **Oakville, Collinsville, Pointe 44**
- Vendors: **Jordan, JBR Heating, Lakeside Roofing**

### 3) Create storage bucket
In Supabase Dashboard → **Storage**:
- Create bucket: `maintenance-files`
- Public bucket: **ON** (or keep private + signed URLs if preferred later)

### 4) (Recommended for production) RLS policies
No-login internal app is simplest, but add restricted policies later if needed.

---

## Deploy to Vercel

1. Import GitHub repo in Vercel:
- Repo: `RyanStomel/felfam-maintenance`

2. Add env vars in Vercel Project Settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Deploy.

---

## Add custom domain: maintenance.pigjet.com

In Vercel Project → **Settings → Domains**:
1. Add domain: `maintenance.pigjet.com`
2. In your DNS provider, add the record Vercel gives you (usually CNAME)
3. Wait for verification + SSL issuance

---

## Future enhancements (optional)

- Twilio SMS notifications on create/close/status changes
- Basic auth or shared PIN gate
- Monthly cost rollups by property
- Invoice OCR / receipt extraction
