# Optional cloud sync (Supabase)

Local saves stay primary. Cloud sync is opt-in for beta testers who want the same pilot on another device.

When `dist/cloud-config.mjs` has empty `url` / `anonKey`, the Flight menu shows Cloud sync as **not enabled** and nothing phones home.

## 1. Create a Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. **Authentication → Providers → Email**: enable Email. Prefer **OTP / magic link** (passwordless).
3. **Authentication → URL configuration**:
   - Site URL: your Pages origin, e.g. `https://gabetc99.github.io/Farbound/`
   - Redirect URLs: same origin (and `http://localhost:…` if you test locally).
4. Copy **Project URL** and the public **anon** key (Settings → API).

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

1. Flight menu → **Cloud sync** → enter email → **Email sign-in link**.
2. Open the link on the same device, or enter the email OTP code.
3. **Upload pilot** / **Download pilot**. Download always confirms and writes a local checkpoint first.
4. Optional: **Auto-upload when docking** (signed-in only).

Conflict hint compares local `savedAt` to the cloud `updated_at`. Newest wins only when the pilot chooses Upload or Download; nothing overwrites silently.

## 5. Ops notes

- No custom Node backend; Auth + REST only (`dist/cloud-sync.mjs`).
- Clearing site data removes the local session and save; the cloud row remains until the user deletes the Supabase account/row.
- Service worker caches `cloud-config.mjs` / `cloud-sync.mjs` with the release; bump `release.mjs` / `sw.js` after config changes so testers pick up the new keys.
