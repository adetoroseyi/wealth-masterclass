/**
 * Thrive Richly — Facebook Comment Auto-Reply Webhook
 * 
 * Netlify serverless function that:
 * 1. Verifies the webhook with Facebook (GET request)
 * 2. Receives real-time comment notifications (POST request)
 * 3. Auto-likes the comment
 * 4. Posts a public reply encouraging engagement
 * 5. Sends free guide link for keyword comments + upsells paid product
 * 
 * Environment variables required:
 *   FB_PAGE_ACCESS_TOKEN    — Permanent Page Access Token
 *   FB_WEBHOOK_VERIFY_TOKEN — Custom verify token (must match Facebook config)
 *   FB_PAGE_ID              — Facebook Page ID (optional, defaults to Thrive Richly)
 */

const PAGE_ID = process.env.FB_PAGE_ID || '216309642249176';
const API_VERSION = 'v25.0';

// ── Product URLs ─────────────────────────────────────────────────
const FREE_GUIDE_URL = 'https://thriverichly.gumroad.com/l/freethriverichly';
const WEALTH_BLUEPRINT_URL = 'https://thriverichly.gumroad.com/l/thriverichly';
const WEALTH_MASTERCLASS_URL = 'https://thriverichly.netlify.app/';

// ── Reply Templates (generic — no keyword detected) ──────────────
const REPLY_TEMPLATES = [
  "Love that this resonated with you! 🔥 Comment THRIVE to get our free money guide. Follow Thrive Richly for daily wealth tips!",
  "This is the mindset that builds wealth! 💰 Want a free guide? Comment THRIVE. Follow Thrive Richly for more!",
  "Glad you're here! 🙌 Comment THRIVE and we'll drop you our free '5 Money Rules' guide. Follow Thrive Richly!",
  "You're on the right track! 💪 Comment THRIVE for a free wealth guide. Follow Thrive Richly for daily tips!",
  "That's the energy! 🚀 We made a free guide just for people like you — comment THRIVE to get it. Follow Thrive Richly!",
  "Welcome to the journey! ✨ Comment THRIVE for our free money guide. Follow Thrive Richly for tips that actually work!",
  "Facts! 💯 Want more? Comment THRIVE for a free wealth guide. Follow Thrive Richly for daily game-changers!",
  "Appreciate you engaging! 🙏 Comment THRIVE to grab our free money guide. Follow Thrive Richly for more!",
];

// ── Keyword Reply Templates (free guide + paid product upsell) ───
const KEYWORD_REPLIES = {
  thrive: [
    "Here's your free guide! 🎁 Grab '5 Money Rules That Changed My Life' here: " + FREE_GUIDE_URL + "\n\nWant the full system? The Wealth Masterclass has everything — framework, tracker, worksheets: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly for daily tips! 🔥",
    "You asked for it! 💰 Download your free '5 Money Rules' guide: " + FREE_GUIDE_URL + "\n\nReady to go deeper? The Wealth Masterclass gives you the complete blueprint to build real wealth: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly for more! 🚀",
    "Sent! 🎁 Get your free '5 Money Rules' guide here: " + FREE_GUIDE_URL + "\n\nIf you're serious about building wealth, check out The Wealth Masterclass — it's the full system: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly! 💪",
  ],
  guide: [
    "Here you go! 🎁 Grab the free '5 Money Rules' guide: " + FREE_GUIDE_URL + "\n\nWant the complete wealth-building system? Check out The Wealth Masterclass: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly for daily tips! 💰",
  ],
  free: [
    "Here's the free guide! 💰 Download '5 Money Rules That Changed My Life': " + FREE_GUIDE_URL + "\n\nFor the full framework + Excel tracker + worksheets, The Wealth Masterclass has it all: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly! 🔥",
  ],
  wealth: [
    "Great to see you interested in building wealth! 🔥 Start with our free guide: " + FREE_GUIDE_URL + "\n\nWhen you're ready for the complete system, The Wealth Masterclass covers everything: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly! 💪",
  ],
  money: [
    "Let's get that money right! 💰 Grab our free '5 Money Rules' guide: " + FREE_GUIDE_URL + "\n\nWant the full blueprint? The Wealth Masterclass is the complete system: " + WEALTH_MASTERCLASS_URL + "\n\nFollow Thrive Richly for daily tips! 🚀",
  ],
};

// ── Rate Limiting (in-memory, resets on cold start) ──────────────
const recentReplies = new Map();
const MAX_REPLIES_PER_MINUTE = 10;
let repliesThisMinute = 0;
let minuteStart = Date.now();

function checkRateLimit() {
  const now = Date.now();
  if (now - minuteStart > 60000) {
    repliesThisMinute = 0;
    minuteStart = now;
  }
  if (repliesThisMinute >= MAX_REPLIES_PER_MINUTE) {
    return false;
  }
  repliesThisMinute++;
  return true;
}

