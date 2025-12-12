export async function onRequest(context) {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>网站管理后台</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/admin.css">
</head>
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
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h1>网站管理</h1>
        <button onclick="logout()" class="btn-outline btn-sm">退出登录</button>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('websites')" id="tab-websites">主页网站</button>
        <button class="tab-btn" onclick="switchTab('submissions')" id="tab-submissions">用户提交</button>
        <button class="tab-btn" onclick="switchTab('news')" id="tab-news">新闻</button>
        <button class="tab-btn" onclick="switchTab('feedback')" id="tab-feedback">用户反馈</button>
      </div>

      <div class="toolbar">
        <div style="display:flex; gap:10px; align-items:center;">
          <!-- Bulk Actions -->
          <div id="bulk-actions" class="bulk-actions" style="display:none;">
            <span style="font-size:14px; color:var(--primary);">已选 <span id="selected-count">0</span> 项</span>
            <div style="height:20px; width:1px; background:var(--border);"></div>
            <button onclick="bulkDelete()" class="btn-danger btn-sm">批量删除</button>
            <button id="btn-bulk-add" onclick="openAddToMainModal()" class="btn-success btn-sm" style="display:none;">批量添加到主页</button>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <!-- 导出下拉菜单 -->
          <div style="position:relative; display:inline-block;">
            <button onclick="toggleExportMenu()" class="btn-outline">导出 ▼</button>
            <div id="export-menu" style="display:none; position:absolute; right:0; top:100%; background:var(--panel); border:1px solid var(--border); border-radius:6px; min-width:120px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.5);">
              <div onclick="exportData('submissions')" style="padding:10px; cursor:pointer; border-bottom:1px solid var(--border);">用户提交</div>
              <div onclick="exportData('websites')" style="padding:10px; cursor:pointer;">主页网站</div>
            </div>
          </div>

          <!-- 导入按钮 -->
          <input type="file" id="import-file" accept=".json" style="display:none" onchange="handleFileSelect(this)">
          <button onclick="triggerImport()" class="btn-outline">导入</button>

          <button onclick="openModal()" id="btn-add">+ 添加新网站</button>
        </div>
      </div>

      <table>
        <thead>
          <tr id="table-header">
            <!-- JS Rendered -->
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
      <input type="hidden" id="original-id">
      
      <div class="form-group">
        <label>ID (留空自动生成)</label>
        <input type="number" id="edit-id" placeholder="例如: 100">
        <div class="hint">修改 ID 可能会影响排序，请谨慎操作。</div>
      </div>

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
        <button onclick="closeModal('editModal')" class="btn-outline">取消</button>
        <button onclick="saveSite()">保存</button>
      </div>
    </div>
  </div>

  <!-- Import/Add To Main Confirm Modal -->
  <div class="modal-backdrop" id="importModal">
    <div class="modal">
      <h2 id="importTitle">确认操作</h2>
      <p id="importMessage"></p>
      
      <div style="margin:20px 0; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px;">
        <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
          <input type="checkbox" id="import-overwrite" style="width:auto; margin:0;">
          <span>覆盖现有数据 (根据 ID 匹配)</span>
        </label>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button onclick="closeModal('importModal')" class="btn-outline">取消</button>
        <button id="btn-confirm-import" onclick="confirmImport()">确定</button>
      </div>
    </div>
  </div>

  <script>
    let sites = [];
    let currentTab = 'websites'; // websites | submissions | news
    let selectedIds = new Set();
    const API_URL = '/api/admin/websites';
    let selectedImportFile = null;
    let pendingAddToMainData = null;

    // Auth Logic
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

    function getKey() { return currentKey; }

    // Tab Logic
    function switchTab(tab) {
      currentTab = tab;
      selectedIds.clear();
      updateSelectionUI();
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tab).classList.add('active');
      
      // Toggle buttons
      const btnAdd = document.getElementById('btn-add');
      if (btnAdd) btnAdd.style.display = tab === 'news' ? 'none' : 'inline-block';
      
      const bulkAdd = document.getElementById('btn-bulk-add');
      if (bulkAdd) bulkAdd.style.display = tab === 'submissions' ? 'inline-block' : 'none';

      loadSites();
    }

    // Data Logic
    async function loadSites() {
      const key = getKey();
      if (!key) return;

      let url = \`\${API_URL}?type=\${currentTab}\`;
      if (currentTab === 'feedback') {
          url = '/api/admin/feedback';
      }

      try {
        const res = await fetch(url, {
          headers: { 'X-Admin-Key': key }
        });

        if (res.status === 401) {
          alert('密码错误');
          return;
        }

        sites = await res.json();
        renderTable();
        
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } catch (e) {
        alert('加载失败: ' + e.message);
      }
    }

    function renderTable() {
      const thead = document.getElementById('table-header');
      const tbody = document.getElementById('site-list');
      
      const allSelected = sites.length > 0 && sites.every(s => selectedIds.has(s.id));

      // Render Header - Modified for News Index
      let headerHtml = \`<th class="checkbox-col"><input type="checkbox" onchange="toggleSelectAll(this)" \${allSelected ? 'checked' : ''}></th>\`;
      
      if (currentTab === 'news') {
           headerHtml += \`<th style="width:60px">序号</th>
                          <th>标题</th>
                          <th>来源</th>
                          <th>发布时间</th>
                          <th style="width:140px">操作</th>\`;
      } else if (currentTab === 'feedback') {
           headerHtml += \`<th style="width:60px">ID</th>
                          <th>内容</th>
                          <th>联系方式</th>
                          <th>IP / 时间</th>
                          <th style="width:80px">操作</th>\`;
      } else {
           headerHtml += \`<th style="width:60px">ID</th>
                          <th>名称</th>\`;
           if (currentTab === 'websites') {
             headerHtml += \`<th>显示链接</th>
                            <th>状态</th>
                            <th style="width:140px">操作</th>\`;
           } else {
             headerHtml += \`<th>提交链接</th>
                            <th>IP / 时间</th>
                            <th style="width:200px">操作</th>\`;
           }
      }
      thead.innerHTML = headerHtml;

      // Render Body - Modified for News Index
      tbody.innerHTML = sites.map((site, index) => {
        const isSelected = selectedIds.has(site.id);
        let rowHtml = \`
          <tr class="\${isSelected ? 'selected' : ''}">
            <td class="checkbox-col">
              <input type="checkbox" value="\${site.id}" \${isSelected ? 'checked' : ''} onchange="toggleSelect(this, \${site.id})">
            </td>\`;

        if (currentTab === 'news') {
             const dateStr = new Date(site.published_at).toLocaleString();
             // SHOW INDEX (+1) instead of ID
             rowHtml += \`
            <td>\${index + 1}</td>
            <td>
              <div style="font-weight:600"><a href="\${site.url}" target="_blank" style="color:#e2e8f0;text-decoration:none">\${site.title}</a></div>
            </td>
            <td>\${site.source}</td>
            <td style="font-size:12px;color:#94a3b8">\${dateStr}</td>
            <td>
              <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">删除</button>
            </td>\`;
        } else if (currentTab === 'feedback') {
            rowHtml += \`
            <td>\${site.id}</td>
            <td>
              <div style="font-weight:600; white-space:pre-wrap; max-width:400px;">\${site.content}</div>
            </td>
            <td>\${site.contact || '-'}</td>
            <td>
              <div style="font-size:12px">\${site.ip || 'Unknown'}</div>
              <div style="font-size:12px; color:#94a3b8">\${new Date(site.created_at).toLocaleString()}</div>
            </td>
            <td>
              <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">删除</button>
            </td>\`;
        } else {
            // SHOW ID for other tabs
            rowHtml += \`<td>\${site.id}</td>
            <td>
              <div style="font-weight:600">\${site.name}</div>
              <div style="font-size:12px; color:#94a3b8; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${site.description || ''}</div>
            </td>\`;

            if (currentTab === 'websites') {
              rowHtml += \`
                <td><a href="\${site.display_url}" target="_blank" style="color:#3b82f6">\${site.display_url}</a></td>
                <td>
                  <span style="color: \${site.status === 'online' ? '#4ade80' : '#ef4444'}">
                    \${site.status === 'online' ? '在线' : '离线'}
                  </span>
                </td>
                <td>
                  <button class="btn-sm" onclick="editSite(\${site.id})">编辑</button>
                  <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">删除</button>
                </td>\`;
            } else {
              // Submissions
              rowHtml += \`
                <td><a href="\${site.url}" target="_blank" style="color:#3b82f6">\${site.url}</a></td>
                <td>
                  <div style="font-size:12px">\${site.ip || 'Unknown'}</div>
                  <div style="font-size:12px; color:#94a3b8">\${new Date(site.created_at).toLocaleString()}</div>
                </td>
                <td>
                  <button class="btn-sm btn-success" onclick="addToMain(\${site.id})">加入主页</button>
                  <button class="btn-sm" onclick="editSite(\${site.id})">编辑</button>
                  <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">删除</button>
                </td>\`;
            }
        }
        rowHtml += \`</tr>\`;
        return rowHtml;
      }).join('');
      
      updateSelectionUI();
    }

    // Selection Logic
    function toggleSelectAll(checkbox) {
      if (checkbox.checked) {
        sites.forEach(s => selectedIds.add(s.id));
      } else {
        selectedIds.clear();
      }
      renderTable(); // Re-render to update checkboxes
    }

    function toggleSelect(checkbox, id) {
      if (checkbox.checked) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      updateSelectionUI();
    }

    function updateSelectionUI() {
      const count = selectedIds.size;
      const bulkDiv = document.getElementById('bulk-actions');
      document.getElementById('selected-count').textContent = count;
      bulkDiv.style.display = count > 0 ? 'flex' : 'none';
    }

    // Bulk Actions
    async function bulkDelete() {
      if (!confirm(\`确定要删除选中的 \${selectedIds.size} 项吗？\`)) return;
      
      const ids = Array.from(selectedIds).join(',');
      
      let url = \`\${API_URL}?type=\${currentTab}&ids=\${ids}\`;
      if (currentTab === 'feedback') {
          url = \`/api/admin/feedback?id=\${ids}\`;
      }

      try {
        const res = await fetch(url, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': getKey() }
        });
        
        if (res.ok) {
          selectedIds.clear();
          loadSites();
        } else {
          alert('删除失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    // Add To Main Logic
    function addToMain(id) {
      const site = sites.find(s => s.id === id);
      if (!site) return;
      
      pendingAddToMainData = [site];
      document.getElementById('importTitle').textContent = '添加到主页';
      document.getElementById('importMessage').textContent = \`确定将 "\${site.name}" 添加到主页网站列表吗？\`;
      document.getElementById('importModal').style.display = 'flex';
      
      // Bind confirm action
      document.getElementById('btn-confirm-import').onclick = executeAddToMain;
    }

    function openAddToMainModal() {
      const items = sites.filter(s => selectedIds.has(s.id));
      if (items.length === 0) return;

      pendingAddToMainData = items;
      document.getElementById('importTitle').textContent = '批量添加到主页';
      document.getElementById('importMessage').textContent = \`确定将选中的 \${items.length} 个网站添加到主页列表吗？\`;
      document.getElementById('importModal').style.display = 'flex';
      
      document.getElementById('btn-confirm-import').onclick = executeAddToMain;
    }

    async function executeAddToMain() {
      if (!pendingAddToMainData) return;
      
      const overwrite = document.getElementById('import-overwrite').checked;
      const btn = document.getElementById('btn-confirm-import');
      btn.textContent = '处理中...';
      btn.disabled = true;

      try {
        // Transform submission data to website data structure if needed
        // Submissions: id, name, url, invite_link, description
        // Websites: name, description, invite_link, display_url
        // We keep the ID if we want to preserve it, but usually we might want to let it auto-increment if it conflicts?
        // User asked for "overwrite" option, implying ID matching.
        
        const payload = pendingAddToMainData.map(s => ({
          id: s.id, // Keep ID to allow overwrite matching
          name: s.name,
          description: s.description,
          invite_link: s.invite_link || s.url,
          display_url: s.url
        }));

        const res = await fetch(\`\${API_URL}?overwrite=\${overwrite}\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': getKey()
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          alert(\`成功添加/更新 \${result.count} 个网站！\`);
          closeModal('importModal');
          // Optional: Delete from submissions? User didn't specify, but usually we don't auto-delete unless requested.
          // Let's just refresh.
          if (currentTab === 'websites') loadSites();
          else {
              // If we are in submissions tab, maybe we want to stay here.
              // Deselect processed items
              selectedIds.clear();
              updateSelectionUI();
          }
        } else {
          const err = await res.json();
          alert('操作失败: ' + err.error);
        }
      } catch (e) {
        alert('网络错误');
      } finally {
        btn.textContent = '确定';
        btn.disabled = false;
        pendingAddToMainData = null;
      }
    }

    // Export/Import Logic
    function toggleExportMenu() {
        const menu = document.getElementById('export-menu');
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
    
    window.onclick = function(event) {
        if (!event.target.matches('button') && !event.target.matches('.btn-outline')) {
            const menu = document.getElementById('export-menu');
            if (menu && menu.style.display === 'block') {
                menu.style.display = 'none';
            }
        }
    }

    function exportData(type) {
        const key = getKey();
        if (!key) return alert('请先登录');
        window.location.href = \`/api/admin/export?type=\${type}&key=\${key}\`;
    }

    function triggerImport() {
        document.getElementById('import-file').click();
    }

    function handleFileSelect(input) {
        if (input.files && input.files[0]) {
            selectedImportFile = input.files[0];
            document.getElementById('importTitle').textContent = '确认导入';
            document.getElementById('importMessage').textContent = \`您选择了文件: \${selectedImportFile.name}\`;
            document.getElementById('importModal').style.display = 'flex';
            document.getElementById('btn-confirm-import').onclick = confirmImport;
        }
    }

    async function confirmImport() {
        if (!selectedImportFile) return;
        
        const overwrite = document.getElementById('import-overwrite').checked;
        const btn = document.getElementById('btn-confirm-import');
        btn.textContent = '导入中...';
        btn.disabled = true;

        try {
            const text = await selectedImportFile.text();
            try { JSON.parse(text); } catch (e) { alert('无效的 JSON'); return; }

            const res = await fetch(\`\${API_URL}?overwrite=\${overwrite}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Key': getKey() },
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
            btn.textContent = '确定';
            btn.disabled = false;
            document.getElementById('import-file').value = '';
            selectedImportFile = null;
        }
    }

    // Edit Logic
    function openModal() {
      document.getElementById('editModal').style.display = 'flex';
      document.getElementById('original-id').value = '';
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

      document.getElementById('original-id').value = site.id;
      document.getElementById('edit-id').value = site.id;
      document.getElementById('edit-name').value = site.name;
      document.getElementById('edit-desc').value = site.description || '';
      
      if (currentTab === 'websites') {
        document.getElementById('edit-display').value = site.display_url;
        document.getElementById('edit-invite').value = site.invite_link;
      } else {
        // Submissions usually have just 'url'
        document.getElementById('edit-display').value = site.url;
        document.getElementById('edit-invite').value = site.invite_link || site.url;
      }
      
      document.getElementById('modalTitle').textContent = '编辑网站';
      document.getElementById('editModal').style.display = 'flex';
    }

    async function saveSite() {
      const originalId = document.getElementById('original-id').value;
      const newId = document.getElementById('edit-id').value;
      
      const data = {
        id: originalId, // Old ID (if exists)
        new_id: newId,  // New ID
        name: document.getElementById('edit-name').value,
        description: document.getElementById('edit-desc').value,
        display_url: document.getElementById('edit-display').value,
        invite_link: document.getElementById('edit-invite').value
      };
      
      // For submissions, we map display_url back to url
      if (currentTab === 'submissions') {
          data.url = data.display_url;
      }

      if (!data.name || !data.display_url) {
        return alert('请填写完整信息');
      }

      const method = originalId ? 'PUT' : 'POST';
      // If creating new, we don't send 'id' or 'new_id' in the way PUT expects, but POST handles it.
      // Actually my POST implementation checks for 'id' in the body to force specific ID.
      if (!originalId && newId) {
          data.id = newId; // For POST, 'id' is the target ID
      }

      try {
        const res = await fetch(\`\${API_URL}?type=\${currentTab}\`, {
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
      if (!confirm('确定要删除这个网站吗？')) return;

      let url = \`\${API_URL}?type=\${currentTab}&id=\${id}\`;
      if (currentTab === 'feedback') {
          url = \`/api/admin/feedback?id=\${id}\`;
      }

      try {
        const res = await fetch(url, {
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

    if (getKey()) {
      loadSites();
    } else {
      // Auto focus password input
      const pwd = document.getElementById('password');
      if (pwd) pwd.focus();
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' }
  });
}
