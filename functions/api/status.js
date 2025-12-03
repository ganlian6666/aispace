export async function onRequestGet(context) {
    const { env } = context;

    try {
        // 1. 获取所有站点状态
        const { results } = await env.DB.prepare("SELECT * FROM site_status").all();

        if (!results || results.length === 0) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        // 2. 检查是否需要更新 (以第一条数据的 last_checked 为准，简化逻辑)
        // 360分钟 = 6小时
        const lastChecked = new Date(results[0].last_checked || 0).getTime();
        const now = Date.now();
        const shouldUpdate = (now - lastChecked) > (360 * 60 * 1000);

        if (shouldUpdate) {
            // 需要更新，后台触发检测并更新数据库
            // 注意：为了不阻塞用户请求，这里我们可以先返回旧数据，利用 waitUntil 后台更新
            // 或者如果为了准确性，可以 await 更新完再返回（这里选择 await，保证首次加载有数据）

            const updatedResults = await updateStatuses(env, results);
            return new Response(JSON.stringify(updatedResults), { status: 200 });
        }

        // 不需要更新，直接返回缓存
        return new Response(JSON.stringify(results), { status: 200 });

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
            // 设置超时，防止卡死
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时

            const res = await fetch(site.url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SiteMonitor/1.0)' }
            });

            clearTimeout(timeoutId);

            if (res.ok || res.status === 403 || res.status === 401) {
                // 403/401 也算在线，只是不让访问根目录
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
    // D1 目前不支持大批量一次性更新，循环更新即可
    const stmt = env.DB.prepare(
        "UPDATE site_status SET status = ?, latency = ?, last_checked = datetime('now') WHERE card_id = ?"
    );

    const batch = updates.map(u => stmt.bind(u.status, u.latency, u.card_id));
    await env.DB.batch(batch);

    return updates;
}
