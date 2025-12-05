export async function onRequest(context) {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>网站管理后台</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f172a;
      --panel: #1e293b;
      --border: #334155;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --danger: #ef4444;
    }
    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 1000px;
    }
    h1 { margin-bottom: 20px; font-size: 24px; }
    
    /* Login Form */
    #login-panel {
      max-width: 300px;
      margin: 100px auto;
      background: var(--panel);
      padding: 30px;
      border-radius: 12px;
      border: 1px solid var(--border);
      text-align: center;
    }
    input, textarea {
      width: 100%;
      background: #020617;
      border: 1px solid var(--border);
      color: white;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    button:hover { opacity: 0.9; }
    button.btn-danger { background: var(--danger); }
    button.btn-sm { padding: 4px 8px; font-size: 12px; }

    /* Admin Panel */
    #admin-panel { display: none; }
    .toolbar { display: flex; justify-content: space-between; margin-bottom: 20px; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th { background: #0f172a; font-weight: 600; color: var(--text-muted); }
    tr:last-child td { border-bottom: none; }
    
    /* Modal */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7);
      display: none; align-items: center; justify-content: center;
    }
    .modal {
      background: var(--panel);
      padding: 24px;
      border-radius: 12px;
      width: 90%; max-width: 500px;
      border: 1px solid var(--border);
    }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; color: var(--text-muted); font-size: 14px; }
  </style>
