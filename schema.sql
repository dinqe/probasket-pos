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

-- 4. Settings Table (Stores Admin Password and Worker Passcode)
create table if not exists settings (
  key text primary key,
  value text not null
);

-- 5. Seed initial settings
insert into settings (key, value)
values 
  ('admin_password', 'gym123'),
  ('worker_passcode', '1234')
on conflict (key) do nothing;

-- 6. Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table settings enable row level security;

-- 7. Secure SQL Helper function to read settings bypassing RLS
create or replace function get_setting_value(setting_key text)
returns text
security definer
language sql
as $$
  select value from settings where key = setting_key;
$$;

-- 8. Define CRUD Policies with Header-based authentication

-- Settings policies
create policy "Secure settings select" on settings for select
using (
  (key = 'admin_password' and get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')) or
  (key = 'worker_passcode' and (
    get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
    get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
  ))
);

create policy "Secure settings modification" on settings for all
using (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
)
with check (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

-- Products policies
create policy "Secure products select" on products for select
using (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure products insert" on products for insert
with check (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure products update" on products for update
using (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
)
with check (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure products delete" on products for delete
using (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

-- Trigger function to verify that workers can only update the stock level
create or replace function check_product_update()
returns trigger as $$
begin
  if (current_user in ('anon', 'authenticated')) then
    if (
      current_setting('request.headers', true) is null or
      current_setting('request.headers', true) = '' or
      current_setting('request.headers', true)::json->>'x-admin-password' is null or 
      get_setting_value('admin_password') != (current_setting('request.headers', true)::json->>'x-admin-password')
    ) then
      if (
        old.name != new.name or 
        old.category != new.category or 
        old.type != new.type or 
        old.price != new.price or 
        old.variants is distinct from new.variants or 
        old.image is distinct from new.image or 
        old.is_favorite != new.is_favorite
      ) then
        raise exception 'Only administrators can modify product details (name, category, price, variants, image).';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace trigger enforce_product_update_rules
before update on products
for each row
execute function check_product_update();

-- Categories policies
create policy "Secure categories select" on categories for select
using (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure categories modification" on categories for all
using (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
)
with check (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

-- Sales policies
create policy "Secure sales select" on sales for select
using (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure sales insert" on sales for insert
with check (
  get_setting_value('worker_passcode') = (current_setting('request.headers', true)::json->>'x-worker-passcode') or
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);

create policy "Secure sales modification" on sales for all
using (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
)
with check (
  get_setting_value('admin_password') = (current_setting('request.headers', true)::json->>'x-admin-password')
);
