const crypto = require('crypto');

// Meta Conversions API config
const PIXEL_ID = '1305251814774477';
const API_VERSION = 'v21.0';

// Hash helper for Meta CAPI (SHA256, lowercase, trimmed)
function hashSHA256(value) {
  if (!value) return null;
  return crypto
    .createHash('sha256')
    .update(value.toString().trim().toLowerCase())
    .digest('hex');
}

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Get access token from Netlify environment variable
  const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;
  if (!ACCESS_TOKEN) {
    console.error('META_CAPI_TOKEN environment variable not set');
    return { statusCode: 500, body: 'Server config error' };
  }

  try {
    // Parse Gumroad's x-www-form-urlencoded body
    const params = new URLSearchParams(event.body);
    const data = Object.fromEntries(params.entries());

    // Log for debugging (remove in production if you want)
    console.log('Gumroad Ping received:', JSON.stringify({
      product: data.product_name,
      email: data.email ? '***' : 'missing',
      price: data.price,
      sale_id: data.sale_id
    }));

    // Extract sale data
    const email = data.email || '';
    const price = (parseFloat(data.price) || 2900) / 100;
    const productName = data.product_name || 'Wealth Masterclass';
    const saleId = data.sale_id || '';
    const ipAddress = data.ip_country || '';

    // Build Meta Conversions API payload
    const eventData = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: saleId || `gumroad_${Date.now()}`,
          event_source_url: process.env.SITE_URL || 'https://thriverichly.com',
          action_source: 'website',
          user_data: {
            em: email ? [hashSHA256(email)] : [],
            client_ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'] || null,
            client_user_agent: event.headers['user-agent'] || null
          },
          custom_data: {
            currency: 'USD',
            value: price,
            content_name: productName,
            content_ids: ['wealth-masterclass'],
            content_type: 'product',
            order_id: saleId
          }
        }
      ]
    };

    // Add test event code for debugging (REMOVE THIS LINE after confirming it works)

    // Send to Meta Conversions API
    const metaUrl = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    const result = await response.json();
    console.log('Meta CAPI response:', JSON.stringify(result));

    if (result.events_received) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, events_received: result.events_received })
      };
    } else {
      console.error('Meta CAPI error:', JSON.stringify(result));
      return {
        statusCode: 200,  // Still return 200 to Gumroad so it doesn't retry
        body: JSON.stringify({ success: false, error: result })
      };
    }

  } catch (error) {
    console.error('Function error:', error.message);
    return {
      statusCode: 200,  // Return 200 to Gumroad to prevent retries
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
