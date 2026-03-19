const {
  requireOpsAuth,
  supabaseRequest,
  logAudit,
  getClientIp
} = require('../../lib/ops-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireOpsAuth(req, res, { roles: ['admin', 'editor'], csrf: true });
    if (!auth) return;

    const id = Number.parseInt(req.body?.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Provider id is required' });

    const rows = await supabaseRequest(`providers?select=id,code,name,type,active&id=eq.${id}&limit=1`);
    const row = rows && rows[0] ? rows[0] : null;
    if (!row) return res.status(404).json({ error: 'Provider not found' });

    const now = new Date().toISOString();
    await supabaseRequest(`providers?id=eq.${id}`, {
      method: 'PATCH',
      body: {
        active: false,
        deleted_at: now,
        updated_at: now
      },
      prefer: 'return=minimal'
    });

    await logAudit({
      userId: auth.session.user.id,
      action: 'soft_delete',
      entity: 'provider',
      entityId: id,
      beforeData: row,
      afterData: { active: false, deleted_at: now },
      ipAddress: getClientIp(req)
    });

    return res.status(200).json({ ok: true, id });
  } catch (error) {
    return res.status(500).json({ error: 'Could not deactivate provider', details: error.message });
  }
};
