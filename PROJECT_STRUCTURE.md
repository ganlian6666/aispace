# AI Space - 项目结构文档

> 智能 AI 服务导航与监控平台

---

## 一、项目概览

| 项目名称 | AI Space (自由空间) |
|---------|---------------------|
| 版本 | 2.0.0 |
| 类型 | 全栈 Web 应用 |
| 部署平台 | Cloudflare Pages + D1 数据库 |
| 主要功能 | AI API 中转站导航、新闻聚合、VPN 推荐、配置指南 |

---

## 二、目录结构

```
web1/
├── src/                          # 前端源码目录
│   ├── components/               # React 组件
│   │   ├── Header.jsx           # 顶部导航栏
│   │   ├── Header.less
│   │   ├── WebsiteCard.jsx      # 网站卡片组件
│   │   └── WebsiteCard.less
│   ├── contexts/                 # React Context
│   │   └── I18nContext.jsx      # 国际化上下文 (中/英)
│   ├── hooks/                    # 自定义 Hooks
│   │   └── useApi.js            # API 请求封装
│   ├── pages/                    # 页面组件
│   │   ├── Home.jsx             # 首页 - API 中转汇聚
│   │   ├── Home.less
│   │   ├── News.jsx             # AI 前沿动态
│   │   ├── News.less
│   │   ├── VPN.jsx              # VPN 推荐
│   │   ├── VPN.less
│   │   ├── Guide.jsx            # 配置指南
│   │   ├── Guide.less
│   │   └── CommonPage.less
│   ├── styles/                   # 全局样式
│   │   ├── index.less           # 样式入口
│   │   ├── variables.less       # Less 变量
│   │   └── components/          # 组件样式
│   │       ├── base.less
│   │       ├── button.less
│   │       ├── card.less
│   │       ├── form.less
│   │       ├── guide.less
│   │       ├── header.less
│   │       ├── layout.less
│   │       ├── modal.less
│   │       └── table.less
│   ├── App.jsx                   # 应用根组件 (路由配置)
│   ├── main.jsx                  # 应用入口
│   └── index.html                # HTML 模板
│
├── functions/                    # Cloudflare Functions (后端)
│   ├── api/                      # API 端点
│   │   ├── websites.js          # 网站列表 API
│   │   ├── news.js              # 新闻 API
│   │   ├── submit.js            # 网站提交 API
│   │   ├── likes.js             # 点赞 API
│   │   ├── comments.js          # 评论 API
│   │   ├── feedback.js          # 用户反馈 API
│   │   ├── status.js            # 状态检测 API
│   │   ├── generate.js          # 内容生成 API
│   │   └── admin/               # 管理员 API
│   │       ├── websites.js
│   │       ├── feedback.js
│   │       ├── update_news.js
│   │       └── export.js
│   ├── utils/                    # 工具函数
│   │   ├── escape.js            # 转义处理
│   │   ├── i18n.js              # 国际化
│   │   └── security.js          # 安全相关
│   ├── index.js                  # 首页 SSR
│   ├── news.js                   # 新闻页 SSR
│   ├── vpn.js                    # VPN 页 SSR
│   ├── guide.js                  # 指南页 SSR
│   ├── photos.js
│   └── Ganlian.js
│
├── scheduler/                    # 定时任务
│   └── index.js                  # 定时器入口
│
├── dist/                         # 构建输出目录
│   ├── css/
│   ├── js/
│   └── index.html
│
├── package.json                  # 项目配置
├── vite.config.js                # Vite 构建配置
├── schema.sql                    # 数据库结构
├── reset.sql                     # 数据库重置
├── theme.css                     # 主题样式
└── .gitignore
```

---

## 三、前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.3 | UI 框架 |
| **React Router DOM** | 7.11.0 | 客户端路由 |
| **Ant Design** | 5.12.0 | UI 组件库 |
| **Lucide React** | 0.562.0 | 图标库 |
| **Vite** | 5.0.0 | 构建工具 |
| **Less** | 4.2.0 | CSS 预处理器 |

### 前端特性

- **SPA 架构**: 基于 React Router 的单页应用
- **国际化**: 内置中英文切换 (I18nContext)
- **响应式设计**: 支持移动端和桌面端
- **主题定制**: Ant Design 主题变量覆盖
- **路径别名**: `@components`, `@hooks`, `@utils`, `@styles`

---

## 四、后端技术栈