</head>
<body>

  <div class="container">
    <!-- Login -->
    <div id="login-panel">
      <h2>管理员登录</h2>
      <input type="password" id="password" placeholder="请输入管理密码" onkeypress="if(event.key==='Enter') login()">
      <button onclick="login()">进入后台</button>
    </div>

    <!-- Admin -->
    <div id="admin-panel">
      <div class="toolbar">
        <h1>网站管理</h1>
        <div style="display:flex; gap:10px; align-items:center;">
          <!-- 导出下拉菜单 -->
          <div style="position:relative; display:inline-block;">
            <button onclick="toggleExportMenu()" style="background:#475569">导出 ▼</button>
            <div id="export-menu" style="display:none; position:absolute; right:0; top:100%; background:var(--panel); border:1px solid var(--border); border-radius:6px; min-width:120px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              <div onclick="exportData('submissions')" style="padding:10px; cursor:pointer; border-bottom:1px solid var(--border);">用户提交</div>
              <div onclick="exportData('websites')" style="padding:10px; cursor:pointer;">主页网站</div>
            </div>
          </div>

          <!-- 导入按钮 -->
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="handleFileSelect(this)">
          <button onclick="triggerImport()" style="background:#475569">导入</button>

          <button onclick="openModal()">+ 添加新网站</button>
          <button onclick="logout()" style="background:transparent; border:1px solid var(--border);">退出</button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:50px">ID</th>
            <th>名称</th>
            <th>显示链接</th>
            <th>状态</th>
            <th style="width:120px">操作</th>
          </tr>
        </thead>
        <tbody id="site-list">
          <!-- JS Rendered -->
        </tbody>
      </table>
    </div>
  </div>

  <!-- Edit/Add Modal -->
  <div class="modal-backdrop" id="editModal">
    <div class="modal">
      <h2 id="modalTitle">添加网站</h2>
      <input type="hidden" id="edit-id">
      
      <div class="form-group">
        <label>网站名称</label>
        <input type="text" id="edit-name" placeholder="例如: Google">
      </div>
      <div class="form-group">
        <label>简单描述</label>
        <textarea id="edit-desc" rows="3" placeholder="描述一下..."></textarea>
      </div>
      <div class="form-group">
        <label>显示链接 (用于展示和检测)</label>
        <input type="text" id="edit-display" placeholder="https://google.com">
      </div>
      <div class="form-group">
        <label>邀请/跳转链接</label>
        <input type="text" id="edit-invite" placeholder="https://google.com?aff=123">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button onclick="closeModal('editModal')" style="background:transparent; border:1px solid var(--border);">取消</button>
        <button onclick="saveSite()">保存</button>
      </div>
    </div>
  </div>

  <!-- Import Confirm Modal -->
  <div class="modal-backdrop" id="importModal">
    <div class="modal">
      <h2>确认导入</h2>
      <p>您选择了文件: <span id="import-filename" style="color:var(--primary)"></span></p>
      <p style="color:var(--text-muted); font-size:14px;">注意：导入操作将批量添加或更新网站数据。</p>
      
      <div style="margin:20px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
        <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
          <input type="checkbox" id="import-overwrite" style="width:auto; margin:0;">
          <span>覆盖现有数据 (根据 ID 匹配)</span>
        </label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button onclick="closeModal('importModal')" style="background:transparent; border:1px solid var(--border);">取消</button>
        <button onclick="confirmImport()">确定导入</button>
      </div>
    </div>
  </div>

  <script>
    let sites = [];
    const API_URL = '/api/admin/websites';
    let selectedImportFile = null;

    // Auth Logic
    // 内存变量，刷新页面即丢失
    let currentKey = '';

    function login() {
      const pwd = document.getElementById('password').value;
      if (!pwd) return alert('请输入密码');
      
      currentKey = pwd;
      loadSites();
    }

    function logout() {
      currentKey = '';
      location.reload();
    }

    function getKey() {
      return currentKey;
    }

    // Data Logic
    async function loadSites() {
      const key = getKey();
      if (!key) return;

      try {
        const res = await fetch(API_URL, {
          headers: { 'X-Admin-Key': key }
        });

        if (res.status === 401) {
          alert('密码错误');
          return;
        }

        sites = await res.json();
        renderTable();
        
        // Switch view
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } catch (e) {
        alert('加载失败: ' + e.message);
      }
    }

    function renderTable() {
      const tbody = document.getElementById('site-list');
      tbody.innerHTML = sites.map(site => \`
        <tr>
          <td>\${site.id}</td>
          <td>
            <div style="font-weight:600">\${site.name}</div>
            <div style="font-size:12px; color:#94a3b8; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${site.description || ''}</div>
          </td>
          <td><a href="\${site.display_url}" target="_blank" style="color:#3b82f6">\${site.display_url}</a></td>
          <td>
            <span style="color: \${site.status === 'online' ? '#4ade80' : '#ef4444'}">
              \${site.status === 'online' ? '在线' : '离线'}
            </span>
          </td>
          <td>
            <button class="btn-sm" onclick="editSite(\${site.id})">编辑</button>
            <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">删除</button>
          </td>
        </tr>
      \`).join('');
    }

    // Export Logic
    function toggleExportMenu() {
        const menu = document.getElementById('export-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
    
    // Close menu when clicking outside
    window.onclick = function(event) {
        if (!event.target.matches('button')) {
            const menu = document.getElementById('export-menu');
            if (menu && menu.style.display === 'block') {
                menu.style.display = 'none';
            }
        }
    }

    function exportData(type) {
        // 使用当前登录的密码进行验证
        const key = getKey();
        if (!key) return alert('请先登录');
        window.location.href = \`/api/admin/export?type=\${type}&key=\${key}\`;
    }

    // Import Logic
    function triggerImport() {
        document.getElementById('import-file').click();
    }

    function handleFileSelect(input) {
        if (input.files && input.files[0]) {
            selectedImportFile = input.files[0];
            document.getElementById('import-filename').textContent = selectedImportFile.name;
            document.getElementById('importModal').style.display = 'flex';
        }
    }

    async function confirmImport() {
        if (!selectedImportFile) return;
        
        const overwrite = document.getElementById('import-overwrite').checked;
        const btn = document.querySelector('#importModal button:last-child');
        btn.textContent = '导入中...';
        btn.disabled = true;

        try {
            // 读取文件内容
            const text = await selectedImportFile.text();
            // 验证是否为有效 JSON
            try {
                JSON.parse(text);
            } catch (e) {
                alert('文件格式错误：必须是有效的 JSON 格式');
                return;
            }

            const res = await fetch(\`\${API_URL}?overwrite=\${overwrite}\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': getKey()
                },
                body: text
            });

            if (res.ok) {
                const result = await res.json();
                alert(\`导入成功！处理了 \${result.count} 条数据。\`);
                closeModal('importModal');
                loadSites();
            } else {
                const err = await res.json();
                alert('导入失败: ' + err.error);
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            btn.textContent = '确定导入';
            btn.disabled = false;
            document.getElementById('import-file').value = ''; // Reset input
        }
    }

    // Edit Logic
    function openModal() {
      document.getElementById('editModal').style.display = 'flex';
      // Reset form
      document.getElementById('edit-id').value = '';
      document.getElementById('edit-name').value = '';
      document.getElementById('edit-desc').value = '';
      document.getElementById('edit-display').value = '';
      document.getElementById('edit-invite').value = '';
      document.getElementById('modalTitle').textContent = '添加网站';
    }

    function closeModal(modalId = 'editModal') {
      document.getElementById(modalId).style.display = 'none';
    }

    function editSite(id) {
      const site = sites.find(s => s.id === id);
      if (!site) return;

      document.getElementById('edit-id').value = site.id;
      document.getElementById('edit-name').value = site.name;
      document.getElementById('edit-desc').value = site.description;
      document.getElementById('edit-display').value = site.display_url;
      document.getElementById('edit-invite').value = site.invite_link;
      document.getElementById('modalTitle').textContent = '编辑网站';
      
      document.getElementById('editModal').style.display = 'flex';
    }

    async function saveSite() {
      const id = document.getElementById('edit-id').value;
      const data = {
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        display_url: document.getElementById('edit-display').value,
        invite_link: document.getElementById('edit-invite').value
      };

      if (!data.name || !data.display_url || !data.invite_link) {
        return alert('请填写完整信息');
      }

      const method = id ? 'PUT' : 'POST';
      if (id) data.id = id;

      try {
        const res = await fetch(API_URL, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Key': getKey()
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          closeModal('editModal');
          loadSites();
        } else {
          const err = await res.json();
          alert('保存失败: ' + err.error);
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function deleteSite(id) {
      if (!confirm('确定要删除这个网站吗？相关点赞和评论也会被删除！')) return;

      try {
        const res = await fetch(\`\${API_URL}?id=\${id}\`, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': getKey() }
        });

        if (res.ok) {
          loadSites();
        } else {
          alert('删除失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    // Check login on load
    if (getKey()) {
      loadSites();
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}
