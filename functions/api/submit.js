export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    const body = await request.json();
    const { name, url, invite_link, description } = body;

    if (!name || !url) {
      return new Response(JSON.stringify({ error: 'Name and URL are required' }), { status: 400 });
    }

    // 1. Check submission limit (5 per day per IP to prevent spam)
    const { results: limitCheck } = await env.DB.prepare(
      "SELECT count(*) as count FROM submissions WHERE ip = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip).all();

    if (limitCheck[0].count >= 5) {
      return new Response(JSON.stringify({ error: 'Daily submission limit reached' }), { status: 429 });
    }

    // 2. Duplicate Domain Check
    const domain = extractDomain(url);
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
    }

    // Check websites table (display_url)
    // We check if the existing display_url contains the domain. 
    // Ideally we should extract domain from display_url in DB too, but SQL doesn't do regex easily.
    // For simplicity and performance in D1, we can fetch all or use LIKE.
    // Given the scale, fetching all might be heavy eventually, but OK for now.
    // Better approach: LIKE '%domain%'

    // Check main websites table
    const { results: existingWebsites } = await env.DB.prepare(
      "SELECT display_url FROM websites"
    ).all();

    const isDuplicateWebsite = existingWebsites.some(site => extractDomain(site.display_url) === domain);

    // Check submissions table (url)
    const { results: existingSubmissions } = await env.DB.prepare(
      "SELECT url FROM submissions"
    ).all();

    const isDuplicateSubmission = existingSubmissions.some(sub => extractDomain(sub.url) === domain);

    if (isDuplicateWebsite || isDuplicateSubmission) {
      return new Response(JSON.stringify({ error: '不好，有人快你一步提交了该网站，感谢支持！' }), { status: 409 });
    }

    await env.DB.prepare(
      "INSERT INTO submissions (name, url, invite_link, description, ip) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, url, invite_link, description, ip).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Helper: Extract Top + Second Level Domain (e.g., google.com from https://www.google.com/foo)
function extractDomain(urlStr) {
  try {
    let hostname = new URL(urlStr).hostname;
    // Remove www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return null;
  }
}
