export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    try {
        // 1. 安全验证
        const authKey = request.headers.get('X-Admin-Key');
        const correctKey = env.ADMIN_PASSWORD;
        const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

        // 检查该 IP 的失败次数
        const { results: attempts } = await env.DB.prepare("SELECT count FROM login_attempts WHERE ip = ?").bind(ip).all();
        const failCount = attempts.length > 0 ? attempts[0].count : 0;

        if (!correctKey || authKey !== correctKey) {
            const newCount = failCount + 1;
            await env.DB.prepare(
                "INSERT OR REPLACE INTO login_attempts (ip, count, last_attempt) VALUES (?, ?, datetime('now'))"
            ).bind(ip, newCount).run();

            let delaySeconds = Math.pow(2, newCount - 1);
            if (delaySeconds > 60) delaySeconds = 60;

            await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
            return new Response(JSON.stringify({ error: 'Unauthorized', retry_after: delaySeconds }), { status: 401 });
        }

        if (failCount > 0) {
            await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
        }

        // 2. 根据请求方法处理不同操作
        const type = url.searchParams.get('type') || 'websites'; // 'websites' or 'submissions'

        if (request.method === 'GET') {
            return await handleList(env, type);
        } else if (request.method === 'POST') {
            // POST 仅用于添加/导入到 websites 表 (submissions 一般由用户端提交，后台仅查看或删除)
            // 但为了灵活性，如果 type=submissions 也可以支持添加（暂不需要）
            return await handleAdd(request, env);
        } else if (request.method === 'PUT') {
            return await handleUpdate(request, env, type);
        } else if (request.method === 'DELETE') {
            return await handleDelete(url, env, type);
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// 获取列表
// 获取列表
async function handleList(env, type) {
    let table = 'websites';
    let orderBy = 'id DESC';

    if (type === 'submissions') {
        table = 'submissions';
    } else if (type === 'news') {
        table = 'news';
        orderBy = 'published_at DESC';
    }

    const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
    return new Response(JSON.stringify(results), { status: 200 });
}

// 添加/导入新网站 (主要针对 websites 表)
async function handleAdd(request, env) {
    const data = await request.json();

    // 1. 处理 JSON 批量导入 (识别数组)
    if (Array.isArray(data)) {
        const overwrite = new URL(request.url).searchParams.get('overwrite') === 'true';
        let successCount = 0;

        const stmtInsert = env.DB.prepare("INSERT INTO websites (name, description, invite_link, display_url) VALUES (?, ?, ?, ?)");
        const stmtInsertWithId = env.DB.prepare("INSERT INTO websites (id, name, description, invite_link, display_url) VALUES (?, ?, ?, ?, ?)");
        const stmtUpdate = env.DB.prepare("UPDATE websites SET name = ?, description = ?, invite_link = ?, display_url = ? WHERE id = ?");

        for (const item of data) {
            const id = item.id;
            const name = item.name;
            const desc = item.description || '';
            const invite = item.invite_link || item.url || ''; // 兼容 submissions
            const display = item.display_url || item.url || ''; // 兼容 submissions

            if (!name || (!invite && !display)) continue;

            try {
                if (id) {
                    if (overwrite) {
                        const res = await stmtUpdate.bind(name, desc, invite, display, id).run();
                        if (res.meta.changes > 0) {
                            successCount++;
                        } else {
                            await stmtInsertWithId.bind(id, name, desc, invite, display).run();
                            successCount++;
                        }
                    } else {
                        await stmtInsertWithId.bind(id, name, desc, invite, display).run();
                        successCount++;
                    }
                } else {
                    await stmtInsert.bind(name, desc, invite, display).run();
                    successCount++;
                }
            } catch (e) {
                console.error(`Import error for ${name}:`, e);
            }
        }
        return new Response(JSON.stringify({ success: true, count: successCount }), { status: 200 });
    }

    // 2. 单个添加
    const { name, description, invite_link, display_url } = data;
    if (!name || !invite_link || !display_url) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const res = await env.DB.prepare(
        "INSERT INTO websites (name, description, invite_link, display_url) VALUES (?, ?, ?, ?)"
    ).bind(name, description, invite_link, display_url).run();

    return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { status: 201 });
}

// 更新网站/提交 (支持修改 ID)
async function handleUpdate(request, env, type) {
    const data = await request.json();
    const { id, new_id, name, description, invite_link, display_url, url } = data; // url for submissions

    if (!id) return new Response(JSON.stringify({ error: 'Missing ID' }), { status: 400 });

    const table = type === 'submissions' ? 'submissions' : 'websites';

    // 如果修改了 ID
    if (new_id && new_id != id) {
        // 检查新 ID 是否存在
        const { results } = await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(new_id).all();
        if (results.length > 0) {
            return new Response(JSON.stringify({ error: `ID ${new_id} already exists` }), { status: 409 });
        }
    }

    const targetId = new_id || id;

    if (type === 'websites') {
        // 更新 websites
        await env.DB.prepare(
            "UPDATE websites SET id = ?, name = ?, description = ?, invite_link = ?, display_url = ? WHERE id = ?"
        ).bind(targetId, name, description, invite_link, display_url, id).run();

        // 如果 ID 变了，需要级联更新关联表
        if (new_id && new_id != id) {
            await env.DB.prepare("UPDATE likes SET card_id = ? WHERE card_id = ?").bind(new_id, id).run();
            await env.DB.prepare("UPDATE comments SET card_id = ? WHERE card_id = ?").bind(new_id, id).run();
        }
    } else if (type === 'submissions') {
        // 更新 submissions
        const targetUrl = url || display_url;
        await env.DB.prepare(
            "UPDATE submissions SET id = ?, name = ?, description = ?, invite_link = ?, url = ? WHERE id = ?"
        ).bind(targetId, name, description, invite_link, targetUrl, id).run();
    } else if (type === 'news') {
        // 更新 news (简单支持)
        const targetUrl = url || display_url;
        await env.DB.prepare(
            "UPDATE news SET id = ?, title = ?, summary = ?, url = ? WHERE id = ?"
        ).bind(targetId, name, description, targetUrl, id).run();
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// 删除 (支持批量)
async function handleDelete(url, env, type) {
    const idParam = url.searchParams.get('id'); // 单个 ID
    const idsParam = url.searchParams.get('ids'); // 多个 ID，逗号分隔

    let ids = [];
    if (idsParam) {
        ids = idsParam.split(',').map(i => i.trim()).filter(i => i);
    } else if (idParam) {
        ids = [idParam];
    }

    if (ids.length === 0) {
        return new Response(JSON.stringify({ error: 'Missing ID(s)' }), { status: 400 });
    }

    let table = 'websites';
    if (type === 'submissions') table = 'submissions';
    if (type === 'news') table = 'news';

    // 构建批量删除语句: DELETE FROM table WHERE id IN (?, ?, ?)
    const placeholders = ids.map(() => '?').join(',');
    const stmt = env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).bind(...ids);
    await stmt.run();

    // 如果是 websites，还需要删除关联数据
    if (type === 'websites') {
        const likesStmt = env.DB.prepare(`DELETE FROM likes WHERE card_id IN (${placeholders})`).bind(...ids);
        const commentsStmt = env.DB.prepare(`DELETE FROM comments WHERE card_id IN (${placeholders})`).bind(...ids);
        await likesStmt.run();
        await commentsStmt.run();
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
