const {
  requireOpsAuth,
  supabaseRequest,
  logAudit,
  getClientIp
} = require('../../lib/ops-auth');
const { validateListingInput } = require('../../lib/ops-listings');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor', 'viewer'] });
      if (!auth) return;

      const includeInactive = String(req.query.includeInactive || 'false') === 'true';
      const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 100, 1), 500);
      const base = 'listings?select=id,slug,title,category,zone,price_from,price_unit,max_guests,car_class,service_code,active,is_home_eligible,provider_id,updated_at,deleted_at';
      const filter = includeInactive ? '' : '&active=eq.true&deleted_at=is.null';
      const rows = await supabaseRequest(`${base}${filter}&order=updated_at.desc&limit=${limit}`);
      return res.status(200).json({ ok: true, data: rows || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Could not fetch listings', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor'], csrf: true });
      if (!auth) return;

      const parsed = validateListingInput(req.body || {}, 'create');
      if (parsed.errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.errors });
      }

      const { listingRow, availability, activityCode } = parsed.data;
      const created = await supabaseRequest('listings', {
        method: 'POST',
        body: listingRow
      });
      const listing = created && created[0] ? created[0] : null;
      if (!listing) {
        return res.status(500).json({ error: 'Listing creation failed' });
      }

      if (availability) {
        await supabaseRequest('listing_availability', {
          method: 'POST',
          body: {
            listing_id: listing.id,
            ...availability
          },
          prefer: 'return=minimal'
        });
      }

      await supabaseRequest('listing_activities', {
        method: 'POST',
        body: {
          listing_id: listing.id,
          activity_code: activityCode
        },
        prefer: 'return=minimal'
      });

      await logAudit({
        userId: auth.session.user.id,
        action: 'create',
        entity: 'listing',
        entityId: listing.id,
        beforeData: null,
        afterData: { id: listing.id, slug: listing.slug, title: listing.title, category: listing.category },
        ipAddress: getClientIp(req)
      });

      return res.status(201).json({ ok: true, id: listing.id, slug: listing.slug });
    } catch (error) {
      return res.status(500).json({ error: 'Could not create listing', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
