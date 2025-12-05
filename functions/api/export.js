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
            "SELECT * FROM websites ORDER BY id DESC"
        ).all();

        if (!results || results.length === 0) {
            return new Response('No websites found', { status: 200 });
        }

        // Convert to CSV
        // 1. 获取表头
        const headers = Object.keys(results[0]).join(',');

        // 2. 构建行数据 (处理包含逗号或换行的内容)
        const rows = results.map(row =>
            Object.values(row).map(value => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""'); // 转义双引号
                return `"${str}"`;
            }).join(',')
        ).join('\n');

        // 3. 拼接 CSV 内容，并添加 BOM (\uFEFF) 解决 Excel 中文乱码
        const csv = `\uFEFF${headers}\n${rows}`;

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="websites_${new Date().toISOString().slice(0, 10)}.csv"`
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
