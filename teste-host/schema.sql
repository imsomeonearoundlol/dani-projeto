create table if not exists products (
  id uuid primary key,
  code text unique not null, -- código de identificação (sem SKU)
  name text not null,
  unit text default 'un',
  min_stock numeric default 0,
  base_cost numeric default 0,
  created_at timestamptz default now()
);

create table if not exists moves (
  id uuid primary key,
  product_id uuid not null references products(id) on delete cascade,
  type text not null check (type in ('IN','OUT')),
  qty numeric not null,
  unit_price numeric default 0,
  date_iso timestamptz not null,
  note text,
  created_at timestamptz default now()
);

create index if not exists idx_moves_product_date on moves(product_id, date_iso);
