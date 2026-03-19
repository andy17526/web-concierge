const {
  requireOpsAuth,
  supabaseRequest,
  logAudit,
  getClientIp,
  slugify
} = require('../../lib/ops-auth');

const ALLOWED_PROVIDER_TYPES = new Set(['villa', 'yacht', 'watersport', 'concierge', 'car_rental']);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor'], csrf: true });
    if (!auth) return;

    const id = Number.parseInt(req.body?.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Provider id is required' });

    const currentRows = await supabaseRequest(`providers?select=*&id=eq.${id}&limit=1`);
    const current = currentRows && currentRows[0] ? currentRows[0] : null;
    if (!current) return res.status(404).json({ error: 'Provider not found' });

    const name = String(req.body?.name ?? current.name ?? '').trim();
    const type = String(req.body?.type ?? current.type ?? '').trim();
    const code = slugify(req.body?.code ?? current.code ?? name);
    const email = String(req.body?.email ?? current.email ?? '').trim().toLowerCase();
    const phone = String(req.body?.phone ?? current.phone ?? '').trim();
    const contactPerson = String(req.body?.contactPerson ?? current.contact_person ?? '').trim();
    const notes = String(req.body?.notes ?? current.notes ?? '').trim();
    const active = req.body?.active === undefined
      ? current.active
      : !(req.body.active === false || req.body.active === 'false');

    if (!name) return res.status(400).json({ error: 'Provider name is required' });
    if (!ALLOWED_PROVIDER_TYPES.has(type)) return res.status(400).json({ error: 'Invalid provider type' });
    if (!code) return res.status(400).json({ error: 'Provider code is required' });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    const patch = {
      code,
      name,
      type,
      email: email || null,
      phone: phone || null,
      contact_person: contactPerson || null,
      notes: notes || null,
      active,
      deleted_at: active ? null : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await supabaseRequest(`providers?id=eq.${id}`, {
      method: 'PATCH',
      body: patch,
      prefer: 'return=minimal'
    });

    await logAudit({
      userId: auth.session.user.id,
      action: 'update',
      entity: 'provider',
      entityId: id,
      beforeData: {
        code: current.code,
        name: current.name,
        type: current.type,
        active: current.active
      },
      afterData: {
        code: patch.code,
        name: patch.name,
        type: patch.type,
        active: patch.active
      },
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({ ok: true, id });
  } catch (error) {
    return res.status(500).json({ error: 'Could not update provider', details: error.message });
  }
};
