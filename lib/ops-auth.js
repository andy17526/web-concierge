const crypto = require('crypto');

const SESSION_COOKIE_NAME = process.env.OPS_SESSION_COOKIE || 'vedara_ops_session';
const SESSION_TTL_HOURS = Number(process.env.OPS_SESSION_TTL_HOURS || 12);

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Database not configured');
  return { supabaseUrl, serviceRoleKey };
}

async function supabaseRequest(path, options = {}) {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase error (${response.status}): ${details}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  return raw.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return acc;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    acc[key] = decodeURIComponent(val);
    return acc;
  }, {});
}

function setCookie(res, name, value, maxAgeSeconds) {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`
  ];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function clearCookie(res, name) {
  const attrs = [`${name}=`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Max-Age=0'];
  res.setHeader('Set-Cookie', attrs.join('; '));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 64);
  return `s2$${salt.toString('hex')}$${key.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.startsWith('s2$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  const derived = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(derived, expected);
}

function base32ToBuffer(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(base32 || '').toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function totpCode(secret, timestamp = Date.now()) {
  const step = 30;
  const counter = Math.floor(timestamp / 1000 / step);
  const key = base32ToBuffer(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  return String(binary % 1000000).padStart(6, '0');
}

function verifyTotp(secret, otp) {
  const code = String(otp || '').trim();
  if (!/^\d{6}$/.test(code)) return false;
  const now = Date.now();
  return [now - 30000, now, now + 30000].some(ts => totpCode(secret, ts) === code);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

async function countRecentFailedAttempts(email, ipAddress, minutes = 15) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const rows = await supabaseRequest(
    `ops_login_attempts?select=id&email=eq.${encodeURIComponent(email)}&ip_address=eq.${encodeURIComponent(ipAddress)}&success=eq.false&attempted_at=gte.${encodeURIComponent(since)}`
  );
  return Array.isArray(rows) ? rows.length : 0;
}

async function recordLoginAttempt({ email, ipAddress, success }) {
  await supabaseRequest('ops_login_attempts', {
    method: 'POST',
    body: { email, ip_address: ipAddress, success: !!success },
    prefer: 'return=minimal'
  });
}

async function getOpsUserByEmail(email) {
  const rows = await supabaseRequest(`ops_users?select=*&email=eq.${encodeURIComponent(email)}&active=eq.true&limit=1`);
  return rows && rows[0] ? rows[0] : null;
}

async function createOpsSession({ userId, ipAddress, userAgent }) {
  const rawToken = randomToken(32);
  const tokenHash = sha256(rawToken);
  const csrfToken = randomToken(24);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await supabaseRequest('ops_sessions', {
    method: 'POST',
    body: {
      user_id: userId,
      token_hash: tokenHash,
      csrf_token: csrfToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt
    },
    prefer: 'return=minimal'
  });
  return { rawToken, csrfToken, expiresAt };
}

async function revokeOpsSession(rawToken) {
  if (!rawToken) return;
  const tokenHash = sha256(rawToken);
  const now = new Date().toISOString();
  await supabaseRequest(`ops_sessions?token_hash=eq.${tokenHash}&revoked_at=is.null`, {
    method: 'PATCH',
    body: { revoked_at: now },
    prefer: 'return=minimal'
  });
}

async function getSessionWithUser(rawToken) {
  if (!rawToken) return null;
  const tokenHash = sha256(rawToken);
  const rows = await supabaseRequest(
    `ops_sessions?select=id,csrf_token,expires_at,revoked_at,user_id,ops_users(id,email,role,active,mfa_enabled)&token_hash=eq.${tokenHash}&limit=1`
  );
  const session = rows && rows[0] ? rows[0] : null;
  if (!session) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) return null;
  const user = session.ops_users;
  if (!user || !user.active) return null;
  return {
    id: session.id,
    csrfToken: session.csrf_token,
    userId: session.user_id,
    user
  };
}

async function requireOpsAuth(req, res, options = {}) {
  const cookies = parseCookies(req);
  const rawToken = cookies[SESSION_COOKIE_NAME];
  const session = await getSessionWithUser(rawToken);
  if (!session) {
    res.statusCode = 401;
    res.json({ error: 'Unauthorized' });
    return null;
  }

  if (options.roles && options.roles.length && !options.roles.includes(session.user.role)) {
    res.statusCode = 403;
    res.json({ error: 'Forbidden' });
    return null;
  }

  if (options.csrf === true) {
    const csrf = req.headers['x-csrf-token'];
    if (!csrf || csrf !== session.csrfToken) {
      res.statusCode = 403;
      res.json({ error: 'Invalid CSRF token' });
      return null;
    }
  }

  return { session, rawToken };
}

async function logAudit({ userId, action, entity, entityId, beforeData, afterData, ipAddress }) {
  await supabaseRequest('ops_audit_log', {
    method: 'POST',
    body: {
      user_id: userId,
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      before_data: beforeData || null,
      after_data: afterData || null,
      ip_address: ipAddress || null
    },
    prefer: 'return=minimal'
  });
}

function isHttps(req) {
  return req.headers['x-forwarded-proto'] === 'https' || !!req.connection?.encrypted;
}

function validateImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const ZONE_CENTROIDS = {
  'es cubells': [38.8721, 1.2701],
  'santa eularia': [38.9852, 1.533],
  'san juan': [39.078, 1.5127],
  'ibiza marina': [38.9092, 1.4465],
  'playa den bossa': [38.8842, 1.4063],
  'talamanca bay': [38.9212, 1.4606],
  'ibiza town': [38.9079, 1.4329],
  'airport pickup': [38.8759, 1.3731],
  'island-wide': [38.9067, 1.4206]
};

function approximateCoords(zone, seedValue) {
  const key = String(zone || '').trim().toLowerCase();
  const base = ZONE_CENTROIDS[key] || ZONE_CENTROIDS['island-wide'];
  const hash = crypto.createHash('sha256').update(String(seedValue || zone || 'vedara')).digest();
  const n1 = hash.readUInt16BE(0) / 65535;
  const n2 = hash.readUInt16BE(2) / 65535;
  const jitterLat = (n1 - 0.5) * 0.018;
  const jitterLng = (n2 - 0.5) * 0.024;
  return {
    latitude: Number((base[0] + jitterLat).toFixed(7)),
    longitude: Number((base[1] + jitterLng).toFixed(7))
  };
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_TTL_HOURS,
  supabaseRequest,
  parseCookies,
  setCookie,
  clearCookie,
  normalizeEmail,
  hashPassword,
  verifyPassword,
  verifyTotp,
  randomToken,
  getClientIp,
  countRecentFailedAttempts,
  recordLoginAttempt,
  getOpsUserByEmail,
  createOpsSession,
  revokeOpsSession,
  requireOpsAuth,
  logAudit,
  isHttps,
  validateImageUrl,
  slugify,
  approximateCoords
};
