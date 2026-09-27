-- Run once in Supabase SQL Editor. Public visitors only reach the server routes.
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 reference uuid not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 design_name text not null,
 customer_name text not null,
 email text,
 phone text,
 quantity integer not null check (quantity between 1 and 500),
 needed_by date,
 notes text,
 design jsonb not null,
 preview_url text not null,
 sanity_asset_id text not null,
 status text not null default 'new' check(status in ('new','reviewing','quoted','in_production','ready','delivered','cancelled')),
 internal_notes text not null default '',
 notification_status text not null default 'pending',
 constraint contact_required check (nullif(email,'') is not null or nullif(phone,'') is not null)
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status,created_at desc);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
-- Keep the service role key on the server only. Do not create public read policies.
