const {
  requireOpsAuth,
  supabaseRequest,
  logAudit,
  getClientIp,
  slugify
} = require('../../lib/ops-auth');

const ALLOWED_PROVIDER_TYPES = new Set(['villa', 'yacht', 'watersport', 'concierge', 'car_rental']);

function validateProviderInput(payload = {}) {
  const errors = [];
  const name = String(payload.name || '').trim();
  const type = String(payload.type || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const contactPerson = String(payload.contactPerson || '').trim();
  const notes = String(payload.notes || '').trim();
  const active = payload.active === false || payload.active === 'false' ? false : true;
  const code = slugify(payload.code || name);

  if (!name) errors.push('Provider name is required');
  if (!code) errors.push('Provider code is required');
  if (!ALLOWED_PROVIDER_TYPES.has(type)) errors.push('Invalid provider type');
  if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push('Invalid email format');

  return {
    errors,
    providerRow: {
      code,
      name,
      email: email || null,
      phone: phone || null,
      type,
      contact_person: contactPerson || null,
      notes: notes || null,
      active,
      deleted_at: active ? null : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor', 'viewer'] });
      if (!auth) return;

      const includeInactive = String(req.query.includeInactive || 'false') === 'true';
      const filter = includeInactive ? '' : '&active=eq.true&deleted_at=is.null';
      const rows = await supabaseRequest(`providers?select=id,code,name,type,email,phone,contact_person,notes,active,updated_at,deleted_at${filter}&order=name.asc`);
      return res.status(200).json({ ok: true, data: rows || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Could not fetch providers', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor'], csrf: true });
      if (!auth) return;

      const parsed = validateProviderInput(req.body || {});
      if (parsed.errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.errors });
      }

      const created = await supabaseRequest('providers', {
        method: 'POST',
        body: parsed.providerRow
      });
      const row = created && created[0] ? created[0] : null;
      if (!row) return res.status(500).json({ error: 'Provider creation failed' });

      await logAudit({
        userId: auth.session.user.id,
        action: 'create',
        entity: 'provider',
        entityId: row.id,
        beforeData: null,
        afterData: {
          code: row.code,
          name: row.name,
          type: row.type,
          active: row.active
        },
        ipAddress: getClientIp(req)
      });

      return res.status(201).json({ ok: true, id: row.id });
    } catch (error) {
      return res.status(500).json({ error: 'Could not create provider', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
