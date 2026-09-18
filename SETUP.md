# V Marketing Setup

## Start the project

```powershell
npm install
npm start
```

Open `http://localhost:5000` for the website and `http://localhost:5000/admin/login.html` for the admin panel.

## Supabase one-time setup

1. Open the Supabase project connected by `SUPABASE_URL`.
2. Open **SQL Editor** and create a new query.
3. Copy and run the contents of `supabase/schema.sql`.
4. Check `http://localhost:5000/api/setup-status`; `inquiriesTableReady` must be `true`.

The server uses `SUPABASE_SECRET_KEY` only on the backend. Never expose that key in frontend files.

## Admin credentials

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. These values are used by `POST /api/admin/login`.
