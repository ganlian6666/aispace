export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  try {
    const body = await request.json();
    const { name, url, invite_link, description } = body;

    if (!name || !url) {
      return new Response(JSON.stringify({ error: 'Name and URL are required' }), { status: 400 });
    }

    // Check submission limit (5 per day per IP to prevent spam)
    const { results } = await env.DB.prepare(
      "SELECT count(*) as count FROM submissions WHERE ip = ? AND created_at > datetime('now', '-1 day')"
    ).bind(ip).all();

    if (results[0].count >= 5) {
      return new Response(JSON.stringify({ error: 'Daily submission limit reached' }), { status: 429 });
    }

    await env.DB.prepare(
      "INSERT INTO submissions (name, url, invite_link, description, ip) VALUES (?, ?, ?, ?, ?)"
    ).bind(name, url, invite_link, description, ip).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
