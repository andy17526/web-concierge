insert into providers (code, name, email, phone, type)
values
  ('prov-villas-a', 'Ibiza Villas Collection', 'operations@vedara.eu', '+34 600 000 101', 'villa'),
  ('prov-yachts-a', 'Blue Marina Charters', 'operations@vedara.eu', '+34 600 000 102', 'yacht'),
  ('prov-water-a', 'Aqua Sports Ibiza', 'operations@vedara.eu', '+34 600 000 103', 'watersport'),
  ('prov-concierge-a', 'Vedara Concierge Desk', 'operations@vedara.eu', '+34 600 000 104', 'concierge')
on conflict (code) do nothing;

insert into products (slug, name, category)
values
  ('villa1', 'Villa Tramontana', 'villa'),
  ('villa2', 'Villa Sol Naciente', 'villa'),
  ('villa3', 'Villa Cala Nova', 'villa'),
  ('yacht1', 'Sunseeker Manhattan 75', 'yacht'),
  ('yacht2', 'Azimut Grande 27', 'yacht'),
  ('watersport1', 'Jet Ski Experience', 'watersport'),
  ('watersport2', 'Flyboard and Parasailing', 'watersport'),
  ('concierge-chef', 'Private Chef Service', 'concierge'),
  ('concierge-driver', '24/7 Driver Service', 'concierge'),
  ('concierge-club', 'Club Access Service', 'concierge'),
  ('concierge-security', 'Personal Security Service', 'concierge')
on conflict (slug) do nothing;

insert into product_provider_assignments (product_id, provider_id, is_primary, active)
select p.id, v.id, true, true
from products p
join providers v on (
  (p.category = 'villa' and v.code = 'prov-villas-a') or
  (p.category = 'yacht' and v.code = 'prov-yachts-a') or
  (p.category = 'watersport' and v.code = 'prov-water-a') or
  (p.category = 'concierge' and v.code = 'prov-concierge-a')
)
on conflict (product_id, provider_id) do update
set is_primary = excluded.is_primary,
    active = excluded.active;
