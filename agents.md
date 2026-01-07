# AI Space 系统说明书

> **For AI Agents & Developers**
> 本文档从业务视角描述 AI Space 系统的核心逻辑、前后端职责边界和接口契约，便于 AI Agent 和协作者快速理解系统架构。

---

## 1. 系统概览

### 1.1 系统定位

**AI Space** 是一个基于 Cloudflare 全栈生态的 **AI 服务聚合导航平台**，提供：

- **API 中转服务导航**：展示经过人工验证的 AI API 中转站点
- **社区互动功能**：点赞、评论机制，帮助用户发现优质服务
- **实时状态监控**：自动检测站点可用性和响应延迟
- **资讯聚合**：汇总 TechCrunch 和 36Kr 的 AI 前沿动态
- **用户提交与审核**：开放式内容贡献，管理员审核后上线

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                             │
│                   React 19 SPA (Vite)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Home     │  │   News     │  │   Guide    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│           ↓ fetch('/api/*')                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages Functions                      │
│                  (Serverless API)                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  /api/likes│  │/api/submit │  │ /api/status│            │
│  └────────────┘  └────────────┘  └────────────┘            │
│           ↓ SQL Query                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare D1 Database                          │
│                  (SQLite 边缘存储)                            │
│  websites | submissions | likes | comments | news            │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 前后端职责边界

| 层级 | 职责 | 实现方式 |
|------|------|----------|
| **前端 (React SPA)** | 路由管理 | React Router (BrowserRouter) |
| | UI 渲染 | Ant Design 组件 + Lucide 图标 |
| | 状态管理 | React Context (I18nContext) + useState |
| | 表单验证 | Ant Design Form (rules) |
| | 国际化 | I18nContext (中/英切换) |
| | 本地缓存 | localStorage (昵称) + Cookie (语言) |
| | 错误处理 | try-catch + Ant Design Message |
| **后端 (Cloudflare Functions)** | 数据持久化 | Cloudflare D1 (SQLite) |
| | 业务规则执行 | 速率限制、域名去重、状态检测 |
| | 身份验证 | 基于 IP 的无状态认证 (CF-Connecting-IP) |
| | 安全防护 | XSS 过滤、CSP 响应头 |
| | 定时任务 | Cloudflare Workers Cron |
| | 管理后台 | `/Ganlian` 隐蔽入口 + 密码认证 |

**核心原则**：
- ✅ **前端不可信**：所有业务规则由后端强制执行
- ✅ **后端无状态**：不依赖 Session/JWT，通过 IP 和数据库实现限流
- ✅ **边缘计算优先**：利用 Cloudflare 全球节点降低延迟

---

## 2. 核心业务领域模型

### 2.1 数据实体关系

```
┌─────────────────┐
│    websites     │  主展示站点表
│  ─────────────  │
│  id (PK)        │
│  name           │◄──────┐
│  description    │       │
│  invite_link    │       │ card_id (FK)
│  display_url    │       │
│  status         │       │  ┌────────────┐
│  latency        │       ├──│   likes    │  点赞记录
│  last_checked   │       │  │  ─────────  │
└─────────────────┘       │  │  card_id   │
                          │  │  ip        │
        ▲                 │  └────────────┘
        │                 │
        │ (审核通过后)     │  ┌────────────┐
        │                 └──│  comments  │  评论记录
┌─────────────────┐          │  ─────────  │
│  submissions    │  待审核提交 │  card_id   │
│  ─────────────  │          │  nickname  │
│  name           │          │  content   │
│  url            │          │  ip        │
│  invite_link    │          └────────────┘
│  description    │
│  ip             │
└─────────────────┘

┌─────────────────┐          ┌────────────────┐
│      news       │  AI 资讯  │   feedback     │  用户反馈
│  ─────────────  │          │  ────────────  │
│  title          │          │  content       │
│  summary        │          │  contact       │
│  source         │          │  ip            │
│  url            │          │  status        │
└─────────────────┘          └────────────────┘

┌────────────────────┐      ┌────────────────┐
│  login_attempts    │      │  rate_limits   │
│  ────────────────  │      │  ────────────  │
│  ip                │      │  ip            │
│  count (失败次数)   │      │  last_updated  │
│  last_attempt      │      └────────────────┘
└────────────────────┘
   (指数退避防暴力破解)        (API 限流)
```

### 2.2 核心业务约束

