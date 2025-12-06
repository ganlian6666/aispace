export async function onRequestGet(context) {
  const { env } = context;

  // 1. 从数据库获取站点数据
  let sites = [];
  let likesMap = {};
  let commentsMap = {};

  try {
    // 获取所有网站信息
    const { results: siteResults } = await env.DB.prepare("SELECT * FROM websites").all();
    sites = siteResults || [];

    // 获取点赞数据
    const { results: likeResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM likes GROUP BY card_id").all();
    likeResults.forEach(r => {
      likesMap[r.card_id] = r.count;
    });

    // 获取评论数据
    const { results: commentResults } = await env.DB.prepare("SELECT card_id, count(*) as count FROM comments GROUP BY card_id").all();
    commentResults.forEach(r => {
      commentsMap[r.card_id] = r.count;
    });

    // 格式化 last_checked 日期
    sites.forEach(site => {
      if (site.last_checked) {
        const date = new Date(site.last_checked);
        site.formatted_date = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      } else {
        site.formatted_date = '从未检测';
      }
    });

  } catch (e) {
    console.error("DB Error:", e);
    // 如果数据库挂了，sites 为空，页面会显示空白，但不会报错崩掉
  }

  // 2. 排序：状态(在线优先) -> 点赞数倒序 -> ID 正序
  sites.sort((a, b) => {
    // 状态权重：online = 1, 其他(offline/checking) = 0
    // 注意：新添加的网站 status 可能是 null，视为 0
    const statusA = (a.status === 'online') ? 1 : 0;
    const statusB = (b.status === 'online') ? 1 : 0;

    // 如果状态不同，在线的排前面
    if (statusA !== statusB) {
      return statusB - statusA;
    }

    // 如果状态相同，按点赞数倒序
    const likeA = likesMap[a.id] || 0;
    const likeB = likesMap[b.id] || 0;
    if (likeB !== likeA) return likeB - likeA;

    // 最后按 ID 排序
    return a.id - b.id;
  });

  // 4. 生成 HTML
  const cardsHtml = sites.map(site => `
      <article class="card" data-card-id="${site.id}">
        <div class="card-head">
          <h3>${site.name}</h3>
          <div class="status"><div>检测中</div></div>
        </div>
        <p>${site.description}</p>
        <div class="link-block">
          <a href="${site.invite_link}" target="_blank">${site.display_url}</a>
          <button type="button" onclick="copyLink(this)">邀请链接 · 复制</button>
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
          <div>最后检测 ${site.formatted_date}</div>
        </div>
        <div class="comments-section" id="comments-${site.id}">
          <div class="comment-list"></div>
          <div class="comment-form">
            <div class="nickname-display" style="display:none; align-items:center; gap:8px; margin-bottom:8px; font-size:13px; color:var(--text-muted);">
                <span>当前昵称: <b class="current-nickname"></b></span>
                <button onclick="openNicknameModal()" style="background:none; border:none; color:var(--accent-glow); cursor:pointer; padding:0; font-size:12px;">[修改]</button>
            </div>
            <div style="display:flex; gap:8px;">
                <input type="text" class="comment-input" placeholder="输入评论..." onkeypress="if(event.key==='Enter') postComment(${site.id})">
                <button class="comment-submit" onclick="postComment(${site.id})">发送</button>
            </div>
          </div>
        </div>
      </article>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API中转汇聚 · 自由空间</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css">
</head>
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
        <a href="index.html" class="active">API中转汇聚</a>
        <a href="vpn.html">VPN</a>
        <a href="guide.html">配置指南</a>
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

    <section class="hero">
      <div>
        <h1>不定期分享优质API接口</h1>
        <p>每一条 API 都经过人工检测，基本支持claude code，codex和国内优质AI模型，请放心使用！</p>
      </div>
      <div class="submit-wrapper" style="display:flex; align-items:center;">
        <span class="submit-hint">欢迎分享稳定高效的中转站!</span>
        <button class="btn-primary" onclick="openModal('submitModal')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          提交网站
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
      <h2>提交新的中转站</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        欢迎分享你的中转站，提交后需要审核验证，通过的会将你的邀请链接挂到主页上！
      </p>
      <form id="submitForm" onsubmit="submitWebsite(event)">
        <div class="form-group">
          <label>中转站名称 *</label>
          <input type="text" name="name" class="form-control" placeholder="例如: OpenAI官方API" required>
        </div>
        <div class="form-group">
          <label>网站地址 *</label>
          <input type="url" name="url" class="form-control" placeholder="例如: https://chatgpt.com/" required>
        </div>
        <div class="form-group">
          <label>邀请链接</label>
          <input type="url" name="invite_link" class="form-control" placeholder="例如: https://chatgpt.com/invite?code=abc">
        </div>
        <div class="form-group">
          <label>简单描述</label>
          <textarea name="description" class="form-control" rows="3" placeholder="简单介绍一下..."></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" onclick="closeModal('submitModal')">取消</button>
          <button type="submit" class="btn-primary">提交</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Nickname Modal -->
  <div class="modal-backdrop" id="nicknameModal">
    <div class="modal">
      <h2>设置昵称</h2>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;">
        请设置一个昵称以便发表评论。设置后将自动保存。
      </p>
      <div class="form-group">
        <label>昵称 *</label>
        <input type="text" id="nicknameInput" class="form-control" placeholder="例如: 匿名用户" maxlength="20" onkeypress="if(event.key==='Enter') saveNickname()">
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button type="button" class="btn-secondary" style="border-style: dashed;" onclick="setAnonymous()">匿名访问</button>
        <div style="display: flex; gap: 12px;">
            <button type="button" class="btn-secondary" onclick="closeModal('nicknameModal')">取消</button>
            <button type="button" class="btn-primary" onclick="saveNickname()">保存</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let pendingCommentCardId = null;

    // 复制链接功能
    function copyLink(button) {
      const linkBlock = button.parentElement;
      const link = linkBlock.querySelector('a').href;
      navigator.clipboard.writeText(link).then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制!';
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
        button.textContent = '已复制!';
        setTimeout(() => { button.textContent = '邀请链接 · 复制'; }, 1500);
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
        alert('请输入昵称');
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
      btn.textContent = '提交中...';
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          alert('提交成功！感谢您的分享。');
          closeModal('submitModal');
          form.reset();
        } else {
          const err = await res.json();
          alert('提交失败: ' + (err.error || '未知错误'));
        }
      } catch (e) {
        alert('网络错误，请稍后重试');
      } finally {
        btn.disabled = false;
        btn.textContent = '提交';
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
            alert('您今天点赞太频繁了，请明天再来！');
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
      list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">加载中...</div>';
      try {
        const res = await fetch(\`/api/comments?card_id=\${cardId}\`);
        const comments = await res.json();
        list.innerHTML = '';
        if (comments.length === 0) {
          list.innerHTML = '<div style="padding:8px;text-align:center;color:var(--text-muted)">暂无评论，快来抢沙发！</div>';
          return;
        }
        comments.forEach(c => {
          const div = document.createElement('div');
          div.className = 'comment-item';
          div.innerHTML = \`
            <div class="comment-header">
              <span>\${c.nickname || '匿名用户'}</span>
              <span>\${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div>\${c.content}</div>
          \`;
          list.appendChild(div);
        });
      } catch (e) {
        list.innerHTML = '<div style="padding:8px;text-align:center;color:red">加载失败</div>';
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
            alert('您今天评论太多了，休息一下吧！');
          } else {
            alert('评论失败: ' + err.error);
          }
        }
      } catch (e) {
        alert('网络错误');
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