| 技术 | 用途 |
|------|------|
| **Cloudflare Pages Functions** | Serverless 后端 |
| **Cloudflare D1** | SQLite 数据库 |
| **Wrangler** | Cloudflare CLI 工具 |

### API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/websites` | GET | 获取网站列表 |
| `/api/news` | GET | 获取新闻列表 (分页) |
| `/api/submit` | POST | 提交新网站 |
| `/api/likes` | POST | 点赞功能 |
| `/api/comments` | GET/POST | 评论功能 |
| `/api/feedback` | POST | 用户反馈 |
| `/api/status` | GET | 网站状态检测 |

---

## 五、数据库结构 (D1 SQLite)

| 表名 | 用途 |
|------|------|
| `websites` | 核心网站数据 (名称、URL、状态、延迟) |
| `submissions` | 用户提交的网站 (待审核) |
| `likes` | 点赞记录 |
| `comments` | 评论记录 |
| `news` | AI 新闻 (TechCrunch/36Kr) |
| `feedback` | 用户反馈 |
| `login_attempts` | 登录失败记录 (指数退避) |
| `rate_limits` | 频率限制 |

---

## 六、主要功能模块

### 1. API 中转汇聚 (首页)
- 展示 AI API 中转站列表
- 网站状态实时监控 (在线/离线/检测中)
- 延迟显示
- 点赞和评论互动
- 用户提交新网站

### 2. AI 前沿动态 (新闻页)
- 聚合 TechCrunch 和 36Kr 的 AI 新闻
- 支持分页加载
- 新闻刷新功能

### 3. VPN 推荐
- 精选 VPN 服务展示

### 4. 配置指南
- Claude Code 和 Codex CLI 配置教程
- 第三方 API 接入指南

---

## 七、开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器 (Vite)
npm run dev

# 启动 Cloudflare 本地开发
npm run dev:cf

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 部署到 Cloudflare Pages
npm run deploy
```

---

## 八、项目亮点

1. **Serverless 架构**: 基于 Cloudflare Pages + D1，无需管理服务器
2. **国际化支持**: 完整的中英文双语支持
3. **实时状态监控**: 自动检测 API 中转站可用性
4. **防刷机制**: IP 限流、提交限制、评论限制
5. **响应式 UI**: 使用 Ant Design 构建现代化界面
6. **SEO 友好**: 支持 SSR 渲染

---

## Update Log - 2026-01-12

### 新增：首页卡片数据流架构分析

#### 数据来源确认

首页 API 卡片数据**来自后台 D1 数据库**，通过 Cloudflare Functions 进行服务端渲染。

#### 数据流架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端页面       │◄───│  Cloudflare     │◄───│  D1 数据库      │
│   (HTML/SSR)    │    │  Functions      │    │  (SQLite)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 核心实现逻辑

**文件位置**: `functions/index.js`

```javascript
// 1. 从 D1 数据库获取网站数据 (第19行)
const { results: siteResults } = await env.DB.prepare("SELECT * FROM websites").all();

// 2. 获取点赞统计 (第22行)
const { results: likeResults } = await env.DB.prepare(
  "SELECT card_id, count(*) as count FROM likes GROUP BY card_id"
).all();

// 3. 获取评论统计 (第25行)
const { results: commentResults } = await env.DB.prepare(
  "SELECT card_id, count(*) as count FROM comments GROUP BY card_id"
).all();
```

#### 涉及数据库表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `websites` | 网站信息 | id, name, description, display_url, invite_link, status, latency, last_checked |
| `likes` | 点赞记录 | card_id, ip, created_at |
| `comments` | 评论记录 | card_id, nickname, content, created_at |

#### 排序规则

`functions/index.js:42-52`:

1. **在线优先** - status = 'online' 的排在前面
2. **点赞数降序** - 点赞多的排前面
3. **ID 升序** - 相同情况下按 ID 排序

#### 两套前端实现对比

| 类型 | 文件路径 | 数据来源 | 使用场景 |
|------|----------|----------|----------|
| **SSR 版本** | `functions/index.js` | D1 数据库实时查询 | 生产环境 |
| **React SPA** | `src/pages/Home.jsx` + `src/hooks/useApi.js` | Mock 数据 | 本地开发 |

#### 修改文件清单

- 分析文件: `functions/index.js`, `src/pages/Home.jsx`, `src/hooks/useApi.js`