#### 唯一性约束
- **域名去重**：同一域名（去除 `www.` 前缀）不可重复提交
  - 检查范围：`websites.display_url` + `submissions.url`
  - 实现方式：`extractDomain()` 函数提取主域名后对比

#### 速率限制 (基于 IP + 时间窗口)
| 操作 | 限制规则 | 错误码 |
|------|----------|--------|
| 点赞 | 每日每 IP 每卡片最多 **3 次** | 429 |
| 评论 | 每日每 IP 每卡片最多 **3 条** | 429 |
| 提交网站 | 每日每 IP 最多 **5 次** | 429 |
| 提交反馈 | 每日每 IP 最多 **5 次** | 429 |
| 刷新新闻 | 每日每 IP 最多 **1 次** | 429 |

#### 状态检测策略 (智能检测)
- **检测条件**：仅检测满足以下任一条件的站点
  1. `last_checked` 为 `null` (从未检测)
  2. `last_checked` 超过 **6 小时**
- **超时时间**：8 秒
- **在线判定**：HTTP 状态码为 `200/401/403/503` 视为在线
- **并发检测**：使用 `Promise.all` 批量检测

#### 数据保留策略
- **新闻表**：仅保留最新 **45 条** (自动清理旧数据)
- **点赞/评论**：永久保留 (无定期清理)
- **提交记录**：审核后保留历史 (用于防重复)

### 2.3 数据流向图

```
用户点击 "点赞" 按钮
    ↓
WebsiteCard 组件触发 onClick
    ↓
调用 useLike Hook
    ↓
fetch('POST /api/likes', { card_id: 1 })
    ↓
┌──────────────────────────────────────┐
│  Cloudflare Pages Function           │
│  (functions/api/likes.js)            │
│  ───────────────────────────────     │
│  1. 获取 IP (CF-Connecting-IP)       │
│  2. 查询频率限制 (SELECT COUNT)       │
│     ├─ count >= 3 → 返回 429         │
│  3. 插入点赞记录 (INSERT)             │
│  4. 查询新的总数 (SELECT COUNT)       │
│  5. 返回 { success: true, count: 43 }│
└──────────────────────────────────────┘
    ↓
前端接收响应
    ↓
更新 React State (setEnrichedWebsites)
    ↓
组件重新渲染 → 显示新的点赞数
```

---

## 3. 后端接口契约

> **说明**：以下接口契约从业务意图出发，明确后端强约束和前端建议行为。

### 3.1 网站管理类接口

#### POST /api/submit - 提交新网站

**业务意图**：用户发现优质 API 服务后，提交给平台审核，通过后展示给所有用户。

**入参**：
```json
{
  "name": "OpenAI 官方 API",      // 必填，网站名称
  "url": "https://openai.com",   // 必填，网站地址 (用于去重和展示)
  "invite_link": "...",          // 可选，邀请链接 (带推广码)
  "description": "官方稳定..."   // 可选，简短描述
}
```

**业务规则**：
1. **频率限制检查**：
   ```sql
   SELECT count(*) FROM submissions
   WHERE ip = ? AND created_at > datetime('now', '-1 day')
   ```
   若 count >= 5，返回 429 错误

2. **域名去重检查**：
   - 提取 `url` 的主域名 (去除 `www.`)
   - 与 `websites.display_url` 和 `submissions.url` 对比
   - 若存在相同域名，返回 409 错误

3. **插入待审核表**：
   ```sql
   INSERT INTO submissions (name, url, invite_link, description, ip)
   VALUES (?, ?, ?, ?, ?)
   ```

**出参**：
```json
// 成功 (200)
{ "success": true }

// 参数错误 (400)
{ "error": "Name and URL are required" }

// 域名重复 (409)
{ "error": "不好，有人快你一步提交了该网站，感谢支持！" }

// 频率限制 (429)
{ "error": "Daily submission limit reached" }

// 服务器错误 (500)
{ "error": "Database error: ..." }
```

**后端强约束**：
- ✅ IP 地址由 Cloudflare 提供，不可伪造
- ✅ 域名去重由后端执行，前端无法绕过
- ✅ 提交后进入 `submissions` 表，需管理员手动审核

**前端建议行为**：
- 使用 Ant Design Form 进行 URL 格式验证
- 提交成功后显示 "提交成功！感谢您的分享" 并关闭 Modal
- 409 错误时显示友好提示，避免用户重复提交
- 429 错误时建议用户明天再试

