export async function onRequest(context) {
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>缃戠珯绠＄悊鍚庡彴</title>
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
      <h2>绠＄悊鍛樼櫥褰?/h2>
      <input type="password" id="password" placeholder="璇疯緭鍏ョ鐞嗗瘑鐮? onkeypress="if(event.key==='Enter') login()">
      <button onclick="login()">杩涘叆鍚庡彴</button>
    </div>

    <!-- Admin -->
    <div id="admin-panel">
      <div class="toolbar">
        <h1>缃戠珯绠＄悊</h1>
        <div>
          <button onclick="openModal()">+ 娣诲姞鏂扮綉绔?/button>
          <button onclick="exportCSV()" style="background:#10b981; border:none;">瀵煎嚭 CSV</button>
          <button onclick="triggerImport()" style="background:#8b5cf6; border:none;">瀵煎叆 CSV</button>
          <input type="file" id="import-file" style="display:none" accept=".csv" onchange="importCSV(this)">
          <button onclick="logout()" style="background:transparent; border:1px solid var(--border);">閫€鍑?/button>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:50px">ID</th>
            <th>鍚嶇О</th>
            <th>鏄剧ず閾炬帴</th>
            <th>鐘舵€?/th>
            <th style="width:120px">鎿嶄綔</th>
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
      <h2 id="modalTitle">娣诲姞缃戠珯</h2>
      <input type="hidden" id="edit-id">
      
      <div class="form-group">
        <label>缃戠珯鍚嶇О</label>
        <input type="text" id="edit-name" placeholder="渚嬪: Google">
      </div>
      <div class="form-group">
        <label>绠€鍗曟弿杩?/label>
        <textarea id="edit-desc" rows="3" placeholder="鎻忚堪涓€涓?.."></textarea>
      </div>
      <div class="form-group">
        <label>鏄剧ず閾炬帴 (鐢ㄤ簬灞曠ず鍜屾娴?</label>
        <input type="text" id="edit-display" placeholder="https://google.com">
      </div>
      <div class="form-group">
        <label>閭€璇?璺宠浆閾炬帴</label>
        <input type="text" id="edit-invite" placeholder="https://google.com?aff=123">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
        <button onclick="closeModal()" style="background:transparent; border:1px solid var(--border);">鍙栨秷</button>
        <button onclick="saveSite()">淇濆瓨</button>
      </div>
    </div>
  </div>

  <script>
    let sites = [];
    const API_URL = '/api/admin/websites';

    // Auth Logic
    // 鍐呭瓨鍙橀噺锛屽埛鏂伴〉闈㈠嵆涓㈠け
    let currentKey = '';

    function login() {
      const pwd = document.getElementById('password').value;
      if (!pwd) return alert('璇疯緭鍏ュ瘑鐮?);
      
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
          alert('瀵嗙爜閿欒');
          localStorage.removeItem('admin_key');
          return;
        }

        sites = await res.json();
        renderTable();
        
        // Switch view
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
      } catch (e) {
        alert('鍔犺浇澶辫触: ' + e.message);
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
              \${site.status === 'online' ? '鍦ㄧ嚎' : '绂荤嚎'}
            </span>
          </td>
          <td>
            <button class="btn-sm" onclick="editSite(\${site.id})">缂栬緫</button>
            <button class="btn-sm btn-danger" onclick="deleteSite(\${site.id})">鍒犻櫎</button>
          </td>
        </tr>
      \`).join('');
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
      document.getElementById('modalTitle').textContent = '娣诲姞缃戠珯';
    }

    function closeModal() {
      document.getElementById('editModal').style.display = 'none';
    }

    function editSite(id) {
      const site = sites.find(s => s.id === id);
      if (!site) return;

      document.getElementById('edit-id').value = site.id;
      document.getElementById('edit-name').value = site.name;
      document.getElementById('edit-desc').value = site.description;
      document.getElementById('edit-display').value = site.display_url;
      document.getElementById('edit-invite').value = site.invite_link;
      document.getElementById('modalTitle').textContent = '缂栬緫缃戠珯';
      
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
        return alert('璇峰～鍐欏畬鏁翠俊鎭?);
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
          closeModal();
          loadSites();
        } else {
          const err = await res.json();
          alert('淇濆瓨澶辫触: ' + err.error);
        }
      } catch (e) {
        alert('缃戠粶閿欒');
      }
    }

    async function deleteSite(id) {
      if (!confirm('纭畾瑕佸垹闄よ繖涓綉绔欏悧锛熺浉鍏崇偣璧炲拰璇勮涔熶細琚垹闄わ紒')) return;

      try {
        const res = await fetch(`${API_URL}?id=${id}`, {
          method: 'DELETE',
          headers: { 'X-Admin-Key': getKey() }
        });

        if (res.ok) {
          loadSites();
        } else {
          alert('鍒犻櫎澶辫触');
        }
      } catch (e) {
        alert('缃戠粶閿欒');
      }
    }

    // Export Logic
    function exportCSV() {
      const key = getKey();
      if (!key) return alert('璇峰厛鐧诲綍');
      window.open(`/api/export?key=${encodeURIComponent(key)}`, '_blank');
    }

    // Import Logic
    function triggerImport() {
      document.getElementById('import-file').click();
    }

    async function importCSV(input) {
      const file = input.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let successCount = 0;
        
        // Skip header, start from index 1
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Simple CSV parse (handles basic quotes)
          // 鍋囪鍒楅『搴? id, name, description, invite_link, display_url...
          // 鎴戜滑鍙渶瑕?name(1), description(2), invite_link(3), display_url(4)
          const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!parts || parts.length < 5) continue;
          
          const clean = (str) => str ? str.replace(/^"|"$/g, '').replace(/""/g, '"') : '';

          const data = {
            name: clean(parts[1]),
            description: clean(parts[2]),
            invite_link: clean(parts[3]),
            display_url: clean(parts[4])
          };

          try {
            await fetch(API_URL, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Key': getKey()
              },
              body: JSON.stringify(data)
            });
            successCount++;
          } catch (e) { console.error(e); }
        }
        
        alert(`导入完成！成功添加 ${successCount} 个网站`);
        loadSites();
        input.value = '';
      };
      reader.readAsText(file);
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
