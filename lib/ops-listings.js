const { validateImageUrl, slugify, approximateCoords } = require('./ops-auth');

const ALLOWED_CATEGORIES = new Set([
  'villa',
  'yacht',
  'watersport',
  'concierge_package',
  'concierge_individual',
  'car_rental'
]);

const ALLOWED_UNITS = new Set(['night', 'day', 'hour', 'package']);
const ALLOWED_CAR_CLASS = new Set(['standard', 'premium', 'luxury', '']);
const ALLOWED_SERVICE_CODES = new Set(['', 'chef', 'driver', 'club', 'security']);

function toNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return fallback;
}

function normalizeGallery(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value)
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean);
}

function categoryToActivity(category) {
  if (category === 'villa') return 'villa';
  if (category === 'yacht') return 'yacht';
  if (category === 'watersport') return 'watersport';
  if (category === 'car_rental') return 'car_rental';
  return 'concierge';
}

function validateListingInput(payload, mode = 'create') {
  const errors = [];
  const category = String(payload.category || '').trim();
  if (!ALLOWED_CATEGORIES.has(category)) errors.push('Invalid category');

  const title = String(payload.title || '').trim();
  if (!title) errors.push('Title is required');

  const zone = String(payload.zone || '').trim();
  if (!zone) errors.push('Zone is required');

  const providerId = toNumber(payload.providerId, null);
  if (!providerId) errors.push('Provider is required');

  const priceFrom = toNumber(payload.priceFrom, null);
  if (!priceFrom || priceFrom <= 0) errors.push('Price must be greater than 0');

  const priceUnit = String(payload.priceUnit || '').trim();
  if (!ALLOWED_UNITS.has(priceUnit)) errors.push('Invalid price unit');

  const maxGuests = toNumber(payload.maxGuests, null);
  if (!maxGuests || maxGuests <= 0) errors.push('Max guests must be greater than 0');

  const featuredImage = String(payload.featuredImage || '').trim();
  if (!validateImageUrl(featuredImage)) errors.push('Featured image must be a valid URL');

  const gallery = normalizeGallery(payload.galleryImages);
  if (gallery.some(url => !validateImageUrl(url))) errors.push('All gallery image URLs must be valid');

  const carClass = String(payload.carClass || '').trim();
  if (!ALLOWED_CAR_CLASS.has(carClass)) errors.push('Invalid car class');

  const serviceCode = String(payload.serviceCode || '').trim();
  if (!ALLOWED_SERVICE_CODES.has(serviceCode)) errors.push('Invalid service code');
  if (category === 'concierge_individual' && !serviceCode) errors.push('Service code is required for concierge individual');

  const bedrooms = toNumber(payload.bedrooms, null);
  const bathrooms = toNumber(payload.bathrooms, null);
  const cabins = toNumber(payload.cabins, null);
  const seats = toNumber(payload.seats, null);
  const transmission = String(payload.transmission || '').trim();
  const fuelType = String(payload.fuelType || '').trim();

  if (category === 'villa') {
    if (!bedrooms || bedrooms <= 0) errors.push('Bedrooms are required for villas');
    if (!bathrooms || bathrooms <= 0) errors.push('Bathrooms are required for villas');
  }

  if (category === 'yacht') {
    if (!cabins || cabins <= 0) errors.push('Cabins are required for yachts');
  }

  if (category === 'car_rental') {
    if (!carClass) errors.push('Car class is required for car rental');
    if (!seats || seats <= 0) errors.push('Seats are required for car rental');
    if (!transmission) errors.push('Transmission is required for car rental');
    if (!fuelType) errors.push('Fuel type is required for car rental');
  }

  const slug = slugify(payload.slug || title);
  if (!slug) errors.push('Slug could not be generated');

  const summary = String(payload.summary || '').trim();
  const description = String(payload.description || '').trim();

  const availabilityFrom = payload.availableFrom ? String(payload.availableFrom) : null;
  const availabilityTo = payload.availableTo ? String(payload.availableTo) : null;
  const minStay = toNumber(payload.minStay, 1);

  if ((availabilityFrom && !availabilityTo) || (!availabilityFrom && availabilityTo)) {
    errors.push('Both availability dates are required together');
  }

  const details = {
    bedrooms,
    bathrooms,
    cabins,
    seats,
    transmission: transmission || null,
    fuelType: fuelType || null,
    amenities: normalizeGallery(payload.amenities).slice(0, 20)
  };

  const coords = approximateCoords(zone, `${slug}:${zone}`);

  const listingRow = {
    slug,
    title,
    category,
    zone,
    latitude: coords.latitude,
    longitude: coords.longitude,
    price_from: priceFrom,
    price_unit: priceUnit,
    max_guests: maxGuests,
    car_class: carClass || null,
    transmission: details.transmission,
    fuel_type: details.fuelType,
    provider_id: providerId,
    featured_image: featuredImage,
    summary: summary || null,
    description: description || null,
    details_json: details,
    gallery_images: gallery,
    service_code: serviceCode || null,
    is_home_eligible: toBoolean(payload.isHomeEligible, true),
    active: toBoolean(payload.active, true),
    deleted_at: null,
    updated_at: new Date().toISOString()
  };

  if (mode === 'create') listingRow.created_at = new Date().toISOString();

  return {
    errors,
    data: {
      listingRow,
      availability: availabilityFrom && availabilityTo
        ? {
          available_from: availabilityFrom,
          available_to: availabilityTo,
          min_stay: minStay
        }
        : null,
      activityCode: categoryToActivity(category)
    }
  };
}

module.exports = {
  validateListingInput,
  categoryToActivity
};