---

#### GET /api/status - 获取站点状态

**业务意图**：前端展示站点的实时可用性（在线/离线）和响应延迟，帮助用户选择优质服务。

**入参**：无

**业务规则**：
1. **查询所有站点**：
   ```sql
   SELECT id, display_url, last_checked FROM websites
   ```

2. **筛选需要检测的站点** (智能检测)：
   - `last_checked` 为 `null`
   - 或 `last_checked` 超过 6 小时

3. **并发状态检测** (仅针对筛选出的站点)：
   - 超时时间：8 秒
   - 伪装浏览器 User-Agent
   - 在线判定：HTTP 200/401/403/503

4. **批量更新数据库**：
   ```sql
   UPDATE websites
   SET status = ?, latency = ?, last_checked = datetime('now')
   WHERE id = ?
   ```

5. **返回全量站点状态**：
   ```sql
   SELECT id as card_id, display_url as url, status, latency, last_checked
   FROM websites
   ```

**出参**：
```json
[
  {
    "card_id": 1,
    "url": "https://openai.com",
    "status": "online",    // "online" 或 "offline"
    "latency": 120,        // 毫秒，offline 时为 0
    "last_checked": "2026-01-07T10:30:00Z"
  },
  ...
]
```

**后端强约束**：
- ✅ 智能检测策略由后端控制，避免频繁检测浪费资源
- ✅ 超时和在线判定规则统一管理
- ✅ 检测结果持久化到数据库

**前端建议行为**：
- 页面加载时并行请求 `/api/status` 和站点列表
- 将状态数据合并到站点列表 (`useEffect` 合并逻辑)
- 显示 Loading 状态，避免用户看到"检测中"闪烁

---

### 3.2 用户交互类接口

#### POST /api/likes - 点赞操作

**业务意图**：用户对优质站点表达支持，点赞数作为站点排序依据之一。

**入参**：
```json
{
  "card_id": 1  // 必填，网站 ID
}
```

**业务规则**：
1. **频率限制检查**：
   ```sql
   SELECT count(*) FROM likes
   WHERE ip = ? AND card_id = ?
   AND created_at > datetime('now', '-1 day')
   ```
   若 count >= 3，返回 429 错误

2. **插入点赞记录**：
   ```sql
   INSERT INTO likes (card_id, ip) VALUES (?, ?)
   ```

3. **查询新的点赞总数**：
   ```sql
   SELECT count(*) as count FROM likes WHERE card_id = ?
   ```

**出参**：
```json
// 成功 (200)
{
  "success": true,
  "count": 43  // 该站点当前总点赞数
}

// 频率限制 (429)
{ "error": "Daily like limit reached for this item" }

// 服务器错误 (500)
{ "error": "Database error: ..." }
```

**后端强约束**：
- ✅ 每日每 IP 每卡片最多 3 次，由数据库时间窗口查询保证
- ✅ 点赞总数实时计算，确保准确性
- ✅ 不支持"取消点赞"，简化业务逻辑

**前端建议行为**：
- **乐观更新**：点击后立即 UI +1，请求失败时回滚
- 429 错误时显示 "您今天点赞太频繁了，请明天再来！"
- 成功后更新本地状态 (`setEnrichedWebsites`)

---

#### GET /api/comments - 获取评论列表

**业务意图**：展示用户对站点的评价和讨论，帮助其他用户判断服务质量。

**入参**：
- Query 参数：`?card_id=1` (必填)

**业务规则**：
```sql
SELECT nickname, content, created_at
FROM comments
WHERE card_id = ?
ORDER BY created_at DESC
```

**出参**：
```json
[
  {
    "nickname": "匿名用户",
    "content": "速度很快，推荐！",
    "created_at": "2026-01-07T10:00:00Z"
  },
  ...
]

// card_id 缺失或无评论时
[]
```

**后端强约束**：
- ✅ 按时间倒序返回 (最新评论在前)
- ✅ 不分页 (当前业务量小，未来可扩展)

**前端建议行为**：
- 点击评论图标时才加载评论列表 (懒加载)
- 显示 Loading 状态，避免重复请求
- 无评论时显示 "暂无评论，快来抢沙发！"

---

#### POST /api/comments - 发表评论

**业务意图**：用户分享使用体验，促进社区交流。

