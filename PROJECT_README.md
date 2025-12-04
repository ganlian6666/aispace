# AI Space - 智能 AI 服务导航与监控平台

## 1. 项目简介
**AI Space** 是一个基于 **Cloudflare 生态** 构建的高性能、服务端渲染 (SSR) 的 AI 服务聚合导航网站。
它不仅是一个静态的链接列表，更是一个**动态的监控平台**。它能实时检测目标网站的存活状态，支持用户互动（点赞、评论），并提供了一个安全隐蔽的后台管理系统，实现了从“硬编码”到“全数据库驱动”的架构升级。

---

## 2. 技术栈 (Tech Stack)

本项目采用了现代化的 Serverless 架构，追求极致的性能和低成本维护。

*   **运行环境**: [Cloudflare Pages](https://pages.cloudflare.com/) (托管静态资源与 Function)
*   **后端计算**: [Cloudflare Workers](https://workers.cloudflare.com/) (负责 SSR 渲染、API 逻辑、状态检测)
*   **数据库**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (基于 SQLite 的边缘 Serverless 数据库)
*   **前端技术**:
    *   **HTML5/CSS3**: 纯原生实现，无庞大的前端框架（React/Vue），保证秒开速度。
    *   **JavaScript (ES6+)**: 处理轻量级交互（弹窗、AJAX 请求）。
    *   **Design**: 采用 **Glassmorphism (毛玻璃)** 设计风格，深色模式，视觉体验高端。

---

## 3. 核心功能模块

### A. 用户端 (Front Office)
1.  **SSR 服务端渲染**:
    *   首页 HTML 由后端动态生成，包含最新的点赞数、评论数和网站状态。
    *   **SEO 友好**，且解决了客户端渲染常见的“布局跳动”问题。
2.  **智能排序系统**:
    *   **优先级 1**: 状态（在线的网站永远排在维护中的网站前面）。
    *   **优先级 2**: 热度（点赞数多的排前面）。
    *   **优先级 3**: 收录时间（ID 顺序）。
3.  **实时状态监控**:
    *   后端定时（或按需）检测目标网站的连通性。
    *   显示“在线/维护中”状态标签，以及具体的延迟时间（如 `在线 200ms`）。
    *   **智能检测策略**: 仅检测“从未检测过”或“超过 6 小时未检测”的站点，节省资源。
4.  **用户互动系统**:
    *   **点赞**: 每日 IP 限流，防止刷票。
    *   **评论**: 支持昵称设置（本地持久化存储），支持“匿名访问”模式。
5.  **隐式邀请链接**:
    *   前端展示干净的域名（如 `example.com`），点击后自动跳转带参数的邀请链接（如 `example.com?aff=123`）。

### B. 管理端 (Back Office)
1.  **隐蔽入口**:
    *   后台地址为 `/Ganlian`（非标准 `/admin`），利用“隐身术”防御扫描。
2.  **安全鉴权**:
    *   **环境变量密码**: 密码存储在 Cloudflare 环境变量 `ADMIN_PASSWORD` 中，代码中无硬编码。
    *   **Session 存储**: 登录状态保存在 `sessionStorage`，关闭浏览器标签页即自动登出。
    *   **防暴力破解**: 密码错误时强制延迟响应，极大增加破解成本。
3.  **可视化管理**:
    *   提供 Web 界面进行网站的 **增、删、改、查**。
    *   新增网站后，系统会**立即触发**状态检测，无需等待。

---

## 4. 数据库设计 (Schema)

基于 Cloudflare D1 (SQLite)，核心表结构如下：

### `websites` (核心表)
存储网站的基础信息和实时状态。
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | INTEGER | 主键，自增 |
| `name` | TEXT | 网站名称 |
| `description` | TEXT | 简短描述 |
| `invite_link` | TEXT | 实际跳转链接 (带邀请码) |
| `display_url` | TEXT | 前端展示链接 (用于显示和状态检测) |
| `status` | TEXT | 'online' 或 'offline' |
| `latency` | INTEGER | 延迟 (ms) |
| `last_checked` | DATETIME | 最后检测时间 |

### `likes` (点赞表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `card_id` | INTEGER | 关联 websites.id |
| `ip` | TEXT | 用户 IP (用于限流) |

### `comments` (评论表)
| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `card_id` | INTEGER | 关联 websites.id |
| `nickname` | TEXT | 用户昵称 |
| `content` | TEXT | 评论内容 |

---

## 5. 项目目录结构

```text
/
├── functions/              # Cloudflare Pages Functions (后端逻辑)
│   ├── api/                # API 接口
│   │   ├── admin/          # 管理员 API
│   │   │   └── websites.js # 网站增删改查接口
│   │   ├── comments.js     # 评论 API
│   │   ├── likes.js        # 点赞 API
│   │   ├── status.js       # 状态检测 API
│   │   └── submit.js       # (预留) 用户提交 API
│   ├── Ganlian.js          # 后台管理页面 (隐蔽入口)
│   └── index.js            # 首页 SSR 渲染逻辑 (核心入口)
├── index.html              # (已废弃) 旧的静态首页，现由 index.js 接管
├── schema.sql              # 数据库初始化脚本
├── reset.sql               # 数据库重置脚本
├── wrangler.toml           # Cloudflare 配置文件 (定义数据库绑定等)
└── PROJECT_README.md       # 项目说明文档
```

## 6. 部署与维护

1.  **本地开发**:
    ```bash
    npx wrangler pages dev .
    ```
2.  **部署上线**:
    ```bash
    git push
    ```
    (Cloudflare Pages 会自动监听 GitHub 仓库变动并构建)
3.  **首次配置**:
    *   在 Cloudflare 后台绑定 D1 数据库 (变量名 `DB`)。
    *   设置环境变量 `ADMIN_PASSWORD`。
    *   执行 `schema.sql` 初始化数据库。
