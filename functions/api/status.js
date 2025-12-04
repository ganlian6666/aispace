export async function onRequestGet(context) {
    const { env } = context;

    try {
        // 1. 获取所有站点 (只取需要的字段)
        const { results } = await env.DB.prepare("SELECT id, display_url, last_checked FROM websites").all();

        if (!results || results.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        // 2. 检查是否需要更新
        // 360分钟 = 6小时
        const lastChecked = new Date(results[0].last_checked || 0).getTime();
        const now = Date.now();
        const shouldUpdate = (now - lastChecked) > (360 * 60 * 1000);

        if (shouldUpdate) {
            const updatedResults = await updateStatuses(env, results);
            return new Response(JSON.stringify(updatedResults), { status: 200 });
        }

        // 不需要更新，直接返回数据库里的状态
        // 为了前端兼容，我们需要把 id 映射回 card_id (虽然现在就是 id)
        // 并且把 display_url 映射回 url
        const { results: cachedResults } = await env.DB.prepare("SELECT id as card_id, display_url as url, status, latency, last_checked FROM websites").all();
        return new Response(JSON.stringify(cachedResults), { status: 200 });

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
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(site.display_url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteMonitor/1.0)' }
            });

            clearTimeout(timeoutId);

            if (res.ok || res.status === 403 || res.status === 401) {
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
