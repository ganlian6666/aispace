export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        const body = await request.json();
        const { content, contact } = body;

        if (!content) {
            return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
        }

        // Rate Limit: 5 per day per IP
        const { results } = await env.DB.prepare(
            "SELECT count(*) as count FROM feedback WHERE ip = ? AND created_at > datetime('now', '-1 day')"
        ).bind(ip).all();

        if (results[0].count >= 5) {
            return new Response(JSON.stringify({ error: 'Daily feedback limit reached' }), { status: 429 });
        }

        await env.DB.prepare(
            "INSERT INTO feedback (content, contact, ip) VALUES (?, ?, ?)"
        ).bind(content, contact, ip).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
