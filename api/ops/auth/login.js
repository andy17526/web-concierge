const {
  SESSION_COOKIE_NAME,
  SESSION_TTL_HOURS,
  setCookie,
  normalizeEmail,
  verifyPassword,
  verifyTotp,
  getClientIp,
  countRecentFailedAttempts,
  recordLoginAttempt,
  getOpsUserByEmail,
  createOpsSession,
  supabaseRequest
} = require('../../../lib/ops-auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const otp = String(req.body?.otp || '');
  const ipAddress = getClientIp(req);
  const userAgent = String(req.headers['user-agent'] || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const failedCount = await countRecentFailedAttempts(email, ipAddress, 15);
    if (failedCount >= 5) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
    }

    const user = await getOpsUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      await recordLoginAttempt({ email, ipAddress, success: false });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role === 'admin') {
      if (!user.mfa_enabled || !user.mfa_secret) {
        await recordLoginAttempt({ email, ipAddress, success: false });
        return res.status(403).json({ error: 'Admin MFA is required but not configured' });
      }
      if (!verifyTotp(user.mfa_secret, otp)) {
        await recordLoginAttempt({ email, ipAddress, success: false });
        return res.status(401).json({ error: 'Invalid MFA code' });
      }
    }

    await recordLoginAttempt({ email, ipAddress, success: true });
    const session = await createOpsSession({ userId: user.id, ipAddress, userAgent });
    setCookie(res, SESSION_COOKIE_NAME, session.rawToken, SESSION_TTL_HOURS * 60 * 60);

    await supabaseRequest('ops_login_attempts?email=eq.' + encodeURIComponent(email) + '&ip_address=eq.' + encodeURIComponent(ipAddress) + '&success=eq.false', {
      method: 'DELETE',
      prefer: 'return=minimal'
    });

    return res.status(200).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      csrfToken: session.csrfToken
    });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
};