**入参**：
```json
{
  "card_id": 1,                // 必填，网站 ID
  "nickname": "匿名用户",       // 必填，用户昵称 (前端从 localStorage 读取)
  "content": "速度很快，推荐！" // 必填，评论内容
}
```

**业务规则**：
1. **频率限制检查**：
   ```sql
   SELECT count(*) FROM comments
   WHERE ip = ? AND card_id = ?
   AND created_at > datetime('now', '-1 day')
   ```
   若 count >= 3，返回 429 错误

2. **插入评论**：
   ```sql
   INSERT INTO comments (card_id, nickname, content, ip)
   VALUES (?, ?, ?, ?)
   ```
   - 若 `nickname` 为空，自动填充 `'Anonymous'`

**出参**：
```json
// 成功 (200)
{ "success": true }

// 频率限制 (429)
{ "error": "Daily comment limit reached for this item" }

// 服务器错误 (500)
{ "error": "Database error: ..." }
```

**后端强约束**：
- ✅ 每日每 IP 每卡片最多 3 条评论
- ✅ 昵称由前端管理 (localStorage)，后端不校验唯一性
- ✅ IP 记录用于限流，不公开展示

**前端建议行为**：
- 首次评论前检查 localStorage 中的昵称，无则弹出"设置昵称" Modal
- 发布成功后自动刷新评论列表
- 同时更新评论数 UI (`+1`)

---

### 3.3 内容管理类接口

#### POST /api/feedback - 提交用户反馈

**业务意图**：收集用户建议和 Bug 报告，持续优化产品。

**入参**：
```json
{
  "content": "希望支持更多筛选条件", // 必填，反馈内容
  "contact": "user@example.com"     // 可选，联系方式 (邮箱/微信)
}
```

**业务规则**：
1. **频率限制检查** (同提交网站，每日 5 次)
2. **插入反馈记录**：
   ```sql
   INSERT INTO feedback (content, contact, ip, status)
   VALUES (?, ?, ?, 'pending')
   ```

**出参**：
```json
// 成功 (200)
{ "success": true }

// 参数错误 (400)
{ "error": "Content is required" }

// 频率限制 (429)
{ "error": "Daily feedback limit reached" }
```

**后端强约束**：
- ✅ 反馈状态初始为 `pending`，管理员后台可标记为 `processed`
- ✅ 联系方式不公开，仅管理员可见

**前端建议行为**：
- 反馈入口放在提交网站 Modal 左下角 (虚线按钮)
- 提交成功后显示 "感谢您的反馈！我们会认真查看"

---

#### GET /api/news - 获取 AI 新闻列表

**业务意图**：展示 TechCrunch 和 36Kr 的最新 AI 资讯，吸引用户访问。

**入参**：无

**业务规则**：
```sql
SELECT id, title, summary, source, url, published_at
FROM news
ORDER BY published_at DESC
LIMIT 45
```

**出参**：
```json
[
  {
    "id": 1,
    "title": "OpenAI 发布 GPT-5",
    "summary": "性能提升 10 倍...",
    "source": "TechCrunch",
    "url": "https://...",
    "published_at": "2026-01-07T08:00:00Z"
  },
  ...
]
```

**后端强约束**：
- ✅ 仅保留最新 45 条 (定时任务自动清理)
- ✅ `url` 字段有唯一索引，防止重复抓取

**前端建议行为**：
- News 页面加载时请求
- 提供"刷新资讯"按钮，调用管理员接口 (需密码)

---

### 3.4 管理员接口

> **注意**：以下接口需要密码认证，密码存储在环境变量 `ADMIN_PASSWORD` 中。

#### POST /api/admin/websites - 管理站点

**业务意图**：管理员对站点进行增删改查操作。

**入参** (根据操作类型)：
```json
// 新增
{ "action": "create", "name": "...", "url": "...", ... }

// 编辑
{ "action": "update", "id": 1, "name": "...", ... }

// 删除
{ "action": "delete", "id": 1 }

// 批量通过 (从 submissions 迁移到 websites)
{ "action": "approve", "ids": [1, 2, 3] }
```

**业务规则**：
1. **密码验证**：检查请求头或 Body 中的 `password` 字段
2. **执行对应操作** (INSERT/UPDATE/DELETE)
3. **返回结果**

**出参**：
```json
// 成功 (200)
{ "success": true }

// 认证失败 (401)
{ "error": "Invalid password" }
```

