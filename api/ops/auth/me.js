const { requireOpsAuth } = require('../../../lib/ops-auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireOpsAuth(req, res);
    if (!auth) return;
    return res.status(200).json({
      ok: true,
      user: {
        id: auth.session.user.id,
        email: auth.session.user.email,
        role: auth.session.user.role
      },
      csrfToken: auth.session.csrfToken
    });
  } catch (error) {
    return res.status(500).json({ error: 'Session check failed', details: error.message });
  }
};