function isDuplicate(commentId) {
  if (recentReplies.has(commentId)) return true;
  recentReplies.set(commentId, Date.now());
  if (recentReplies.size > 500) {
    const oldest = recentReplies.keys().next().value;
    recentReplies.delete(oldest);
  }
  return false;
}

// ── Helpers ───────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getKeywordReply(commentText) {
  const lower = commentText.toLowerCase().trim();
  const priorityKeywords = ['thrive', 'guide', 'free', 'wealth', 'money'];
  for (const keyword of priorityKeywords) {
    if (lower.includes(keyword) && KEYWORD_REPLIES[keyword]) {
      return pickRandom(KEYWORD_REPLIES[keyword]);
    }
  }
  return null;
}

function getGenericReply() {
  return pickRandom(REPLY_TEMPLATES);
}

// ── Facebook Graph API Calls ─────────────────────────────────────

async function likeComment(commentId, accessToken) {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${commentId}/likes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
    const result = await response.json();
    console.log(`Like comment ${commentId}:`, JSON.stringify(result));
    return result.success || false;
  } catch (err) {
    console.error(`Error liking comment ${commentId}:`, err.message);
    return false;
  }
}

async function replyToComment(commentId, message, accessToken) {
  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${commentId}/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        access_token: accessToken,
      }),
    });
    const result = await response.json();
    console.log(`Reply to comment ${commentId}:`, JSON.stringify(result));
    return result.id || null;
  } catch (err) {
    console.error(`Error replying to comment ${commentId}:`, err.message);
    return null;
  }
}

// ── Main Handler ─────────────────────────────────────────────────

exports.handler = async (event) => {
  const ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
  const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN;

  if (!ACCESS_TOKEN || !VERIFY_TOKEN) {
    console.error('Missing environment variables');
    return { statusCode: 500, body: 'Server config error' };
  }

  // ── GET: Facebook Webhook Verification ──
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    console.log('Webhook verification request:', { mode, token: token ? '***' : 'missing' });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return {
        statusCode: 200,
        body: challenge,
      };
    } else {
      console.error('Webhook verification failed — token mismatch');
      return { statusCode: 403, body: 'Forbidden' };
    }
  }

  // ── POST: Incoming Webhook Events ──
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (err) {
      console.error('Failed to parse webhook body:', err.message);
      return { statusCode: 200, body: 'OK' };
    }

    console.log('Webhook received:', JSON.stringify(body).substring(0, 1000));

    if (body.object !== 'page') {
      return { statusCode: 200, body: 'Not a page event' };
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'feed') continue;

        const value = change.value || {};

        console.log('Feed event:', JSON.stringify({
          item: value.item,
          verb: value.verb,
          comment_id: value.comment_id,
          parent_id: value.parent_id,
          post_id: value.post_id,
          from: value.from,
          message: value.message
        }));

        // Only process new comments (not edits, deletes, or posts)
        if (value.item !== 'comment' || value.verb !== 'add') continue;

        // Don't reply to our own comments (from the page itself)
        if (value.from && value.from.id === PAGE_ID) {
          console.log('Skipping — comment is from our own page');
          continue;
        }

        // Only skip replies-to-replies (where parent_id is a COMMENT, not a POST)
        // Top-level comments have parent_id equal to the post_id
        // Replies to comments have parent_id equal to another comment_id
        if (value.parent_id && value.post_id && value.parent_id !== value.post_id) {
          console.log('Skipping — comment is a reply to another comment');
          continue;
        }

        const commentId = value.comment_id;
        const commentText = value.message || '';
        const commenterName = value.from ? value.from.name : '';

        if (!commentId) {
          console.log('Skipping — no comment_id found');
          continue;
        }

        console.log(`Processing comment from ${commenterName}: "${commentText.substring(0, 100)}"`);

        // Rate limit and duplicate checks
        if (isDuplicate(commentId)) {
          console.log('Skipping — duplicate comment');
          continue;
        }

        if (!checkRateLimit()) {
          console.log('Skipping — rate limit reached');
          continue;
        }

        // Small random delay (1-3 seconds) to look natural
        const delay = 1000 + Math.floor(Math.random() * 2000);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Step 1: Like the comment
        await likeComment(commentId, ACCESS_TOKEN);

        // Step 2: Pick the right reply
        let replyMessage = getKeywordReply(commentText);
        if (!replyMessage) {
          replyMessage = getGenericReply();
        }

        // Step 3: Post the reply
        const replyId = await replyToComment(commentId, replyMessage, ACCESS_TOKEN);

        if (replyId) {
          console.log(`Successfully replied (${replyId}) to comment ${commentId}`);
        }
      }
    }

    return { statusCode: 200, body: 'EVENT_RECEIVED' };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
