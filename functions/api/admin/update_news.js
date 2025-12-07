export async function onRequest(context) {
    const { env } = context;
    // 获取客户端 IP
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown';

    // 检查频率限制 (每小时 1 次)
    // 如果是 Cron Trigger (key=ADMIN_PASSWORD) 或 Scheduler Worker (带 key)，则跳过限制
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');
    const isAuthorized = env.ADMIN_PASSWORD && key === env.ADMIN_PASSWORD;

    if (!isAuthorized) {
        // 检查数据库中的记录
        const limitRecord = await env.DB.prepare('SELECT last_updated FROM rate_limits WHERE ip = ?').bind(clientIP).first();

        if (limitRecord) {
            const lastUpdated = new Date(limitRecord.last_updated);
            const now = new Date();
            const diffMs = now - lastUpdated;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 60) {
                return new Response(JSON.stringify({
                    error: 'Too Many Requests',
                    message: `已经是最新信息啦，请不要频繁刷新，谢谢！`,
                    remaining_minutes: 60 - diffMins
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    }

    try {
        const newsItems = [];

        // 1. Fetch TechCrunch AI (RSS)
        try {
            const tcRes = await fetch('https://techcrunch.com/category/artificial-intelligence/feed/');
            const tcText = await tcRes.text();
            const tcItems = parseRSS(tcText, 'TechCrunch');
            newsItems.push(...tcItems);
        } catch (e) {
            console.error('Failed to fetch TechCrunch:', e);
        }

        // 2. Fetch 36Kr (RSS)
        try {
            // 36Kr 官方 Feed, 或者使用 RSSHub: https://rsshub.app/36kr/newsflashes
            // 这里尝试直接抓取 36Kr 的 HTML 或 RSS。由于 36Kr RSS 经常变动，我们假设一个稳定的源。
            // 如果直接 RSS 不行，可以使用 RSSHub 的 URL (如果自建了 RSSHub)。
            // 暂时使用 36Kr 官方 RSS: https://36kr.com/feed (可能包含所有新闻)
            const krRes = await fetch('https://36kr.com/feed');
            const krText = await krRes.text();
            let krItems = parseRSS(krText, '36Kr');

            // 过滤 AI 相关关键词 (严格模式：只匹配标题)
            krItems = krItems.filter(item => {
                const title = item.title.toLowerCase();

                // 必须匹配的关键词组
                const keywords = [
                    'ai', '人工智能', '模型', 'gpt', '大语言', '神经网络',
                    'deepmind', 'openai', 'anthropic', 'deepseek', 'gemini',
                    'codex', 'claude', '强化学习', 'sutton', 'karpathy', 'ilya',
                    'llm', 'transformer'
                ];

                // 只检查标题
                if (keywords.some(k => title.includes(k))) return true;

                return false;
            });
            newsItems.push(...krItems);
        } catch (e) {
            console.error('Failed to fetch 36Kr:', e);
        }

        // 3. Process (Sort & Clean)
        // 按时间倒序
        newsItems.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        // 取前 15 条
        const topNews = newsItems.slice(0, 15);
        const processedNews = [];

        for (const item of topNews) {
            // 暴力清洗 URL: 去除 CDATA 标记和可能的空白
            if (item.url) {
                item.url = item.url.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
            }

            // 不再进行 AI 翻译，直接使用原文
            processedNews.push(item);
        }

        // 4. Save to DB
        const stmtInsert = env.DB.prepare(`
      INSERT OR IGNORE INTO news (title, summary, source, url, published_at)
      VALUES (?, ?, ?, ?, ?)
    `);

        let insertedCount = 0;
        for (const item of processedNews) {
            const res = await stmtInsert.bind(
                item.title,
                item.summary,
                item.source,
                item.url,
                item.published_at.toISOString()
            ).run();
            if (res.meta.changes > 0) insertedCount++;
        }

        // 清理旧数据 (保留最新的 50 条)
        await env.DB.prepare(`
      DELETE FROM news 
      WHERE id NOT IN (
        SELECT id FROM news ORDER BY published_at DESC LIMIT 50
      )
    `).run();

        const response = new Response(JSON.stringify({
            status: 'success',
            fetched: newsItems.length,
            processed: processedNews.length,
            inserted: insertedCount
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

        // 更新频率限制记录 (仅当非管理员触发时)
        if (!isAuthorized) {
            await env.DB.prepare(`
                INSERT INTO rate_limits (ip, last_updated) VALUES (?, datetime('now'))
                ON CONFLICT(ip) DO UPDATE SET last_updated = datetime('now')
            `).bind(clientIP).run();
        }

        return response;

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}



// 简单的 RSS 解析器 (Regex based)
// 简单的 RSS 解析器 (Regex based)
function parseRSS(xml, source) {
    const items = [];
    // 匹配 <item>...</item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];

        // 提取 Title
        // 优先匹配 CDATA，然后是普通标签
        let title = 'No Title';
        const titleCdataMatch = itemContent.match(/<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/);
        const titleSimpleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);

        if (titleCdataMatch) {
            title = titleCdataMatch[1].trim();
        } else if (titleSimpleMatch) {
            title = decodeHTML(titleSimpleMatch[1].trim());
        }

        // 提取 Link
        // 同样优先匹配 CDATA (有些 RSS 会把 link 也放 CDATA)
        let link = '';
        const linkCdataMatch = itemContent.match(/<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/);
        const linkSimpleMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);

        if (linkCdataMatch) {
            link = linkCdataMatch[1].trim();
        } else if (linkSimpleMatch) {
            link = linkSimpleMatch[1].trim();
        }

        // 提取 PubDate
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = dateMatch ? new Date(dateMatch[1]) : new Date();

        // 提取 Description/Summary
        let summary = '';
        const descCdataMatch = itemContent.match(/<description>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/description>/);
        const descSimpleMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);

        if (descCdataMatch) {
            summary = descCdataMatch[1];
        } else if (descSimpleMatch) {
            summary = descSimpleMatch[1];
        }

        // 去除 HTML 标签
        summary = summary.replace(/<[^>]+>/g, '');
        // 解码 HTML 实体
        summary = decodeHTML(summary);
        // 截取前 150 字
        summary = summary.substring(0, 150) + (summary.length > 150 ? '...' : '');

        if (title && link) {
            items.push({
                title,
                url: link,
                published_at: pubDate,
                summary,
                source
            });
        }
    }
    return items;
}

function decodeHTML(html) {
    const map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };
    return html.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, m => map[m]);
}
