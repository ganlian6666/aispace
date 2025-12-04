export async function onRequestGet(context) {
    const { env } = context;

    try {
        // 1. 获取所有站点 (只取需要的字段)
        const { results } = await env.DB.prepare("SELECT id, display_url, last_checked FROM websites").all();

        if (!results || results.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        // 2. 筛选需要更新的站点 (按需检测)
        const now = Date.now();
        const sitesToUpdate = results.filter(site => {
            // 如果从未检测过 (last_checked is null)，或者超过 6 小时
            if (!site.last_checked) return true;
            const lastChecked = new Date(site.last_checked).getTime();
            return (now - lastChecked) > (360 * 60 * 1000);
        });

        if (sitesToUpdate.length > 0) {
            // 只更新过期或新增的站点
            await updateStatuses(env, sitesToUpdate);
        }

        // 3. 返回最新状态 (直接查库，确保返回全量数据)
        const { results: finalResults } = await env.DB.prepare("SELECT id as card_id, display_url as url, status, latency, last_checked FROM websites").all();
        return new Response(JSON.stringify(finalResults), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

async function updateStatuses(env, sites) {
    const updates = await Promise.all(sites.map(async (site) => {
        const start = Date.now();
        let status = 'offline';
        let latency = 0;

        try {
            const controller = new AbortController();
            // 增加超时时间到 8 秒
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // 改用 GET 请求，兼容性更好
            const res = await fetch(site.display_url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    // 伪装成普通浏览器
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });

            clearTimeout(timeoutId);

            // 只要有响应，哪怕是 403/401/503，通常也说明服务器是活的
            if (res.ok || res.status === 403 || res.status === 401 || res.status === 503) {
                status = 'online';
            }
            latency = Date.now() - start;
        } catch (e) {
            status = 'offline';
            latency = 0;
        }

        return { ...site, status, latency };
    }));

    // 批量更新数据库
    const stmt = env.DB.prepare(
        "UPDATE websites SET status = ?, latency = ?, last_checked = datetime('now') WHERE id = ?"
    );

    const batch = updates.map(u => stmt.bind(u.status, u.latency, u.id));
    await env.DB.batch(batch);

    // 返回前端需要的格式
    return updates.map(u => ({
        card_id: u.id,
        url: u.display_url,
        status: u.status,
        latency: u.latency,
        last_checked: new Date().toISOString()
    }));
}
