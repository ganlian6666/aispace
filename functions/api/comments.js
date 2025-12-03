export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const card_id = url.searchParams.get('card_id');

    if (!card_id) return new Response(JSON.stringify([]), { status: 200 });

    try {
        const { results } = await env.DB.prepare(
            "SELECT nickname, content, created_at FROM comments WHERE card_id = ? ORDER BY created_at DESC"
        ).bind(card_id).all();

        return new Response(JSON.stringify(results), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        const { card_id, nickname, content } = await request.json();

        // Check limit: 3 comments per IP per CARD per day
        const { results } = await env.DB.prepare(
            "SELECT count(*) as count FROM comments WHERE ip = ? AND card_id = ? AND created_at > datetime('now', '-1 day')"
        ).bind(ip, card_id).all();

        if (results[0].count >= 3) {
            return new Response(JSON.stringify({ error: 'Daily comment limit reached for this item' }), { status: 429 });
        }

        await env.DB.prepare(
            "INSERT INTO comments (card_id, nickname, content, ip) VALUES (?, ?, ?, ?)"
        ).bind(card_id, nickname || 'Anonymous', content, ip).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
