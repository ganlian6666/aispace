export async function onRequest(context) {
    const { env } = context;
    const apiKey = env.ADMIN_PASSWORD; // 简单复用管理员密码作为鉴权，或者你可以设置新的 SECRET

    // 简单的鉴权，防止被恶意频繁触发
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');

    // 如果是 Cron Trigger 自动触发，通常不需要 key，但在 Pages 中我们通常通过 URL 触发
    // 这里为了演示方便，如果提供了 key 且匹配 ADMIN_PASSWORD，或者在本地开发环境，则允许执行
    // 注意：实际生产中建议使用 Cloudflare Access 或更严格的验证
    if (env.ADMIN_PASSWORD && key !== env.ADMIN_PASSWORD) {
        return new Response('Unauthorized', { status: 401 });
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

            // 过滤 AI 相关关键词 (更严格，优先匹配标题)
            krItems = krItems.filter(item => {
                const title = item.title.toLowerCase();
                const summary = item.summary.toLowerCase();

                // 必须匹配的关键词组
                const keywords = ['ai', '人工智能', '模型', 'gpt', '大语言', '算法', '神经网络', 'deepmind', 'openai', 'anthropic'];

                // 标题匹配权重高
                if (keywords.some(k => title.includes(k))) return true;

                // 摘要匹配需要更严格（比如出现多次，或者配合其他词），这里简单起见，
                // 如果标题没命中，摘要里必须包含核心词
                if (keywords.some(k => summary.includes(k))) return true;

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

        return new Response(JSON.stringify({
            status: 'success',
            fetched: newsItems.length,
            processed: processedNews.length,
            inserted: insertedCount
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

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
