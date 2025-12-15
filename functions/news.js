import { getLocale, t } from './utils/i18n.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  // 0. Language Detection
  const cookie = request.headers.get('Cookie');
  const locale = getLocale(request.headers.get('Accept-Language'), cookie);
  const T = (key, vars) => t(locale, key, vars);

  // 1. 从数据库获取新闻数据
  let news = [];
  try {
    // 获取最新的 15 条新闻 (Page 1)
    const { results } = await env.DB.prepare("SELECT * FROM news ORDER BY published_at DESC LIMIT 15").all();
    news = results || [];
  } catch (e) {
    console.error("DB Error:", e);
  }

  // 2. 格式化日期 helper
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  news.forEach(item => {
    item.formatted_date = formatDate(item.published_at);
  });

  // 3. 生成 HTML Helper
  const renderCard = (item) => `
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
                ${T('btn_read_more')} 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
      </article>
  `;

  const newsCardsHtml = news.map(renderCard).join('');

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T('news_page_title')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/news.css">
  <style>
    .lang-btn {
        background: rgba(255,255,255,0.1);
        border: 1px solid var(--card-border);
        color: var(--text-main);
        padding: 4px 12px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
        margin-left: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .lang-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: var(--accent-glow);
    }
  </style>
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
          <strong>${T('brand_name')}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">${T('brand_subtitle')}</p>
        </div>
      </div>
      <nav>
        <a href="/">${T('nav_home')}</a>
        <a href="/news" class="active">${T('nav_news')}</a>
        <a href="/vpn">${T('nav_vpn')}</a>
        <a href="/guide">${T('nav_guide')}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>${T('github_text')}</span>
            </a>
        </div>
        <button class="lang-btn" onclick="switchLanguage()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            ${locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>
    </header>

    <div class="news-container">
        <div class="news-header">
            <div>
                <h1>${T('news_header')}</h1>
                <p>${T('news_subtitle')}</p>
            </div>
            <button class="refresh-btn" onclick="triggerUpdate(this)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                ${T('btn_refresh_news')}
            </button>
        </div>

        <div id="news-list">
            ${news.length > 0 ? newsCardsHtml : `<div style="text-align:center; padding:40px; color:var(--text-muted)">${T('text_no_news')}</div>`}
        </div>

        <div style="text-align:center; margin-top:30px;">
           <button id="btn-load-more" onclick="loadMore()" class="refresh-btn" style="width:auto; padding:10px 30px; ${news.length < 15 ? 'display:none;' : ''}">${T('btn_load_more')}</button>
        </div>
    </div>
  </div>

  <script>
    let currentPage = 1;

    // Language Switcher Logic
    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }

    async function triggerUpdate(btn) {
        if (btn.classList.contains('loading')) return;
        
        btn.classList.add('loading');
        const originalText = btn.innerHTML;
        btn.innerHTML = "${T('btn_refreshing')}";
        
        try {
            const res = await fetch('/api/admin/update_news');
            const data = await res.json();
            
            if (res.ok) {
                let msg = "${T('alert_update_success')}";
                msg = msg.replace('{fetched}', data.fetched).replace('{inserted}', data.inserted);
                alert(msg);
                window.location.reload();
            } else if (res.status === 429) {
                alert(data.message || "${T('alert_rate_limit')}");
            } else {
                alert('Update Failed: ' + (data.error || 'Unknown Error'));
            }
        } catch (e) {
            alert("${T('alert_network_error')}");
        } finally {
            btn.classList.remove('loading');
            btn.innerHTML = originalText;
        }
    }

    async function loadMore() {
        currentPage++;
        const btn = document.getElementById('btn-load-more');
        btn.innerText = "${T('loading')}";
        btn.disabled = true;

        try {
            const res = await fetch(\`/api/news?page=\${currentPage}\`);
            if (!res.ok) throw new Error('Load failed');
            const newItems = await res.json();

            if (newItems.length > 0) {
                const list = document.getElementById('news-list');
                const html = newItems.map(item => \`
      <article class="news-card">
        <div class="news-source source-\${item.source.toLowerCase()}">\${item.source}</div>
        <div class="news-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            \${item.formatted_date}
        </div>
        <h3 class="news-title">
            <a href="\${item.url}" target="_blank">\${item.title}</a>
        </h3>
        <p class="news-summary">\${item.summary}</p>
        <div class="news-footer">
            <a href="\${item.url}" target="_blank" class="read-more">
                ${T('btn_read_more')} 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </a>
        </div>
      </article>\`).join('');
                list.insertAdjacentHTML('beforeend', html);
            }

            // Hide button if we reached end or page 3 (max 45 items = 3 pages of 15)
            if (newItems.length < 15 || currentPage >= 3) {
                btn.style.display = 'none';
            } else {
                btn.innerText = "${T('btn_load_more')}";
                btn.disabled = false;
            }

        } catch (e) {
            alert('Load Failed');
            btn.innerText = "${T('btn_load_more')}";
            btn.disabled = false;
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
