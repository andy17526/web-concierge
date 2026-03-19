const {
  SESSION_COOKIE_NAME,
  clearCookie,
  requireOpsAuth,
  revokeOpsSession
} = require('../../../lib/ops-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireOpsAuth(req, res, { csrf: true });
    if (!auth) return;
    await revokeOpsSession(auth.rawToken);
    clearCookie(res, SESSION_COOKIE_NAME);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed', details: error.message });
  }
};
