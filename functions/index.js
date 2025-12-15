import { getLocale, t } from './utils/i18n.js';

export async function onRequestGet(context) {
  const { env, request } = context;

  // 0. Language Detection
  const cookie = request.headers.get('Cookie');
  const locale = getLocale(request.headers.get('Accept-Language'), cookie);
  const T = (key, vars) => t(locale, key, vars);

  // 1. Get sites from DB
  let sites = [];
  let likesMap = {};
  let commentsMap = {};

  try {
    const { results: siteResults } = await env.DB.prepare("SELECT * FROM websites").all();
    sites = siteResults || [];

    const { results: likeResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM likes GROUP BY card_id").all();
    likeResults.forEach(r => { likesMap[r.card_id] = r.count; });

    const { results: commentResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM comments GROUP BY card_id").all();
    commentResults.forEach(r => { commentsMap[r.card_id] = r.count; });

    sites.forEach(site => {
      if (site.last_checked) {
        const date = new Date(site.last_checked);
        site.formatted_date = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      } else {
        site.formatted_date = T('text_never_checked');
      }
    });

  } catch (e) {
    console.error("DB Error:", e);
  }

  // 2. Sort
  sites.sort((a, b) => {
    const statusA = (a.status === 'online') ? 1 : 0;
    const statusB = (b.status === 'online') ? 1 : 0;
    if (statusA !== statusB) return statusB - statusA;

    const likeA = likesMap[a.id] || 0;
    const likeB = likesMap[b.id] || 0;
    if (likeB !== likeA) return likeB - likeA;

    return a.id - b.id;
  });

  // 4. Generate HTML
  const cardsHtml = sites.map(site => `
      <article class="card" data-card-id="${site.id}">
        <div class="card-head">
          <h3>${site.name}</h3>
          <div class="status"><div>${T('status_checking')}</div></div>
        </div>
        <p>${site.description}</p>
        <div class="link-block">
          <a href="${site.invite_link}" target="_blank">${site.display_url}</a>
          <button type="button" onclick="copyLink(this)">${T('btn_invite_copy')}</button>
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <button class="action-btn like-btn" onclick="toggleLike(${site.id})">
              <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span class="like-count">${likesMap[site.id] || 0}</span>
            </button>
            <button class="action-btn" onclick="checkNicknameAndToggleComments(${site.id})">
              <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span class="comment-count">${commentsMap[site.id] || 0}</span>
            </button>
          </div>
          <div>${T('text_last_checked')} ${site.formatted_date}</div>
        </div>
        <div class="comments-section" id="comments-${site.id}">
          <div class="comment-list"></div>
          <div class="comment-form">
            <div class="nickname-display" style="display:none; align-items:center; gap:8px; margin-bottom:8px; font-size:13px; color:var(--text-muted);">
                <span>${T('nickname_current')}: <b class="current-nickname"></b></span>
                <button onclick="openNicknameModal()" style="background:none; border:none; color:var(--accent-glow); cursor:pointer; padding:0; font-size:12px;">${T('btn_modify')}</button>
            </div>
            <div style="display:flex; gap:8px;">
                <input type="text" class="comment-input" placeholder="${T('comment_placeholder')}" onkeypress="if(event.key==='Enter') postComment(${site.id})">
                <button class="comment-submit" onclick="postComment(${site.id})">${T('btn_send')}</button>
            </div>
          </div>
        </div>
      </article>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T('home_title')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
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
        <a href="/" class="active">${T('nav_home')}</a>
        <a href="/news">${T('nav_news')}</a>
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

    <section class="hero">
      <div>
        <h1>${T('hero_title')}</h1>
        <p>${T('hero_subtitle')}</p>
      </div>
      <div class="submit-wrapper" style="display:flex; align-items:center;">
        <span class="submit-hint">${T('submit_hint')}</span>
        <button class="btn-primary" onclick="openModal('submitModal')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          ${T('btn_submit')}
        </button>
      </div>
    </section>

    <div class="card-grid">
      ${cardsHtml}
    </div>
  </div>

  <!-- Submission Modal -->
  <div class="modal-backdrop" id="submitModal">
    <div class="modal">
      <h2>${T('modal_submit_title')}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T('modal_submit_desc')}
      </p>
      <form id="submitForm" onsubmit="submitWebsite(event)">
        <div class="form-group">
          <label>${T('label_name')}</label>
          <input type="text" name="name" class="form-control" placeholder="${T('placeholder_name')}" required>
        </div>
        <div class="form-group">
          <label>${T('label_url')}</label>
          <input type="url" name="url" class="form-control" placeholder="${T('placeholder_url')}" required>
        </div>
        <div class="form-group">
          <label>${T('label_invite')}</label>
          <input type="url" name="invite_link" class="form-control" placeholder="${T('placeholder_invite')}">
        </div>
        <div class="form-group">
          <label>${T('label_desc')}</label>
          <textarea name="description" class="form-control" rows="3" placeholder="${T('placeholder_desc')}"></textarea>
        </div>
        <div class="modal-footer" style="justify-content: space-between;">
          <button type="button" class="btn-secondary" style="border-style: dashed;" onclick="openFeedbackModal()">${T('btn_feedback')}</button>
          <div style="display: flex; gap: 12px;">
             <button type="button" class="btn-secondary" onclick="closeModal('submitModal')">${T('btn_cancel')}</button>
             <button type="submit" class="btn-primary">${T('btn_submit_confirm')}</button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- Feedback Modal -->
  <div class="modal-backdrop" id="feedbackModal">
    <div class="modal">
      <h2>${T('modal_feedback_title')}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T('modal_feedback_desc')}
      </p>
      <form id="feedbackForm" onsubmit="submitFeedback(event)">
        <div class="form-group">
          <label>${T('label_feedback_content')}</label>
          <textarea name="content" class="form-control" rows="4" placeholder="${T('placeholder_feedback_content')}" required></textarea>
        </div>
        <div class="form-group">
          <label>${T('label_contact')}</label>
          <input type="text" name="contact" class="form-control" placeholder="${T('placeholder_contact')}">
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="closeModal('feedbackModal')">${T('btn_cancel')}</button>
          <button type="submit" class="btn-primary">${T('btn_send_feedback')}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Nickname Modal -->
  <div class="modal-backdrop" id="nicknameModal">
    <div class="modal">
      <h2>${T('modal_nickname_title')}</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        ${T('modal_nickname_desc')}
      </p>
      <div class="form-group">
        <label>${T('label_nickname')}</label>
        <input type="text" id="nicknameInput" class="form-control" placeholder="${T('placeholder_nickname')}" maxlength="20" onkeypress="if(event.key==='Enter') saveNickname()">
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button type="button" class="btn-secondary" style="border-style: dashed;" onclick="setAnonymous()">${T('btn_anonymous')}</button>
        <div style="display: flex; gap: 12px;">
            <button type="button" class="btn-secondary" onclick="closeModal('nicknameModal')">${T('btn_cancel')}</button>
            <button type="button" class="btn-primary" onclick="saveNickname()">${T('btn_save')}</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let pendingCommentCardId = null;

    // Language Switcher Logic
    function switchLanguage() {
        // Toggle logic: current ${locale} -> target ${locale === 'zh' ? 'en' : 'zh'}
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        
        // Set cookie for 1 year
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        
        // Reload to apply
        window.location.reload();
    }

    // 复制链接功能
    function copyLink(button) {
      const linkBlock = button.parentElement;
      const link = linkBlock.querySelector('a').href;
      navigator.clipboard.writeText(link).then(() => {
        const originalText = button.textContent;
        button.textContent = "${T('btn_copied')}";
        button.style.background = 'rgba(69, 224, 255, 0.3)';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 1500);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        button.textContent = "${T('btn_copied')}";
        setTimeout(() => { button.textContent = "${T('btn_invite_copy')}"; }, 1500);
      });
    }

    // Modal Logic
    function openModal(id) {
      document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    // Nickname Logic
    function checkNicknameAndToggleComments(cardId) {
      const nickname = localStorage.getItem('user_nickname');
      if (!nickname) {
        pendingCommentCardId = cardId;
        openModal('nicknameModal');
      } else {
        toggleComments(cardId);
      }
    }

    function openNicknameModal() {
        pendingCommentCardId = null; // Just changing nickname
        const nickname = localStorage.getItem('user_nickname') || '';
        document.getElementById('nicknameInput').value = nickname;
        openModal('nicknameModal');
    }

    function setAnonymous() {
      localStorage.setItem('user_nickname', 'anonymous');
      closeModal('nicknameModal');
      
      // Update UI
      document.querySelectorAll('.current-nickname').forEach(el => el.textContent = 'anonymous');

      if (pendingCommentCardId) {
        toggleComments(pendingCommentCardId);
        pendingCommentCardId = null;
      }
    }

    function saveNickname() {
      const input = document.getElementById('nicknameInput');
      const name = input.value.trim();
      if (!name) {
        alert("${T('alert_nickname_required')}");
        return;
      }
      localStorage.setItem('user_nickname', name);
      closeModal('nicknameModal');
      
      // Update UI
      document.querySelectorAll('.current-nickname').forEach(el => el.textContent = name);

      if (pendingCommentCardId) {
        toggleComments(pendingCommentCardId);
        pendingCommentCardId = null;
      }
    }

    // Submission Logic
    async function submitWebsite(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "${T('loading')}";
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert("${T('alert_submit_success')}");
          closeModal('submitModal');
          form.reset();
        } else {
          const err = await res.json();
          alert("${T('alert_submit_fail')}: " + (err.error || "${T('alert_network_error')}"));
        }
      } catch (e) {
        alert("${T('alert_network_error')}");
      } finally {
        btn.disabled = false;
        btn.textContent = "${T('btn_submit_confirm')}";
      }
    }

    // Feedback Logic
    function openFeedbackModal() {
      // Close submit modal if open, optional but cleaner
      closeModal('submitModal');
      openModal('feedbackModal');
    }

    async function submitFeedback(event) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const btn = form.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = "${T('loading')}";

      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          alert("${T('alert_feedback_success')}");
          closeModal('feedbackModal');
          form.reset();
        } else {
          const err = await res.json();
          alert("${T('alert_submit_fail')}: " + (err.error || 'Unknown Error'));
        }
      } catch (e) {
        alert("${T('alert_network_error')}");
      } finally {
        btn.disabled = false;
        btn.textContent = "${T('btn_send_feedback')}";
      }
    }

    // Likes Logic
    async function toggleLike(cardId) {
      const btn = document.querySelector(\`.card[data-card-id="\${cardId}"] .like-btn\`);
      const countSpan = btn.querySelector('.like-count');
      try {
        const res = await fetch('/api/likes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId })
        });
        if (res.ok) {
          const data = await res.json();
          countSpan.textContent = data.count;
          btn.classList.add('liked');
        } else {
          const err = await res.json();
          if (res.status === 429) {
            alert("${T('alert_like_limit')}");
          } else {
            console.error(err);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Comments Logic
    async function toggleComments(cardId) {
      const section = document.getElementById(\`comments-\${cardId}\`);
      const isActive = section.classList.contains('active');
      
      // Update nickname display
      const nickname = localStorage.getItem('user_nickname');
      if (nickname) {
        section.querySelector('.nickname-display').style.display = 'flex';
        section.querySelector('.current-nickname').textContent = nickname;
      }

      if (!isActive) {
        section.classList.add('active');
        loadComments(cardId);
      } else {
        section.classList.remove('active');
      }
    }

    async function loadComments(cardId) {
      const list = document.querySelector(\`#comments-\${cardId} .comment-list\`);
      list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">${T('loading')}</div>';
      try {
        const res = await fetch(\`/api/comments?card_id=\${cardId}\`);
        const comments = await res.json();
        list.innerHTML = '';
        if (comments.length === 0) {
          list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">${T('no_comments')}</div>';
          return;
        }
        comments.forEach(c => {
          const div = document.createElement('div');
          div.className = 'comment-item';
          div.innerHTML = \`
            <div class="comment-header">
              <span>\${c.nickname || 'Anonymous'}</span>
              <span>\${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div>\${c.content}</div>
          \`;
          list.appendChild(div);
        });
      } catch (e) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:red">Load failed</div>';
      }
    }

    async function postComment(cardId) {
      const section = document.getElementById(\`comments-\${cardId}\`);
      const input = section.querySelector('.comment-input');
      const content = input.value.trim();
      const nickname = localStorage.getItem('user_nickname');

      if (!content) return;
      if (!nickname) {
          checkNicknameAndToggleComments(cardId);
          return;
      }

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ card_id: cardId, content, nickname })
        });
        if (res.ok) {
          input.value = '';
          loadComments(cardId);
          // 立即更新评论数显示
          const countSpan = document.querySelector(\`.card[data-card-id="\${cardId}"] .comment-count\`);
          if (countSpan) {
            const current = parseInt(countSpan.textContent) || 0;
            countSpan.textContent = current + 1;
          }
        } else {
          const err = await res.json();
          if (res.status === 429) {
            alert("${T('alert_comment_limit')}");
          } else {
            alert('Error: ' + err.error);
          }
        }
      } catch (e) {
        alert("${T('alert_network_error')}");
      }
    }

    // Status Check Logic
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const statuses = await res.json();
        statuses.forEach(site => {
          const card = document.querySelector(\`.card[data-card-id="\${site.card_id}"]\`);
          if (!card) return;
          const statusSpan = card.querySelector('.status');
          if (site.status === 'online') {
            statusSpan.innerHTML = \`<div>在线</div><div class="latency">\${site.latency}ms</div>\`;
            statusSpan.style.color = '#4ade80';
            statusSpan.style.background = 'rgba(74, 222, 128, 0.15)';
            statusSpan.style.borderColor = 'rgba(74, 222, 128, 0.5)';
          } else {
            statusSpan.innerHTML = \`<div>维护中</div>\`;
            statusSpan.style.color = '#f87171';
            statusSpan.style.background = 'rgba(248, 113, 113, 0.15)';
            statusSpan.style.borderColor = 'rgba(248, 113, 113, 0.5)';
          }
        });
      } catch (e) {
        console.error('Failed to load status', e);
      }
    }

    // Init
    loadStatus();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}
