async function supabaseRequest(path) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Database not configured');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase error (${response.status}): ${details}`);
  }

  const raw = await response.text();
  if (!raw) return [];
  return JSON.parse(raw);
}

const FALLBACK_LISTINGS = [
  { id: 101, slug: 'villa1', title: 'Villa Tramontana', category: 'villa', zone: 'Es Cubells', latitude: 38.8721, longitude: 1.2701, price_from: 8500, price_unit: 'night', max_guests: 12, car_class: null, featured_image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=85', provider_id: 1 },
  { id: 102, slug: 'villa2', title: 'Villa Sol Naciente', category: 'villa', zone: 'Santa Eularia', latitude: 38.9852, longitude: 1.5330, price_from: 5200, price_unit: 'night', max_guests: 8, car_class: null, featured_image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=85', provider_id: 1 },
  { id: 103, slug: 'villa3', title: 'Villa Cala Nova', category: 'villa', zone: 'San Juan', latitude: 39.0780, longitude: 1.5127, price_from: 12000, price_unit: 'night', max_guests: 16, car_class: null, featured_image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=85', provider_id: 1 },
  { id: 104, slug: 'yacht1', title: 'Sunseeker Manhattan 75', category: 'yacht', zone: 'Ibiza Marina', latitude: 38.9092, longitude: 1.4465, price_from: 2800, price_unit: 'day', max_guests: 8, car_class: null, featured_image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=900&q=85', provider_id: 2 },
  { id: 105, slug: 'yacht2', title: 'Azimut Grande 27', category: 'yacht', zone: 'Ibiza Marina', latitude: 38.9101, longitude: 1.4420, price_from: 4500, price_unit: 'day', max_guests: 10, car_class: null, featured_image: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=900&q=85', provider_id: 2 },
  { id: 106, slug: 'watersport1', title: 'Jet Ski Experience', category: 'watersport', zone: 'Playa den Bossa', latitude: 38.8842, longitude: 1.4063, price_from: 180, price_unit: 'hour', max_guests: 2, car_class: null, featured_image: 'https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=900&q=85', provider_id: 3 },
  { id: 107, slug: 'watersport2', title: 'Flyboard and Parasailing', category: 'watersport', zone: 'Talamanca Bay', latitude: 38.9212, longitude: 1.4606, price_from: 120, price_unit: 'hour', max_guests: 2, car_class: null, featured_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=85', provider_id: 3 },
  { id: 108, slug: 'concierge-full', title: 'Full Concierge 24/7', category: 'concierge_package', zone: 'Island-wide', latitude: 38.9067, longitude: 1.4206, price_from: 3500, price_unit: 'package', max_guests: 10, car_class: null, featured_image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=900&q=85', provider_id: 4 },
  { id: 109, slug: 'concierge-chef', title: 'Private Chef Service', category: 'concierge_individual', zone: 'Island-wide', latitude: 38.9067, longitude: 1.4206, price_from: 900, price_unit: 'day', max_guests: 12, car_class: null, featured_image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85', provider_id: 4 },
  { id: 110, slug: 'concierge-club', title: 'Club Access Service', category: 'concierge_individual', zone: 'Ibiza Town', latitude: 38.9079, longitude: 1.4329, price_from: 600, price_unit: 'package', max_guests: 8, car_class: null, featured_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=85', provider_id: 4 },
  { id: 114, slug: 'concierge-driver', title: '24/7 Driver Service', category: 'concierge_individual', zone: 'Island-wide', latitude: 38.9067, longitude: 1.4206, price_from: 450, price_unit: 'day', max_guests: 6, car_class: null, featured_image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=900&q=85', provider_id: 4 },
  { id: 115, slug: 'concierge-security', title: 'Personal Security Service', category: 'concierge_individual', zone: 'Island-wide', latitude: 38.9067, longitude: 1.4206, price_from: 1200, price_unit: 'day', max_guests: 6, car_class: null, featured_image: 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=900&q=85', provider_id: 4 },
  { id: 111, slug: 'car1', title: 'Mercedes C-Class', category: 'car_rental', zone: 'Airport pickup', latitude: 38.8759, longitude: 1.3731, price_from: 180, price_unit: 'day', max_guests: 5, car_class: 'standard', featured_image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=900&q=85', provider_id: 5 },
  { id: 112, slug: 'car2', title: 'BMW X5', category: 'car_rental', zone: 'Airport pickup', latitude: 38.8759, longitude: 1.3731, price_from: 260, price_unit: 'day', max_guests: 5, car_class: 'premium', featured_image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&q=85', provider_id: 5 },
  { id: 113, slug: 'car3', title: 'Lamborghini Huracan Spyder', category: 'car_rental', zone: 'Airport pickup', latitude: 38.8759, longitude: 1.3731, price_from: 1450, price_unit: 'day', max_guests: 2, car_class: 'luxury', featured_image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=900&q=85', provider_id: 5 }
];

function filterFallbackRows(rows, filters) {
  return rows.filter(row => {
    if (filters.activity && filters.activity !== 'all') {
      if (filters.activity === 'concierge') {
        if (filters.conciergeMode === 'package' && row.category !== 'concierge_package') return false;
        if (filters.conciergeMode === 'individual' && row.category !== 'concierge_individual') return false;
        if (filters.conciergeMode === 'all' && !row.category.startsWith('concierge_')) return false;
        if (filters.conciergeMode === 'individual' && filters.conciergeService && filters.conciergeService !== 'all') {
          if (mapConciergeServiceBySlug(row.slug) !== filters.conciergeService) return false;
        }
      } else if (row.category !== filters.activity) {
        return false;
      }
    }

    if (filters.activity === 'car_rental' && filters.carClass && filters.carClass !== 'all' && row.car_class !== filters.carClass) {
      return false;
    }

    if (filters.guests && row.max_guests < Number(filters.guests)) return false;

    if (Number.isFinite(filters.north) && row.latitude > filters.north) return false;
    if (Number.isFinite(filters.south) && row.latitude < filters.south) return false;
    if (Number.isFinite(filters.east) && row.longitude > filters.east) return false;
    if (Number.isFinite(filters.west) && row.longitude < filters.west) return false;

    return true;
  }).sort((a, b) => Number(a.price_from) - Number(b.price_from));
}

function buildCategoryFilter(activity, conciergeMode) {
  if (!activity || activity === 'all') return '';
  if (activity === 'concierge') {
    if (conciergeMode === 'package') return '&category=eq.concierge_package';
    if (conciergeMode === 'individual') return '&category=eq.concierge_individual';
    return '&category=in.(concierge_package,concierge_individual)';
  }
  return `&category=eq.${encodeURIComponent(activity)}`;
}

function normalizeCarClass(row) {
  if (row.car_class) return row.car_class;
  if (row.slug === 'car1') return 'standard';
  if (row.slug === 'car2') return 'premium';
  if (row.slug === 'car3') return 'luxury';
  return null;
}

function mapConciergeServiceBySlug(slug) {
  if (slug === 'concierge-chef') return 'chef';
  if (slug === 'concierge-driver') return 'driver';
  if (slug === 'concierge-club') return 'club';
  if (slug === 'concierge-security') return 'security';
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    checkIn,
    checkOut,
    activity = 'all',
    conciergeMode = 'all',
    conciergeService = 'all',
    carClass = 'all',
    guests,
    north,
    south,
    east,
    west
  } = req.query;

  try {
    let availabilityFilter = '';
    if (checkIn && checkOut) {
      const availabilityRows = await supabaseRequest(
        `listing_availability?select=listing_id&available_from=lte.${checkIn}&available_to=gte.${checkOut}`
      );
      const ids = [...new Set(availabilityRows.map(row => row.listing_id).filter(Boolean))];
      if (!ids.length) {
        return res.status(200).json({ ok: true, count: 0, data: [] });
      }
      availabilityFilter = `&id=in.(${ids.join(',')})`;
    }

    const boundsFilter = [
      Number.isFinite(Number(north)) ? `&latitude=lte.${Number(north)}` : '',
      Number.isFinite(Number(south)) ? `&latitude=gte.${Number(south)}` : '',
      Number.isFinite(Number(east)) ? `&longitude=lte.${Number(east)}` : '',
      Number.isFinite(Number(west)) ? `&longitude=gte.${Number(west)}` : ''
    ].join('');

    const guestsFilter = Number.isFinite(Number(guests)) ? `&max_guests=gte.${Number(guests)}` : '';
    const categoryFilter = buildCategoryFilter(activity, conciergeMode);
    const carClassFilter = '';

    const path = `listings?select=id,slug,title,category,zone,latitude,longitude,price_from,price_unit,max_guests,car_class,featured_image,provider_id&active=eq.true${availabilityFilter}${categoryFilter}${carClassFilter}${guestsFilter}${boundsFilter}&order=price_from.asc&limit=120`;
    const data = await supabaseRequest(path);
    const normalized = data.map(row => ({ ...row, car_class: normalizeCarClass(row) }));
    let filtered = activity === 'car_rental' && carClass !== 'all'
      ? normalized.filter(row => row.car_class === carClass)
      : normalized;

    if (activity === 'concierge' && conciergeMode === 'individual' && conciergeService !== 'all') {
      filtered = filtered.filter(row => mapConciergeServiceBySlug(row.slug) === conciergeService);
    }

    if (activity === 'concierge' && conciergeMode === 'individual' && conciergeService !== 'all' && filtered.length === 0) {
      const fallbackServiceRows = filterFallbackRows(FALLBACK_LISTINGS, {
        activity,
        conciergeMode,
        conciergeService,
        carClass,
        guests,
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west)
      });
      if (fallbackServiceRows.length) {
        return res.status(200).json({ ok: true, count: fallbackServiceRows.length, data: fallbackServiceRows, source: 'service-fallback' });
      }
    }

    return res.status(200).json({ ok: true, count: filtered.length, data: filtered });
  } catch (error) {
    if (String(error.message).includes("Could not find the table 'public.listings'")) {
      const fallback = filterFallbackRows(FALLBACK_LISTINGS, {
        activity,
        conciergeMode,
        conciergeService,
        carClass,
        guests,
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west)
      });
      return res.status(200).json({ ok: true, count: fallback.length, data: fallback, source: 'fallback' });
    }
    return res.status(500).json({ error: 'Search failed', details: error.message });
  }
};
