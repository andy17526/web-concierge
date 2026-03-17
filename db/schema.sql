create table if not exists providers (
  id bigserial primary key,
  code text not null unique,
  name text not null,
  email text,
  phone text,
  type text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_provider_assignments (
  id bigserial primary key,
  product_id bigint not null references products(id) on delete cascade,
  provider_id bigint not null references providers(id) on delete restrict,
  is_primary boolean not null default false,
  active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique(product_id, provider_id)
);

create unique index if not exists idx_primary_provider_per_product
  on product_provider_assignments(product_id)
  where is_primary = true and active = true;

create table if not exists leads (
  id bigserial primary key,
  full_name text not null,
  email text not null,
  phone text,
  country text,
  arrival date,
  departure date,
  guests text,
  budget text,
  special_requests text,
  source text not null default 'website',
  requested_product_slug text,
  created_at timestamptz not null default now()
);

create table if not exists lead_interests (
  id bigserial primary key,
  lead_id bigint not null references leads(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  provider_id bigint references providers(id) on delete set null,
  service_code text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'lost')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created_at on leads(created_at desc);
create index if not exists idx_lead_interests_status on lead_interests(status);
create index if not exists idx_lead_interests_created_at on lead_interests(created_at desc);
create index if not exists idx_products_slug on products(slug);
