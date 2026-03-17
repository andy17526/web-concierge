async function supabaseRequest(path) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Database not configured');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase error (${response.status}): ${details}`);
  }

  return response.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminApiKey = process.env.ADMIN_API_KEY;
  const providedKey = req.headers['x-admin-key'];

  if (!adminApiKey || providedKey !== adminApiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limitRaw = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

  try {
    const rows = await supabaseRequest(
      `lead_interests?select=id,status,service_code,notes,created_at,leads(id,full_name,email,phone,country,created_at),products(id,slug,name,category),providers(id,name,email)&order=created_at.desc&limit=${limit}`
    );
    return res.status(200).json({ ok: true, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ error: 'Could not fetch leads', details: error.message });
  }
};
