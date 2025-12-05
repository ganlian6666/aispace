export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    // 安全检查：验证 Admin Password
    if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
        return new Response('Unauthorized', { status: 401 });
    }

    const type = url.searchParams.get('type') || 'submissions';

    try {
        let query = "";
        if (type === 'websites') {
            // 导出主页网站：只导出可配置的字段，忽略状态字段
            query = "SELECT id, name, description, invite_link, display_url FROM websites ORDER BY id ASC";
        } else {
            // 导出用户提交：重命名列以匹配 websites 表结构，方便直接导入
            // 默认把 url 同时作为 display_url 和 invite_link
            query = "SELECT id, name, description, url as invite_link, url as display_url FROM submissions ORDER BY created_at DESC";
        }

        const { results } = await env.DB.prepare(query).all();

        if (!results || results.length === 0) {
            return new Response('No data found', { status: 200 });
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
                'Content-Disposition': `attachment; filename="${type}_export.csv"`
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
