export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = request.headers.get('X-Admin-Key');

    if (key !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM feedback ORDER BY created_at DESC"
        ).all();
        return new Response(JSON.stringify(results));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const key = request.headers.get('X-Admin-Key');
    const id = url.searchParams.get('id');

    if (key !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!id) {
        return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });
    }

    try {
        // Delete single or bulk
        if (id.includes(',')) {
            const ids = id.split(',');
            const placeholders = ids.map(() => '?').join(',');
            await env.DB.prepare(`DELETE FROM feedback WHERE id IN (${placeholders})`).bind(...ids).run();
        } else {
            await env.DB.prepare("DELETE FROM feedback WHERE id = ?").bind(id).run();
        }

        return new Response(JSON.stringify({ success: true }));
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
