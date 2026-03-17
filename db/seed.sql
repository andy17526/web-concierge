insert into providers (code, name, email, phone, type)
values
  ('prov-villas-a', 'Ibiza Villas Collection', 'operations@vedara.eu', '+34 600 000 101', 'villa'),
  ('prov-yachts-a', 'Blue Marina Charters', 'operations@vedara.eu', '+34 600 000 102', 'yacht'),
  ('prov-water-a', 'Aqua Sports Ibiza', 'operations@vedara.eu', '+34 600 000 103', 'watersport'),
  ('prov-concierge-a', 'Vedara Concierge Desk', 'operations@vedara.eu', '+34 600 000 104', 'concierge'),
  ('prov-cars-a', 'Ibiza Drive Selection', 'operations@vedara.eu', '+34 600 000 105', 'car_rental')
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
  ('concierge-full', 'Concierge Full Package', 'concierge'),
  ('concierge-chef', 'Private Chef Service', 'concierge'),
  ('concierge-driver', '24/7 Driver Service', 'concierge'),
  ('concierge-club', 'Club Access Service', 'concierge'),
  ('concierge-security', 'Personal Security Service', 'concierge'),
  ('car1', 'Mercedes C-Class', 'car_rental'),
  ('car2', 'BMW X5', 'car_rental'),
  ('car3', 'Lamborghini Huracan Spyder', 'car_rental')
on conflict (slug) do nothing;

insert into product_provider_assignments (product_id, provider_id, is_primary, active)
select p.id, v.id, true, true
from products p
join providers v on (
  (p.category = 'villa' and v.code = 'prov-villas-a') or
  (p.category = 'yacht' and v.code = 'prov-yachts-a') or
  (p.category = 'watersport' and v.code = 'prov-water-a') or
  (p.category = 'concierge' and v.code = 'prov-concierge-a') or
  (p.category = 'car_rental' and v.code = 'prov-cars-a')
)
on conflict (product_id, provider_id) do update
set is_primary = excluded.is_primary,
    active = excluded.active;

insert into listings (slug, title, category, zone, latitude, longitude, price_from, price_unit, max_guests, car_class, provider_id, featured_image)
select x.slug, x.title, x.category, x.zone, x.latitude, x.longitude, x.price_from, x.price_unit, x.max_guests, x.car_class, p.id, x.featured_image
from (
  values
    ('villa1', 'Villa Tramontana', 'villa', 'Es Cubells', 38.8721, 1.2701, 8500, 'night', 12, null, 'prov-villas-a', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85'),
    ('villa2', 'Villa Sol Naciente', 'villa', 'Santa Eularia', 38.9852, 1.5330, 5200, 'night', 8, null, 'prov-villas-a', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=85'),
    ('villa3', 'Villa Cala Nova', 'villa', 'San Juan', 39.0780, 1.5127, 12000, 'night', 16, null, 'prov-villas-a', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85'),
    ('yacht1', 'Sunseeker Manhattan 75', 'yacht', 'Ibiza Marina', 38.9092, 1.4465, 2800, 'day', 8, null, 'prov-yachts-a', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=900&q=85'),
    ('yacht2', 'Azimut Grande 27', 'yacht', 'Ibiza Marina', 38.9101, 1.4420, 4500, 'day', 10, null, 'prov-yachts-a', 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=900&q=85'),
    ('watersport1', 'Jet Ski Experience', 'watersport', 'Playa den Bossa', 38.8842, 1.4063, 180, 'hour', 2, null, 'prov-water-a', 'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=900&q=85'),
    ('watersport2', 'Flyboard and Parasailing', 'watersport', 'Talamanca Bay', 38.9212, 1.4606, 120, 'hour', 2, null, 'prov-water-a', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=85'),
    ('concierge-full', 'Full Concierge 24/7', 'concierge_package', 'Island-wide', 38.9067, 1.4206, 3500, 'package', 10, null, 'prov-concierge-a', 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=900&q=85'),
    ('concierge-chef', 'Private Chef Service', 'concierge_individual', 'Island-wide', 38.9067, 1.4206, 900, 'day', 12, null, 'prov-concierge-a', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85'),
    ('concierge-club', 'Club Access Service', 'concierge_individual', 'Ibiza Town', 38.9079, 1.4329, 600, 'package', 8, null, 'prov-concierge-a', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=85'),
    ('concierge-driver', '24/7 Driver Service', 'concierge_individual', 'Island-wide', 38.9067, 1.4206, 450, 'day', 6, null, 'prov-concierge-a', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=85'),
    ('concierge-security', 'Personal Security Service', 'concierge_individual', 'Island-wide', 38.9067, 1.4206, 1200, 'day', 6, null, 'prov-concierge-a', 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=900&q=85'),
    ('car1', 'Mercedes C-Class', 'car_rental', 'Airport pickup', 38.8759, 1.3731, 180, 'day', 5, 'standard', 'prov-cars-a', 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=900&q=85'),
    ('car2', 'BMW X5', 'car_rental', 'Airport pickup', 38.8759, 1.3731, 260, 'day', 5, 'premium', 'prov-cars-a', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=85'),
    ('car3', 'Lamborghini Huracan Spyder', 'car_rental', 'Airport pickup', 38.8759, 1.3731, 1450, 'day', 2, 'luxury', 'prov-cars-a', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=85')
) as x(slug, title, category, zone, latitude, longitude, price_from, price_unit, max_guests, car_class, provider_code, featured_image)
join providers p on p.code = x.provider_code
on conflict (slug) do update
set title = excluded.title,
    category = excluded.category,
    zone = excluded.zone,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    price_from = excluded.price_from,
    price_unit = excluded.price_unit,
    max_guests = excluded.max_guests,
    car_class = excluded.car_class,
    provider_id = excluded.provider_id,
    featured_image = excluded.featured_image,
    active = true;

insert into listing_availability (listing_id, available_from, available_to, min_stay)
select l.id, current_date, current_date + interval '180 day', 1
from listings l
on conflict do nothing;

insert into listing_activities (listing_id, activity_code)
select l.id,
  case
    when l.category = 'villa' then 'villa'
    when l.category = 'yacht' then 'yacht'
    when l.category = 'watersport' then 'watersport'
    when l.category like 'concierge_%' then 'concierge'
    when l.category = 'car_rental' then 'car_rental'
    else 'general'
  end
from listings l
on conflict (listing_id, activity_code) do nothing;