**后端强约束**：
- ✅ 管理员密码存储在环境变量，不可硬编码
- ✅ 失败次数记录到 `login_attempts` 表，实现指数退避

---

## 4. 前端行为规范

### 4.1 状态管理策略

**全局状态** (React Context)：
- `I18nContext`：管理语言偏好 (zh/en) 和翻译函数 `t()`
- 语言切换后更新 Cookie (`locale=zh; max-age=31536000`)

**组件状态** (useState)：
- 网站列表：`useState<Website[]>`
- Loading 状态：`useState<boolean>`
- Modal 显示状态：`useState<boolean>`

**本地存储**：
- `localStorage.user_nickname`：用户昵称 (持久化)
- `document.cookie.locale`：语言偏好

### 4.2 API 调用模式

**统一封装** (`src/hooks/useApi.js`)：
- `useWebsites()`：获取站点列表
- `useLike()`：点赞操作
- `useComments(cardId)`：评论管理
- `useSubmit()`：提交网站
- `useFeedback()`：提交反馈
- `useStatus()`：状态监控

**调用示例**：
```javascript
const { websites, loading, refetch } = useWebsites();
const { toggleLike, liking } = useLike();

// 点赞操作
const handleLike = async (cardId) => {
  try {
    const result = await toggleLike(cardId);
    message.success('点赞成功');
    // 更新本地状态
    setWebsites(prev =>
      prev.map(site =>
        site.id === cardId ? { ...site, likes: result.count } : site
      )
    );
  } catch (error) {
    if (error.message === 'like_limit') {
      message.warning('您今天点赞太频繁了');
    } else {
      message.error('网络错误');
    }
  }
};
```

### 4.3 错误处理规范

**HTTP 状态码处理**：
| 状态码 | 含义 | 前端处理 |
|--------|------|----------|
| 200 | 成功 | 正常更新 UI |
| 400 | 参数错误 | 显示具体错误信息 |
| 401 | 认证失败 | 跳转登录 (管理员页面) |
| 409 | 资源冲突 | 提示"网站已存在" |
| 429 | 频率限制 | 提示"操作太频繁，请稍后再试" |
| 500 | 服务器错误 | 提示"网络错误，请重试" |

**统一错误提示** (Ant Design Message)：
- `message.success(t('alert_submit_success'))`
- `message.error(t('alert_network_error'))`
- `message.warning(t('alert_like_limit'))`

### 4.4 用户体验约定

**乐观更新**：
- 点赞：立即 UI +1，请求失败时回滚
- 评论：发布后立即显示在列表顶部

**Loading 状态**：
- 列表加载：显示 `<Spin />` 组件
- 按钮提交：`loading` 属性禁用按钮

**国际化**：
- 所有文案通过 `t('key')` 函数获取
- 语言切换后实时更新，无需刷新页面

---

## 5. 安全与合规

### 5.1 认证授权机制

**用户端**：
- 无需注册/登录
- 基于 IP 地址的无状态认证
- IP 由 Cloudflare 自动注入 (`CF-Connecting-IP`)

**管理员端**：
- `/Ganlian` 隐蔽入口 (非标准 `/admin`)
- 密码存储在环境变量 `ADMIN_PASSWORD`
- 登录状态仅保存在内存 (关闭标签页立即失效)

### 5.2 速率限制策略

**实现方式**：基于数据库时间窗口查询 (`datetime('now', '-1 day')`)

**限流规则**：
- 点赞：3 次/日/IP/卡片
- 评论：3 条/日/IP/卡片
- 提交：5 次/日/IP
- 反馈：5 次/日/IP

**防暴力破解** (管理员登录)：
- 记录失败次数到 `login_attempts` 表
- 指数退避：第 N 次错误强制等待 `2^(N-1)` 秒 (1s, 2s, 4s, 8s...)

### 5.3 数据验证规则

**后端验证**：
- URL 格式：使用 `new URL()` 解析，捕获异常
- 域名去重：`extractDomain()` 提取主域名后对比
- 必填字段：`if (!name || !url)` 检查

**前端验证** (Ant Design Form)：
```javascript
<Form.Item
  name="url"
  rules={[
    { required: true, message: '请输入网站地址' },
    { type: 'url', message: 'URL 格式不正确' }
  ]}
>
  <Input />
</Form.Item>
```

