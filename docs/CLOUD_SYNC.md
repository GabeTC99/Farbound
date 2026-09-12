# Optional cloud sync (Supabase)

Local saves stay primary. Cloud sync is opt-in for beta testers who want the same pilot on another device.

When `dist/cloud-config.mjs` has empty `url` / `anonKey`, the Flight menu shows Cloud sync as **not enabled** and nothing phones home.

## 1. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email**: enable Email with **password** sign-in (Farbound uses email + password so auth stays inside the installed PWA — no magic link that opens Chrome/Gmail outside the app).
3. Optional but recommended for beta: turn on **Confirm email** off / autoconfirm so Create account signs in immediately without sending mail (avoids free-tier email rate limits).
4. **Authentication → URL configuration**:
   - Site URL: your Pages origin, e.g. `https://gabetc99.github.io/Farbound/`
   - Redirect URLs: same origin (and `http://localhost:…` if you test locally). Magicked-link redirects are unused by the password flow but keep them correct for any leftover sessions.
5. Copy **Project URL** and the public **anon** key (Settings → API).

## 2. Database table + RLS

Run in the SQL editor:

```sql
create table if not exists public.pilots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  pilot jsonb not null,
  updated_at timestamptz not null default now(),
  playtime double precision default 0,
  credits double precision default 0,
  system integer default 0,
  ship text
);

alter table public.pilots enable row level security;

create policy "pilots_select_own"
  on public.pilots for select
  using (auth.uid() = user_id);

create policy "pilots_insert_own"
  on public.pilots for insert
  with check (auth.uid() = user_id);

create policy "pilots_update_own"
  on public.pilots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "pilots_delete_own"
  on public.pilots for delete
  using (auth.uid() = user_id);
```

The anon key is safe to ship in the client; RLS keeps each row private to that user.

## 3. Enable in the build

Edit `dist/cloud-config.mjs`:

```js
export const CLOUD={
 url:'https://YOUR_PROJECT.supabase.co',
 anonKey:'YOUR_ANON_KEY'
};
```

Commit that file only if you are comfortable publishing the public anon key (normal for Supabase web apps). Leave blank on forks that should stay local-only.

## 4. Player flow

1. Flight menu → **Cloud sync** → email + password (6+ characters).
2. **Create account** once, or **Sign in** on another device. No email link — stays in the installed app.
3. **Upload pilot** / **Download pilot**. Download always confirms and writes a local checkpoint first. Confirm text includes module count and faction standing so you can verify the cloud copy before replacing local.
4. Optional: **Auto-upload when docking** (signed-in only). Autosync **will not** overwrite a cloud pilot that has more modules, faction reputation, or company standing than the local save — use manual **Upload pilot** if you really intend to replace it.

If you previously used a magic-link-only account (no password), **Create account** with a new email, or set a password in the Supabase dashboard / Auth users UI. Sign-in with a passwordless user will fail with a clear wrong-credentials hint.

Conflict hint compares local `savedAt` to the cloud `updated_at`. Newest wins only when the pilot chooses Upload or Download; autosync also refuses a “thinner” overwrite.

## 5. Ops notes

- No custom Node backend; Auth + REST only (`dist/cloud-sync.mjs`).
- Password auth avoids free-tier **email rate exceeded** (built-in SMTP is tiny) and keeps the session inside the PWA.
- Upload/download run the full save through `validateSave` and abort if modules, loadouts, companies, or reputation would be stripped.
- Clearing site data removes the local session and save; the cloud row remains until the user deletes the Supabase account/row.
- Service worker caches `cloud-config.mjs` / `cloud-sync.mjs` with the release; bump `release.mjs` / `sw.js` after config changes so testers pick up the new keys.
