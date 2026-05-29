-- ProBasket Database Schema
-- Run this script in the Supabase SQL Editor to set up the POS cloud tables.

-- 1. Categories Table
create table if not exists categories (
  id bigint generated always as identity primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products Table
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  type text not null check (type in ('simple', 'variable')),
  price numeric not null,
  stock integer not null,
  variants jsonb, -- Array of { name, image } objects
  image text,     -- Emoji or Base64 compressed image string
  is_favorite boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Sales Transactions Table
create table if not exists sales (
  id text primary key, -- e.g. TX-178000000
  timestamp timestamp with time zone not null,
  items jsonb not null, -- Array of sold items with variants/prices/qtys
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  quantity integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Settings Table (Stores Admin Password)
create table if not exists settings (
  key text primary key, -- e.g. 'admin_password'
  value text not null
);

-- 5. Seed initial settings
insert into settings (key, value)
values ('admin_password', 'gym123')
on conflict (key) do nothing;

-- 6. Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table settings enable row level security;

-- 7. Define CRUD Policies for Anonymous Client POS access
create policy "Allow public categories CRUD" on categories for all using (true) with check (true);
create policy "Allow public products CRUD" on products for all using (true) with check (true);
create policy "Allow public sales CRUD" on sales for all using (true) with check (true);
create policy "Allow public settings CRUD" on settings for all using (true) with check (true);