### 5.4 XSS/CSP 防护

**XSS 防护** (`functions/utils/escape.js`)：
- `escapeHtml()`：转义 HTML 特殊字符 (`<`, `>`, `&`, `"`, `'`)
- `escapeUrl()`：验证 URL 协议 (仅允许 `http://` 和 `https://`)
- 所有用户输入在渲染前必须转义

**CSP 响应头** (`functions/utils/security.js`)：
```javascript
'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
```

---

## 6. 运维与监控

### 6.1 定时任务

**Cloudflare Workers Cron** (`wrangler.toml`)：
```toml
[triggers]
crons = ["0 */6 * * *"]  # 每 6 小时执行一次
```

**任务内容**：
- 更新 AI 新闻 (调用 `/api/admin/update_news?key={ADMIN_PASSWORD}`)
- 清理超过 45 条的旧新闻

### 6.2 状态检测策略

**智能检测** (避免频繁请求)：
- 仅检测 `last_checked` 为 `null` 或超过 6 小时的站点
- 并发检测，使用 `Promise.all` 提升性能
- 检测结果持久化到 `websites` 表

**检测参数**：
- 超时时间：8 秒
- User-Agent 伪装：模拟真实浏览器
- 在线判定：HTTP 200/401/403/503

### 6.3 日志与错误追踪

**当前方案**：
- 后端：`console.error()` 输出到 Cloudflare Logs
- 前端：`console.error()` 输出到浏览器控制台

**未来扩展**：
- 集成 Sentry 或 LogRocket 进行全局错误追踪
- 添加性能监控 (Web Vitals)

---

## 7. 开发协作指南

### 7.1 本地开发环境

**前置要求**：
- Node.js >= 18.0.0
- npm >= 9.0.0

**安装依赖**：
```bash
npm install
```

**启动开发服务器**：
```bash
# 前端开发 (Vite)
npm run dev          # http://localhost:3000

# 后端开发 (Cloudflare Pages Functions)
npm run dev:cf       # http://localhost:8788
```

**生产构建**：
```bash
npm run build        # 输出到 dist/
npm run preview      # 预览构建产物
```

### 7.2 数据库变更流程

**初始化数据库** (`schema.sql`)：
```bash
# 使用 Cloudflare D1 CLI
wrangler d1 execute DB --file=schema.sql
```

**Schema 变更规范**：
1. 修改 `schema.sql` 文件
2. 编写迁移 SQL (如 `migrations/001_add_column.sql`)
3. 在生产环境执行前先在本地测试

**重置数据库** (`reset.sql`)：
```bash
wrangler d1 execute DB --file=reset.sql
```

### 7.3 接口扩展规范

**新增接口步骤**：
1. 在 `functions/api/` 下创建文件 (如 `new-feature.js`)
2. 导出 `onRequestGet` 或 `onRequestPost` 函数
3. 遵循以下规范：
   - 使用 `CF-Connecting-IP` 获取用户 IP
   - 统一返回 JSON 格式
   - 错误使用标准 HTTP 状态码
   - 添加速率限制 (如需要)

**示例代码**：
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  try {
    const body = await request.json();
    // 业务逻辑...
    return new Response(JSON.stringify({ success: true }), {
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
}
```

**前端调用**：
1. 在 `src/hooks/useApi.js` 中添加 Custom Hook
2. 在组件中使用 Hook 调用接口
3. 使用 Ant Design Message 显示错误

---

## 附录：常见问题

### Q1: 为什么不使用 JWT/Session？
**A**: 基于 Cloudflare 边缘计算的无状态架构，IP 地址由 CDN 提供且不可伪造，满足当前业务需求。若未来需要用户账号体系，可扩展为 JWT。

### Q2: 点赞/评论为什么限制 3 次？
**A**: 防止恶意刷量，保证社区数据真实性。后续可根据用户反馈调整。

### Q3: 管理员如何审核提交？
**A**: 访问 `/Ganlian` 后台，查看 `submissions` 表，手动点击"通过"按钮迁移到 `websites` 表。

### Q4: 如何扩展支持更多语言？
**A**: 在 `src/contexts/I18nContext.jsx` 的 `translations` 对象中添加新语言（如 `ja`, `ko`），更新语言切换逻辑即可。

---

**文档版本**: v3.0
**最后更新**: 2026-01-07
**维护者**: AI Space Team
