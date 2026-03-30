// Lead magnet email capture — subscribes to ConvertKit if configured
// Required env vars (set in Netlify dashboard):
//   CONVERTKIT_API_KEY  — ConvertKit API key (v3)
//   CONVERTKIT_FORM_ID  — ConvertKit form ID to subscribe to
// If not set, the function accepts the request and logs it (graceful degradation)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const email = (body.email || '').trim().toLowerCase();
  const source = body.source || 'unknown';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  console.log('Lead captured:', JSON.stringify({ email: email.replace(/(.{2}).+(@.+)/, '$1***$2'), source }));

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (apiKey && formId) {
    try {
      const res = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, email, tags: [source] })
      });
      const result = await res.json();
      if (result.subscription) {
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
      }
      console.error('ConvertKit error:', JSON.stringify(result));
    } catch (err) {
      console.error('ConvertKit fetch failed:', err.message);
    }
  }

  // Return success regardless (form shows success via .finally)
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
