export async function onRequestGet(context) {
  const { env } = context;

  // 1. 从数据库获取新闻数据
  let news = [];
  try {
    // 获取最新的 10 条新闻
    const { results } = await env.DB.prepare("SELECT * FROM news ORDER BY published_at DESC LIMIT 10").all();
    news = results || [];
  } catch (e) {
    console.error("DB Error:", e);
  }

  // 2. 格式化日期
  news.forEach(item => {
    const date = new Date(item.published_at);
    // 格式化为: "12月07日 14:30"
    item.formatted_date = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  });

  // 3. 生成 HTML
  const newsCardsHtml = news.map(item => `
      <article class="news-card">
        <div class="news-source source-${item.source.toLowerCase()}">${item.source}</div>
        <div class="news-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${item.formatted_date}
        </div>
        <h3 class="news-title">
            <a href="${item.url}" target="_blank">${item.title}</a>
        </h3>
        <p class="news-summary">${item.summary}</p>
        <div class="news-footer">
            <a href="${item.url}" target="_blank" class="read-more">
                阅读全文 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
      </article>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI 前沿动态 · 自由空间</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/news.css">
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>自由空间</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">自由AI空间·开放分享平台</p>
        </div>
      </div>
      <nav>
        <a href="/">API中转汇聚</a>
        <a href="/news" class="active">AI 前沿动态</a>
        <a href="/vpn.html">VPN</a>
        <a href="/guide.html">配置指南</a>
      </nav>
      <div class="github-link">
        <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </header>

    <div class="news-container">
        <div class="news-header">
            <div>
                <h1>AI 前沿动态</h1>
                <p>汇聚 TechCrunch 与 36Kr 的最新 AI 资讯，实时翻译，全球同步。</p>
            </div>
            <button class="refresh-btn" onclick="triggerUpdate(this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                刷新资讯
            </button>
        </div>

        ${news.length > 0 ? newsCardsHtml : '<div style="text-align:center; padding:40px; color:var(--text-muted)">暂无新闻，请点击刷新按钮获取最新资讯。</div>'}
    </div>
  </div>

  <script>
    async function triggerUpdate(btn) {
        if (btn.classList.contains('loading')) return;
        
        btn.classList.add('loading');
        const originalText = btn.innerHTML;
        btn.innerHTML = '正在获取...';
        
        try {
            const res = await fetch('/api/admin/update_news');
            const data = await res.json();
            
            if (res.ok) {
                alert(\`更新成功！获取了 \${data.fetched} 条，新增 \${data.inserted} 条。\`);
                window.location.reload();
            } else if (res.status === 429) {
                alert(data.message || '刷新太频繁，请稍后再试。');
            } else {
                alert('更新失败：' + (data.error || '未知错误'));
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = originalText;
        }
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}
