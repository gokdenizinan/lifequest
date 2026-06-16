# LifeQuest AI — Interactive Life Game System

A self-contained static website that turns a life assessment into a game dashboard, quests, stats, coaching check-ins, and progress tracking.

## How to run locally

Open `index.html` in a browser.

## How saving works

The app always saves locally first using browser `localStorage`.

This version also includes the most basic Supabase cloud save:

- email/password account
- one database table
- one JSON save row per user
- auto-save to cloud after interactions
- manual **Save to cloud now** and **Load from cloud** buttons
- export/import JSON backup

## Deploy to Vercel

Upload these files to GitHub, then import the repo in Vercel:

```text
index.html
styles.css
app.js
supabase-config.js
README.md
```

Vercel settings:

```text
Framework Preset: Other
Build Command: leave empty
Output Directory: .
Install Command: leave empty
```

## Supabase setup

1. Create a Supabase project.
2. Go to **SQL Editor**.
3. Run this SQL once:

```sql
create table if not exists public.lifequest_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lifequest_saves enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.lifequest_saves to authenticated;

create policy "Users can read their own LifeQuest save"
on public.lifequest_saves
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own LifeQuest save"
on public.lifequest_saves
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own LifeQuest save"
on public.lifequest_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own LifeQuest save"
on public.lifequest_saves
for delete
to authenticated
using (auth.uid() = user_id);
```

4. In Supabase, copy your **Project URL** and **Publishable key** or legacy **anon key**.
5. Open the website, go to **Cloud Save**, paste both values, and tap **Save cloud settings**.
6. Create an account or sign in.
7. Use the app normally. It will save locally first and sync to cloud when signed in.

## Optional config file method

Instead of pasting keys in the app, you can edit `supabase-config.js`:

```js
window.LIFEQUEST_SUPABASE_URL = "https://your-project.supabase.co";
window.LIFEQUEST_SUPABASE_PUBLISHABLE_KEY = "your-public-key";
```

Do not put Supabase service role keys in this file.

## Important limitations

This is the most basic useful cloud version. It does not include advanced conflict resolution. If you edit from two devices at the same time, the most recent save can overwrite the other one. Use **Export save file** before big changes.
