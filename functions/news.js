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

    const container = document.querySelector('.news-container');
    // Keep the header, clear the cards
    const header = container.querySelector('.news-header');
    container.innerHTML = '';
    container.appendChild(header);

    news.forEach((item, index) => {
        const date = new Date(item.published_at).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const card = document.createElement('article');
        card.className = 'news-card';
        
        // Add refresh button to the first card
        let refreshBtnHtml = '';
        if (index === 0) {
            refreshBtnHtml = `
    < button id = "card-refresh-btn" class="card-refresh-btn" title = "刷新资讯" onclick = "triggerUpdate(this)" >
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 1 20.49 15"></path>
                    </svg>
                    <span>刷新</span>
                </button >
    `;
        }

        card.innerHTML = `
    < div class="news-header-row" >
      <div class="news-meta">
        <span class="news-source source-${item.source.toLowerCase()}">${item.source}</span>
        <span class="news-time">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${date}
        </span>
      </div>
                ${ refreshBtnHtml }
            </div >
            <h3 class="news-title">
                <a href="${item.url}" target="_blank">${item.title}</a>
            </h3>
            <p class="news-summary">${item.summary || ''}</p>
            <div class="news-footer">
                <a href="${item.url}" target="_blank" class="read-more">
                    阅读全文 
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </a>
            </div>
  `;
        container.appendChild(card);
    });
}

async function triggerUpdate(btn) {
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '刷新中...';
    }

    try {
        const response = await fetch('/api/admin/update_news');
        const data = await response.json();

        if (response.ok) {
            alert(`刷新成功！新增 ${ data.inserted } 条资讯`);
            // Reload page to show new data
            window.location.reload();
        } else if (response.status === 429) {
            alert(data.error || '刷新太频繁，请稍后再试');
        } else {
            alert('刷新失败: ' + (data.error || '未知错误'));
        }
    } catch (error) {
        console.error('Error refreshing news:', error);
        alert('刷新失败，请检查网络');
    } finally {
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.innerHTML = `
    < svg viewBox = "0 0 24 24" width = "16" height = "16" stroke = "currentColor" stroke - width="2" fill = "none" >
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 1 20.49 15"></path>
                </svg >
    <span>刷新</span>
  `;
        }
    }
}
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}
