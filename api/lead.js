function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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
    specialRequests
  } = req.body || {};

  if (!fullName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Email provider not configured' });
  }

  const selectedServices = Array.isArray(services)
    ? services.filter(Boolean)
    : services
      ? [services]
      : [];

  const html = `
    <h2>New Vedara lead</h2>
    <p><strong>Full name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Country:</strong> ${escapeHtml(country)}</p>
    <p><strong>Arrival:</strong> ${escapeHtml(arrival)}</p>
    <p><strong>Departure:</strong> ${escapeHtml(departure)}</p>
    <p><strong>Guests:</strong> ${escapeHtml(guests)}</p>
    <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
    <p><strong>Services:</strong> ${escapeHtml(selectedServices.join(', '))}</p>
    <p><strong>Special requests:</strong><br>${escapeHtml(specialRequests).replaceAll('\n', '<br>')}</p>
  `;

  const payload = {
    from: process.env.MAIL_FROM || 'Vedara Website <onboarding@resend.dev>',
    to: [process.env.MAIL_TO || 'sales@vedara.eu'],
    reply_to: email,
    subject: `New Vedara lead - ${fullName}`,
    html
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(502).json({ error: 'Email delivery failed', details: errBody });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
};
