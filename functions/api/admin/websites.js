export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    try {
        // 1. 安全验证
        const authKey = request.headers.get('X-Admin-Key');
        const correctKey = env.ADMIN_PASSWORD;

        // 获取 IP (Cloudflare 特定 header，本地开发可能为空)
        const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

        // 检查该 IP 的失败次数
        const { results: attempts } = await env.DB.prepare("SELECT count FROM login_attempts WHERE ip = ?").bind(ip).all();
        const failCount = attempts.length > 0 ? attempts[0].count : 0;

        if (!correctKey || authKey !== correctKey) {
            // 密码错误：记录失败次数并惩罚
            const newCount = failCount + 1;

            // 更新数据库
            await env.DB.prepare(
                "INSERT OR REPLACE INTO login_attempts (ip, count, last_attempt) VALUES (?, ?, datetime('now'))"
            ).bind(ip, newCount).run();

            // 计算指数退避时间: 2^(N-1) 秒
            // 第1次: 1s, 第2次: 2s, 第3次: 4s, 第4次: 8s...
            // 设置上限 60秒，防止超时
            let delaySeconds = Math.pow(2, newCount - 1);
            if (delaySeconds > 60) delaySeconds = 60;

            console.log(`Login failed for IP ${ip}. Count: ${newCount}. Delay: ${delaySeconds}s`);

            // 执行延时
            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));

            return new Response(JSON.stringify({ error: 'Unauthorized', retry_after: delaySeconds }), { status: 401 });
        }

        // 密码正确：清除失败记录
        if (failCount > 0) {
            await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
        }

        // 2. 根据请求方法处理不同操作
        if (request.method === 'GET') {
            return await handleList(env);
        } else if (request.method === 'POST') {
            return await handleAdd(request, env);
        } else if (request.method === 'PUT') {
            return await handleUpdate(request, env);
        } else if (request.method === 'DELETE') {
            return await handleDelete(url, env);
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// 获取列表
async function handleList(env) {
    const { results } = await env.DB.prepare("SELECT * FROM websites ORDER BY id ASC").all();
    return new Response(JSON.stringify(results), { status: 200 });
}

// 添加新网站
async function handleAdd(request, env) {
    const data = await request.json();
    const { name, description, invite_link, display_url } = data;

    if (!name || !invite_link || !display_url) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const res = await env.DB.prepare(
        "INSERT INTO websites (name, description, invite_link, display_url) VALUES (?, ?, ?, ?)"
    ).bind(name, description, invite_link, display_url).run();

    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { status: 201 });
}

// 更新网站
async function handleUpdate(request, env) {
    const data = await request.json();
    const { id, name, description, invite_link, display_url } = data;

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    await env.DB.prepare(
        "UPDATE websites SET name = ?, description = ?, invite_link = ?, display_url = ? WHERE id = ?"
    ).bind(name, description, invite_link, display_url, id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// 删除网站
async function handleDelete(url, env) {
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });
    }

    await env.DB.prepare("DELETE FROM websites WHERE id = ?").bind(id).run();

    // 同时删除相关的点赞和评论数据，保持干净
    await env.DB.prepare("DELETE FROM likes WHERE card_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM comments WHERE card_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM site_status WHERE card_id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
