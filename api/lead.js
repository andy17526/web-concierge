const DEFAULT_PRODUCT_BY_SERVICE = {
  'luxury-villa': 'villa1',
  'private-yacht': 'yacht1',
  'jet-ski-water': 'watersport1',
  'private-chef': 'concierge-chef',
  'driver-24-7': 'concierge-driver',
  'club-access': 'concierge-club',
  security: 'concierge-security'
};

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

async function supabaseRequest(path, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Database not configured');
  }

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
  const raw = await response.text();
  if (!raw) return null;
  return JSON.parse(raw);
}

async function resolveProductAndProvider(requestedProduct, selectedServices) {
  const fallbackProduct = selectedServices
    .map(service => DEFAULT_PRODUCT_BY_SERVICE[service])
    .find(Boolean);

  const productSlug = requestedProduct || fallbackProduct || null;
  if (!productSlug) {
    return { product: null, providerId: null };
  }

  const products = await supabaseRequest(
    `products?select=id,slug,name,category&slug=eq.${encodeURIComponent(productSlug)}&active=eq.true&limit=1`
  );

  const product = products && products[0] ? products[0] : null;
  if (!product) {
    return { product: null, providerId: null };
  }

  const assignments = await supabaseRequest(
    `product_provider_assignments?select=provider_id&product_id=eq.${product.id}&active=eq.true&is_primary=eq.true&limit=1`
  );

  const providerId = assignments && assignments[0] ? assignments[0].provider_id : null;
  return { product, providerId };
}

async function sendEmail(payload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('Email provider not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email delivery failed: ${details}`);
  }

  return response.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    fullName,
    email,
    phone,
    country,
    arrival,
    departure,
    guests,
    budget,
    services,
    specialRequests,
    requestedProduct
  } = req.body || {};

  if (!fullName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const selectedServices = toArray(services);

  let lead = null;
  let product = null;
  let providerId = null;
  let dbError = null;

  try {
    const leadRows = await supabaseRequest('leads', {
      method: 'POST',
      body: {
        full_name: fullName,
        email,
        phone: phone || null,
        country: country || null,
        arrival: arrival || null,
        departure: departure || null,
        guests: guests || null,
        budget: budget || null,
        special_requests: specialRequests || null,
        source: 'website',
        requested_product_slug: requestedProduct || null,
        requested_listing_slug: requestedProduct || null
      }
    });

    lead = leadRows && leadRows[0] ? leadRows[0] : null;
    if (!lead) {
      throw new Error('Lead insert failed');
    }

    const resolved = await resolveProductAndProvider(requestedProduct, selectedServices);
    product = resolved.product;
    providerId = resolved.providerId;

    const interestRows = selectedServices.length
      ? selectedServices.map(serviceCode => ({
        lead_id: lead.id,
        product_id: product ? product.id : null,
        provider_id: providerId,
        service_code: serviceCode,
        status: 'new',
        notes: null
      }))
      : [{
        lead_id: lead.id,
        product_id: product ? product.id : null,
        provider_id: providerId,
        service_code: null,
        status: 'new',
        notes: null
      }];

    await supabaseRequest('lead_interests', {
      method: 'POST',
      body: interestRows,
      prefer: 'return=minimal'
    });
  } catch (error) {
    dbError = error.message;
  }

  const html = `
    <h2>New Vedara lead</h2>
    <p><strong>Lead ID:</strong> ${escapeHtml(lead ? lead.id : 'not stored')}</p>
    <p><strong>Full name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Country:</strong> ${escapeHtml(country)}</p>
    <p><strong>Arrival:</strong> ${escapeHtml(arrival)}</p>
    <p><strong>Departure:</strong> ${escapeHtml(departure)}</p>
    <p><strong>Guests:</strong> ${escapeHtml(guests)}</p>
    <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
    <p><strong>Requested product:</strong> ${escapeHtml(requestedProduct || (product ? product.slug : ''))}</p>
    <p><strong>Assigned provider ID:</strong> ${escapeHtml(providerId)}</p>
    <p><strong>Services:</strong> ${escapeHtml(selectedServices.join(', '))}</p>
    <p><strong>Special requests:</strong><br>${escapeHtml(specialRequests).replaceAll('\n', '<br>')}</p>
    <p><strong>DB status:</strong> ${escapeHtml(dbError ? `warning - ${dbError}` : 'ok')}</p>
  `;

  try {
    const emailResponse = await sendEmail({
      from: process.env.MAIL_FROM || 'Vedara Website <onboarding@resend.dev>',
      to: [process.env.MAIL_TO || 'sales@vedara.eu'],
      reply_to: email,
      subject: `New Vedara lead - ${fullName}`,
      html
    });

    return res.status(200).json({
      ok: true,
      leadId: lead ? lead.id : null,
      productSlug: product ? product.slug : null,
      providerId,
      emailId: emailResponse.id,
      dbStored: !dbError,
      dbError
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Email delivery failed',
      details: error.message,
      dbStored: !dbError,
      dbError
    });
  }
};
