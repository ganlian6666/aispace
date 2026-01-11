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

-- 新的核心表：Websites
-- 合并了原来的 site_status 功能，并存储所有展示信息
CREATE TABLE IF NOT EXISTS websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  invite_link TEXT NOT NULL,
  display_url TEXT NOT NULL, -- 用于展示，也用于状态检测
  
  -- 状态字段
  status TEXT DEFAULT 'checking',
  latency INTEGER DEFAULT 0,
  last_checked DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 登录失败记录表 (用于指数退避)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 新闻表 (AI News)
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL, -- 'TechCrunch' or '36Kr'
    url TEXT NOT NULL,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(url) -- 防止重复插入
);

-- 索引，加速按时间排序
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

-- 频率限制表 (用于限制 IP 刷新频率)
CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT PRIMARY KEY,
    last_updated DATETIME
);

-- 7. 用户反馈表
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    contact TEXT,
    ip TEXT,
    status TEXT DEFAULT 'pending', -- pending, processed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初始化数据 (迁移原来的 6 个网站)
INSERT OR IGNORE INTO websites (id, name, description, invite_link, display_url) VALUES
(1, 'Evolai - 注册送积分 + 3天Plus 会话', '全链路监控保证可用性，通过专属网关访问低延迟接口。', 'https://www.evolai.cn/?inviteCode=PDGD2EDT', 'https://www.evolai.cn/'),
(2, '七牛云 - 注册就送千万AI大模型 Token 奖励', '叠加多地节点，上传速度与 Token 限额均可实时追踪。', 'https://www.qiniu.com/ai/promotion/invited?cps_key=1hga674ddglea', 'https://www.qiniu.com/'),
(3, 'Univibe - 注册即送6000积分', '高速稳定的原版OpenAI CodeX和 Claude Code。', 'https://www.univibe.cc/console/auth?type=register&invite=CDO7IQ', 'https://www.univibe.cc/'),
(4, 'AgentRouter - AI 路由服务', '智能路由分发，支持多模型切换，稳定高效。', 'https://agentrouter.org/register?aff=wZbO', 'https://agentrouter.org/'),
(5, 'CodeMirror - 注册送 25$ 的体验额度', '多层身份识别与加密通道，适合接入生产环境。', 'https://api.codemirror.codes/register?aff=EUsy', 'https://api.codemirror.codes/'),
(6, 'API520 - 稳定 API 服务', '多轮会话、问题求解均可使用，支持日常任务调度。', 'https://api520.pro/register?aff=klcS', 'https://api520.pro/');
