export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 15;
    const offset = (page - 1) * limit;

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM news ORDER BY published_at DESC LIMIT ? OFFSET ?"
        ).bind(limit, offset).all();

        // Format dates
        const news = results.map(item => {
            const date = new Date(item.published_at);
            return {
                ...item,
                formatted_date: `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
            };
        });

        return new Response(JSON.stringify(news), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
