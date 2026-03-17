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
create index if not exists idx_lead_interests_lead_id on lead_interests(lead_id);
create index if not exists idx_lead_interests_product_id on lead_interests(product_id);
create index if not exists idx_lead_interests_provider_id on lead_interests(provider_id);
create index if not exists idx_products_slug on products(slug);

create table if not exists listings (
  id bigserial primary key,
  slug text not null unique,
  title text not null,
  category text not null check (category in ('villa', 'yacht', 'watersport', 'concierge_package', 'concierge_individual', 'car_rental')),
  zone text,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  price_from numeric(12, 2) not null,
  price_unit text not null default 'day' check (price_unit in ('night', 'day', 'hour', 'package')),
  max_guests integer not null default 2,
  car_class text check (car_class in ('standard', 'premium', 'luxury')),
  transmission text,
  fuel_type text,
  provider_id bigint references providers(id) on delete set null,
  featured_image text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists listing_availability (
  id bigserial primary key,
  listing_id bigint not null references listings(id) on delete cascade,
  available_from date not null,
  available_to date not null,
  min_stay integer not null default 1,
  created_at timestamptz not null default now(),
  unique(listing_id, available_from, available_to),
  check (available_to >= available_from)
);

create table if not exists listing_activities (
  id bigserial primary key,
  listing_id bigint not null references listings(id) on delete cascade,
  activity_code text not null,
  unique(listing_id, activity_code)
);

create index if not exists idx_listings_category on listings(category);
create index if not exists idx_listings_active on listings(active);
create index if not exists idx_listings_price on listings(price_from);
create index if not exists idx_listings_geo on listings(latitude, longitude);
create index if not exists idx_listings_provider on listings(provider_id);
create index if not exists idx_listing_availability_dates on listing_availability(available_from, available_to);
create index if not exists idx_listing_activities_code on listing_activities(activity_code);

alter table leads add column if not exists requested_listing_slug text;
