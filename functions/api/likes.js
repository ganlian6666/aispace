export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(
            "SELECT card_id, COUNT(*) as count FROM likes GROUP BY card_id"
        ).all();

        const likesMap = {};
        results.forEach(r => likesMap[r.card_id] = r.count);

        return new Response(JSON.stringify(likesMap), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
        const { card_id } = await request.json();

        // Check limit: 3 likes per IP per card per day
        const { results } = await env.DB.prepare(
            "SELECT count(*) as count FROM likes WHERE ip = ? AND card_id = ? AND created_at > datetime('now', '-1 day')"
        ).bind(ip, card_id).all();

        if (results[0].count >= 3) {
            return new Response(JSON.stringify({ error: 'Daily like limit reached for this item' }), { status: 429 });
        }

        await env.DB.prepare(
            "INSERT INTO likes (card_id, ip) VALUES (?, ?)"
        ).bind(card_id, ip).run();

        // Return new count
        const { results: countResult } = await env.DB.prepare(
            "SELECT count(*) as count FROM likes WHERE card_id = ?"
        ).bind(card_id).all();

        return new Response(JSON.stringify({ success: true, count: countResult[0].count }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
