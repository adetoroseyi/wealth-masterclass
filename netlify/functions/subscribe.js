exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID env vars');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error. Please try again later.' })
    };
  }

  let email;
  try {
    const body = JSON.parse(event.body || '{}');
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please provide a valid email address.' }) };
  }

  try {
    // Step 1: Add contact to Resend audience
    const contactRes = await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, unsubscribed: false })
    });

    const contactResult = await contactRes.json();

    if (!contactRes.ok) {
      console.error('Resend audience error:', JSON.stringify(contactResult));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to subscribe. Please try again.' })
      };
    }

    console.log('Subscriber added:', email);

    // Step 2: Schedule the 3-email nurture sequence
    const now = new Date();

    const day2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const day4 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

    const emails = [
      {
        from: FROM_EMAIL,
        to: [email],
        subject: "You're in — here's your free wealth system preview",
        html: `<p>Hey,</p>
<p>Welcome to <strong>Thrive Richly</strong> — you just made a decision that most people never make. 🎉</p>
<p>Here's one of the most powerful insights from the Wealth Masterclass:</p>
<blockquote>
  <strong>Wealth is built on systems, not willpower.</strong> The people who hit $100K don't budget harder — they automate smarter. One savings transfer, set up once, compounds silently for years.
</blockquote>
<p>In the Wealth Masterclass, we walk you through exactly how to build that system — step by step — whether you're starting from $0 or already saving but not seeing results.</p>
<p>Over the next few days, I'll share more of what's inside. Keep an eye on your inbox.</p>
<p>In the meantime, take a look at the full roadmap here:</p>
<p><a href="https://thriverichly.com">👉 Visit Thrive Richly</a></p>
<p>— The Thrive Richly Team</p>`
      },
      {
        from: FROM_EMAIL,
        to: [email],
        subject: "The savings rate that actually builds wealth",
        scheduled_at: day2,
        html: `<p>Hey,</p>
<p>Quick question: what savings rate do you think it takes to build real wealth?</p>
<p>Most people guess 10–15%. The reality?</p>
<p><strong>20% consistently, automated, starting today</strong> — that's the threshold that separates people who reach $100K from those who stall.</p>
<p>Here's the formula:</p>
<ol>
  <li>Set up a separate savings account (takes 10 minutes)</li>
  <li>Auto-transfer 20% of every paycheck the day it lands</li>
  <li>Never touch that account unless it's an investment</li>
</ol>
<p>It sounds simple because it <em>is</em> simple. What's hard is knowing what to invest in next and how to make your money work harder once it's saved.</p>
<p>That's exactly what we cover in <strong>The Wealth Masterclass</strong>:</p>
<p><a href="https://thriverichly.gumroad.com/l/thriverichlymasterclass">👉 Get the full system for $29 →</a></p>
<p>— The Thrive Richly Team</p>`
      },
      {
        from: FROM_EMAIL,
        to: [email],
        subject: "Marcus saved $23,000 in 8 months — here's how",
        scheduled_at: day4,
        html: `<p>Hey,</p>
<p>Marcus was 27, earning $42,000 a year, and had less than $200 in savings.</p>
<p>Eight months later, he had <strong>$23,000 saved</strong> — and a clear path to $100K.</p>
<p>He didn't get a raise. He didn't win anything. He just followed the system in <strong>The Wealth Masterclass</strong>:</p>
<ul>
  <li>Automated his savings on day one</li>
  <li>Cut 3 invisible expenses draining $400/month</li>
  <li>Started a side income stream that added $600/month within 60 days</li>
</ul>
<p>This isn't a miracle story — it's a repeatable process. And it's available to you right now for just $29.</p>
<p><strong>⚠️ Launch pricing ends soon.</strong> Once we officially launch, the price goes up.</p>
<p><a href="https://thriverichly.gumroad.com/l/thriverichlymasterclass">👉 Get The Wealth Masterclass for $29 →</a></p>
<p>— The Thrive Richly Team</p>`
      }
    ];

    // Send all 3 emails (Email 1 immediately, 2 & 3 scheduled)
    const emailResults = await Promise.allSettled(
      emails.map(payload =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(r => r.json())
      )
    );

    emailResults.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`Email ${i + 1} queued:`, JSON.stringify(result.value));
      } else {
        console.error(`Email ${i + 1} failed:`, result.reason);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Function error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
    };
  }
};
