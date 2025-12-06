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

            // 过滤 AI 相关关键词
            krItems = krItems.filter(item => {
                const text = (item.title + item.summary).toLowerCase();
                return text.includes('ai') ||
                    text.includes('人工智能') ||
                    text.includes('模型') ||
                    text.includes('gpt') ||
                    text.includes('大语言');
            });
            newsItems.push(...krItems);
        } catch (e) {
            console.error('Failed to fetch 36Kr:', e);
        }

        // 3. Process & Translate
        // 按时间倒序
        newsItems.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        // 取前 15 条进行处理（避免翻译太多）
        const topNews = newsItems.slice(0, 15);
        const processedNews = [];

        for (const item of topNews) {
            // 如果是英文 (TechCrunch)，且有 AI 环境，则翻译
            if (item.source === 'TechCrunch' && env.AI) {
                try {
                    // 翻译标题
                    const titleResp = await env.AI.run('@cf/meta/m2m100-1.2b', {
                        text: item.title,
                        source_lang: 'en',
                        target_lang: 'zh'
                    });
                    item.title = titleResp.translated_text || item.title;

                    // 翻译摘要 (如果有)
                    if (item.summary) {
                        // 截断一下摘要，防止太长耗费 token 或翻译超时
                        const summaryText = item.summary.substring(0, 200);
                        const summaryResp = await env.AI.run('@cf/meta/m2m100-1.2b', {
                            text: summaryText,
                            source_lang: 'en',
                            target_lang: 'zh'
                        });
                        item.summary = summaryResp.translated_text || item.summary;
                    }
                } catch (aiErr) {
                    console.error('AI Translation failed:', aiErr);
                    // 失败了就保留原文
                }
            }
            processedNews.push(item);
        }

        // 4. Save to DB
        // 我们只保留最新的 10 条在数据库里？或者保留历史记录但只取前 10？
        // 策略：插入新数据，忽略重复 (url UNIQUE)。
        // 然后删除旧数据，只保留最新的 50 条，以免数据库膨胀。

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
function parseRSS(xml, source) {
    const items = [];
    // 匹配 <item>...</item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemContent = match[1];

        // 提取 Title
        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
        const title = titleMatch ? decodeHTML(titleMatch[1]) : 'No Title';

        // 提取 Link
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
        const link = linkMatch ? linkMatch[1].trim() : '';

        // 提取 PubDate
        const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = dateMatch ? new Date(dateMatch[1]) : new Date();

        // 提取 Description/Summary
        // 很多 RSS description 包含 HTML，我们需要去除 HTML 标签
        const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || itemContent.match(/<description>(.*?)<\/description>/);
        let summary = descMatch ? descMatch[1] : '';

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
