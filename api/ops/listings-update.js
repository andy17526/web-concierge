const {
  requireOpsAuth,
  supabaseRequest,
  logAudit,
  getClientIp
} = require('../../lib/ops-auth');
const { validateListingInput, categoryToActivity } = require('../../lib/ops-listings');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor'], csrf: true });
    if (!auth) return;

    const id = Number.parseInt(req.body?.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Listing id is required' });
    }

    const currentRows = await supabaseRequest(`listings?select=*&id=eq.${id}&limit=1`);
    const current = currentRows && currentRows[0] ? currentRows[0] : null;
    if (!current) return res.status(404).json({ error: 'Listing not found' });

    const merged = {
      ...current,
      ...req.body,
      providerId: req.body.providerId ?? current.provider_id,
      priceFrom: req.body.priceFrom ?? current.price_from,
      priceUnit: req.body.priceUnit ?? current.price_unit,
      maxGuests: req.body.maxGuests ?? current.max_guests,
      featuredImage: req.body.featuredImage ?? current.featured_image,
      carClass: req.body.carClass ?? current.car_class,
      serviceCode: req.body.serviceCode ?? current.service_code,
      isHomeEligible: req.body.isHomeEligible ?? current.is_home_eligible,
      galleryImages: req.body.galleryImages ?? current.gallery_images,
      slug: req.body.slug ?? current.slug,
      title: req.body.title ?? current.title,
      zone: req.body.zone ?? current.zone,
      summary: req.body.summary ?? current.summary,
      description: req.body.description ?? current.description,
      active: req.body.active ?? current.active,
      category: req.body.category ?? current.category
    };

    const parsed = validateListingInput(merged, 'update');
    if (parsed.errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.errors });
    }

    const { listingRow, availability } = parsed.data;
    await supabaseRequest(`listings?id=eq.${id}`, {
      method: 'PATCH',
      body: listingRow,
      prefer: 'return=minimal'
    });

    if (availability) {
      await supabaseRequest(`listing_availability?listing_id=eq.${id}`, {
        method: 'DELETE',
        prefer: 'return=minimal'
      });
      await supabaseRequest('listing_availability', {
        method: 'POST',
        body: { listing_id: id, ...availability },
        prefer: 'return=minimal'
      });
    }

    await supabaseRequest(`listing_activities?listing_id=eq.${id}`, {
      method: 'DELETE',
      prefer: 'return=minimal'
    });
    await supabaseRequest('listing_activities', {
      method: 'POST',
      body: { listing_id: id, activity_code: categoryToActivity(listingRow.category) },
      prefer: 'return=minimal'
    });

    await logAudit({
      userId: auth.session.user.id,
      action: 'update',
      entity: 'listing',
      entityId: id,
      beforeData: {
        slug: current.slug,
        title: current.title,
        category: current.category,
        active: current.active
      },
      afterData: {
        slug: listingRow.slug,
        title: listingRow.title,
        category: listingRow.category,
        active: listingRow.active
      },
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({ ok: true, id });
  } catch (error) {
    return res.status(500).json({ error: 'Could not update listing', details: error.message });
  }
};
