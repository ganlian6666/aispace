export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // 检查环境变量中的密码
    const correctKey = env.ADMIN_PASSWORD;

    if (!correctKey || authKey !== correctKey) {
        // 故意延迟 2 秒，防止暴力破解
        await new Promise(resolve => setTimeout(resolve, 2000));
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
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
