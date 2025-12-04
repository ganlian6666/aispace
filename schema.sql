CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  invite_link TEXT,
  description TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  nickname TEXT,
  content TEXT NOT NULL,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_status (
  card_id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'checking',
  latency INTEGER DEFAULT 0,
  last_checked DATETIME
);

-- 初始化 6 个卡片的 URL (按新顺序)
-- 1. Evolai
-- 2. Qiniu
-- 3. Univibe
-- 4. AgentRouter
-- 5. CodeMirror
-- 6. API520
INSERT OR IGNORE INTO site_status (card_id, url) VALUES
(1, 'https://www.evolai.cn/'),
(2, 'https://www.qiniu.com/'),
(3, 'https://www.univibe.cc/'),
(4, 'https://agentrouter.org/'),
(5, 'https://api.codemirror.codes/'),
(6, 'https://api520.pro/');
