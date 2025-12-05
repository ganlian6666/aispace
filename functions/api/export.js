export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    // 简单的安全检查，防止被随意下载
    // 你可以修改这个密钥
    if (key !== 'admin123') {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM submissions ORDER BY created_at DESC"
        ).all();

        if (!results || results.length === 0) {
            return new Response('No submissions found', { status: 200 });
        }

        // Convert to CSV
        const headers = Object.keys(results[0]).join(',');
        const rows = results.map(row =>
            Object.values(row).map(value => `"${value}"`).join(',')
        ).join('\n');

        const bom = '\uFEFF';
        const csv = bom + headers + '\n' + rows;

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="submissions.csv"'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
