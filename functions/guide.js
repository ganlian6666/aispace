import { getLocale, t } from './utils/i18n.js';

export async function onRequestGet(context) {
  const { request } = context;
  const cookie = request.headers.get('Cookie');
  const locale = getLocale(request.headers.get('Accept-Language'), cookie);
  const T = (key, vars) => t(locale, key, vars);

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${T('guide_page_title')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet" />
  <link rel="stylesheet" href="/guide.css">
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
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            ${T('brand_subtitle')}
          </p>
        </div>
      </div>
      <nav>
        <a href="/">${T('nav_home')}</a>
        <a href="/news">${T('nav_news')}</a>
        <a href="/vpn">${T('nav_vpn')}</a>
        <a href="/guide" class="active">${T('nav_guide')}</a>
      </nav>
      <div style="display:flex; align-items:center; margin-left: auto;">
        <div class="github-link" style="margin-left: 0;">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer" style="color:var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px; height:20px; fill:currentColor;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span style="font-size:14px;">${T('github_text')}</span>
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
        <h1>${T('guide_hero_title')}</h1>
        <p>${T('guide_hero_desc')}</p>
      </div>
    </section>

    <div class="content-wrapper">
      <!-- ... (Content skipped for brevity, assumed unchanged layout logic) ... -->
      <!-- 系统标签 -->
      <div class="os-tabs">
        <button class="os-tab active" data-os="windows">
          <svg viewBox="0 0 24 24">
            <path
              d="M3 12V6.75l6-1.32v6.48L3 12zm7-7.65l8-1.75v9.4H10V4.35zm8 18.25l-8-1.35v-6.5h8v7.85zm-15-1.4V15l6-.09v6.43l-6-1.14z" />
          </svg>
          Windows
        </button>
        <button class="os-tab" data-os="mac">
          <svg viewBox="0 0 24 24">
            <path
              d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          macOS
        </button>
        <button class="os-tab" data-os="linux">
          <svg viewBox="0 0 24 24">
            <path
              d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0 .054-.01.12-.013.18-.012.126-.039.243-.078.352-.053.162-.124.334-.206.458a.711.711 0 01-.256.282.41.41 0 01-.184.063h-.013c-.166 0-.31-.066-.453-.179-.142-.121-.252-.273-.324-.449-.071-.181-.11-.386-.123-.597-.007-.063-.008-.122-.01-.186.006-.099.026-.197.049-.297.017-.085.041-.169.072-.252a.863.863 0 01.213-.328.552.552 0 01.124-.088.498.498 0 01-.001 0zm-2.197.16h.039a.56.56 0 01.135.031.649.649 0 01.185.098.737.737 0 01.199.248c.089.164.15.347.18.535.009.067.015.16.014.229-.007.226-.07.436-.175.608a.76.76 0 01-.166.206.631.631 0 01-.178.109.5.5 0 01-.146.032h-.032c-.153 0-.287-.047-.405-.134a.863.863 0 01-.276-.344c-.074-.162-.113-.343-.124-.531l-.001-.098c0-.039.002-.073.008-.107a1.202 1.202 0 01.104-.435.66.66 0 01.235-.295.464.464 0 01.275-.094h-.001zm4.59 4.778a.253.253 0 01.022.019c.298.329.525.618.694.858.169.24.298.429.379.597.14.354.14.588-.022.701a.27.27 0 01-.131.052c-.082 0-.186-.049-.319-.178-.166-.162-.36-.417-.585-.715a17.16 17.16 0 01-.639-.901c-.076-.123-.128-.236-.134-.32-.006-.071.014-.137.062-.178a.138.138 0 01.086-.027c.054 0 .123.023.207.075.083.051.178.124.285.217zm-2.886.179c.194 0 .325.099.327.28.007.181-.107.34-.324.482-.114.078-.254.137-.415.172a1.453 1.453 0 01-.305.028c-.093 0-.18-.011-.262-.032a.833.833 0 01-.195-.079.393.393 0 01-.13-.109.25.25 0 01-.045-.15.259.259 0 01.018-.097.218.218 0 01.052-.073c.026-.022.051-.044.085-.055a.484.484 0 01.127-.024c.047 0 .089.011.127.025.04.014.073.035.102.055a.413.413 0 00.113.054c.038.01.081.017.128.017h.002a.556.556 0 00.22-.039c.08-.03.141-.074.166-.142.03-.074.019-.17-.034-.272a1.008 1.008 0 00-.2-.284.92.92 0 00-.27-.183.53.53 0 00-.234-.061.388.388 0 00-.152.035.405.405 0 00-.138.107l-.03.041a.246.246 0 01-.206.103.235.235 0 01-.17-.072.238.238 0 01-.067-.185.358.358 0 01.049-.163c.03-.056.066-.106.11-.149.091-.089.198-.156.317-.198a1.055 1.055 0 01.367-.063zm-.847 1.985l-.001.002v-.002zm6.215.216a.267.267 0 01.099.019c.063.024.131.066.19.128.059.063.108.145.136.255.028.109.028.253-.02.411-.104.341-.378.593-.64.826-.26.232-.512.439-.67.673-.17.268-.211.51-.167.766.044.244.159.478.302.714.142.236.31.468.43.752.12.283.178.644.047 1.037l-.001.002.002.005c.082.249.079.53-.028.785-.106.256-.306.491-.597.666-.59.351-1.457.447-2.383.142a.393.393 0 01-.132-.072.396.396 0 01-.092-.118.406.406 0 01-.037-.15.402.402 0 01.018-.156.414.414 0 01.185-.234.4.4 0 01.145-.054.38.38 0 01.15.005c.747.246 1.406.206 1.83-.064.213-.132.362-.319.43-.527.069-.209.051-.45-.071-.699l-.004-.007c-.098-.209-.224-.413-.346-.614-.123-.201-.248-.406-.328-.651-.079-.245-.105-.544-.012-.903.092-.36.307-.679.545-.95.238-.272.494-.502.659-.75l.002-.002a.328.328 0 01.033-.039c.074-.079.181-.129.303-.132z" />
          </svg>
          Linux
        </button>
      </div>

      <!-- Windows 教程 -->
      <div class="os-content active" id="windows">
        <div class="guide-section">
          <h2>${T('guide_win_title')}</h2>
          <p>${T('guide_win_desc')}</p>

          <h3>${T('guide_step_env')}</h3>
          <h4>1. 安装 Node.js</h4>
          <p>首先确保你的系统已安装 Node.js (建议 v18 或更高版本)：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 检查 Node.js 版本
node --version

# 如未安装，请从官网下载: https://nodejs.org/</code>
          </div>

          <h4>2. 安装 Claude Code CLI</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 使用 npm 全局安装
npm install -g @anthropic-ai/claude-code</code>
          </div>

          <h4>3. 安装 Codex CLI</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 使用 npm 全局安装
npm install -g @openai/codex</code>
          </div>

          <h3>${T('guide_step_claude')}</h3>

          <h4>方法一：使用环境变量配置</h4>
          <p>打开 PowerShell 或命令提示符，设置环境变量：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 设置 API 基础地址（替换为你的中转服务地址）
set ANTHROPIC_BASE_URL=https://your-api-proxy.com

# 设置 API 密钥（替换为你的密钥）
set ANTHROPIC_API_KEY=sk-your-api-key-here

# 启动 Claude Code
claude</code>
          </div>

          <h4>方法二：永久配置环境变量</h4>
          <ol class="step-list">
            <li>右键点击"此电脑" → "属性" → "高级系统设置"</li>
            <li>点击"环境变量"按钮</li>
            <li>在"用户变量"中点击"新建"</li>
            <li>添加以下变量：
              <div class="code-block">
                <code>变量名: ANTHROPIC_BASE_URL
变量值: https://your-api-proxy.com

变量名: ANTHROPIC_API_KEY
变量值: sk-your-api-key-here</code>
              </div>
            </li>
            <li>点击"确定"保存，重启终端生效</li>
          </ol>

          <h3>${T('guide_step_codex')}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 设置 OpenAI API 基础地址
set OPENAI_BASE_URL=https://your-api-proxy.com/v1

# 设置 API 密钥
set OPENAI_API_KEY=sk-your-api-key-here

# 启动 Codex
codex</code>
          </div>

          <div class="tip-box">
            <strong>提示：</strong> 建议将环境变量添加到系统的永久配置中，避免每次重启后需要重新设置。
          </div>

          <h3>${T('guide_step_verify')}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 测试 Claude Code
claude --version
claude "Hello, this is a test"

# 测试 Codex
codex --version
codex "Write a hello world in Python"</code>
          </div>
        </div>
      </div>

      <!-- macOS 教程 -->
      <div class="os-content" id="mac">
        <div class="guide-section">
          <h2>${T('guide_mac_title')}</h2>
          <p>${T('guide_mac_desc')}</p>

          <h3>${T('guide_step_env')}</h3>
          <h4>1. 安装 Homebrew（如未安装）</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code>
          </div>

          <h4>2. 安装 Node.js</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 使用 Homebrew 安装
brew install node

# 验证安装
node --version
npm --version</code>
          </div>

          <h4>3. 安装 Claude Code 和 Codex CLI</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 安装 Codex
npm install -g @openai/codex</code>
          </div>

          <h3>${T('guide_step_claude')}</h3>

          <h4>方法一：临时配置（当前终端会话有效）</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 设置 API 基础地址
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"

# 设置 API 密钥
export ANTHROPIC_API_KEY="sk-your-api-key-here"

# 启动 Claude Code
claude</code>
          </div>

          <h4>方法二：永久配置（推荐）</h4>
          <p>编辑你的 shell 配置文件：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 如果使用 zsh（macOS 默认）
nano ~/.zshrc

# 如果使用 bash
nano ~/.bash_profile</code>
          </div>
          <p>在文件末尾添加以下内容：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># Claude Code API 配置
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"

# Codex API 配置
export OPENAI_BASE_URL="https://your-api-proxy.com/v1"
export OPENAI_API_KEY="sk-your-api-key-here"</code>
          </div>
          <p>保存后执行以下命令使配置生效：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 重新加载配置
source ~/.zshrc  # 或 source ~/.bash_profile</code>
          </div>

          <h3>${T('guide_step_verify')}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 检查环境变量是否设置成功
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_API_KEY

# 测试 Claude Code
claude "Hello, this is a test"

# 测试 Codex
codex "Write a hello world in Python"</code>
          </div>

          <div class="tip-box warning">
            <strong>注意：</strong> 请妥善保管你的 API 密钥，不要将其提交到公开的代码仓库中。
          </div>
        </div>
      </div>

      <!-- Linux 教程 -->
      <div class="os-content" id="linux">
        <div class="guide-section">
          <h2>${T('guide_linux_title')}</h2>
          <p>${T('guide_linux_desc')}</p>

          <h3>${T('guide_step_env')}</h3>
          <h4>1. 安装 Node.js</h4>
          <p>使用 NodeSource 仓库安装最新版 Node.js：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL/Fedora
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Arch Linux
sudo pacman -S nodejs npm

# 验证安装
node --version
npm --version</code>
          </div>

          <h4>2. 安装 Claude Code 和 Codex CLI</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 安装 Claude Code
sudo npm install -g @anthropic-ai/claude-code

# 安装 Codex
sudo npm install -g @openai/codex</code>
          </div>

          <h3>${T('guide_step_claude')}</h3>

          <h4>方法一：临时配置</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 设置环境变量并启动
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"
claude</code>
          </div>

          <h4>方法二：永久配置</h4>
          <p>编辑 ~/.bashrc 或 ~/.zshrc 文件：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 使用你喜欢的编辑器
vim ~/.bashrc
# 或
nano ~/.bashrc</code>
          </div>
          <p>在文件末尾添加：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># ===== API 配置 =====
# Claude Code
export ANTHROPIC_BASE_URL="https://your-api-proxy.com"
export ANTHROPIC_API_KEY="sk-your-api-key-here"

# Codex
export OPENAI_BASE_URL="https://your-api-proxy.com/v1"
export OPENAI_API_KEY="sk-your-api-key-here"</code>
          </div>
          <p>使配置生效：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code>source ~/.bashrc</code>
          </div>

          <h4>方法三：使用 systemd 用户环境变量（适用于桌面环境）</h4>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 创建或编辑环境变量文件
mkdir -p ~/.config/environment.d
nano ~/.config/environment.d/api.conf</code>
          </div>
          <p>添加以下内容：</p>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code>ANTHROPIC_BASE_URL=https://your-api-proxy.com
ANTHROPIC_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://your-api-proxy.com/v1
OPENAI_API_KEY=sk-your-api-key-here</code>
          </div>

          <h3>${T('guide_step_verify')}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 验证环境变量
env | grep -E "(ANTHROPIC|OPENAI)"

# 测试 Claude Code
claude --version
claude "Hello, this is a test"

# 测试 Codex
codex --version
codex "Write a hello world in Python"</code>
          </div>

          <div class="tip-box">
            <strong>提示：</strong> 如果遇到权限问题，可以考虑使用 nvm (Node Version Manager) 来管理 Node.js，这样可以避免使用 sudo 安装全局包。
          </div>

          <h3>${T('guide_step_troubleshoot')}</h3>
          <div class="code-block">
            <button class="copy-btn" onclick="copyCode(this)">${T('btn_copy')}</button>
            <code># 检查网络连接
curl -I https://your-api-proxy.com/v1

# 检查 DNS 解析
nslookup your-api-proxy.com

# 如果使用代理
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890</code>
          </div>
        </div>
      </div>

      <!-- 通用说明 -->
      <div class="guide-section">
        <h2>${T('guide_common_title')}</h2>

        <h3>${T('guide_env_vars')}</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: rgba(255,255,255,0.05);">
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T('guide_table_tool')}</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T('guide_table_env')}</th>
              <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--card-border);">${T('guide_table_desc')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Claude Code</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                ANTHROPIC_BASE_URL</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">API 基础地址</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Claude Code</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                ANTHROPIC_API_KEY</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">API 密钥</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">Codex</td>
              <td
                style="padding: 12px; border-bottom: 1px solid var(--card-border); font-family: monospace; color: var(--accent-glow);">
                OPENAI_BASE_URL</td>
              <td style="padding: 12px; border-bottom: 1px solid var(--card-border);">API 基础地址</td>
            </tr>
            <tr>
              <td style="padding: 12px;">Codex</td>
              <td style="padding: 12px; font-family: monospace; color: var(--accent-glow);">OPENAI_API_KEY</td>
              <td style="padding: 12px;">API 密钥</td>
            </tr>
          </tbody>
        </table>

        <div class="tip-box warning">
          <strong>${T('guide_tip_security')}：</strong>
          <ul>
            <li>${T('guide_security_1')}</li>
            <li>${T('guide_security_2')}</li>
            <li>${T('guide_security_3')}</li>
            <li>${T('guide_security_4')}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Language Switcher Logic
    function switchLanguage() {
        const currentLocale = '${locale}';
        const targetLocale = currentLocale === 'zh' ? 'en' : 'zh';
        document.cookie = \`locale=\${targetLocale}; path=/; max-age=31536000\`;
        window.location.reload();
    }

    // 系统标签切换
    document.querySelectorAll('.os-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除所有 active 状态
        document.querySelectorAll('.os-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.os-content').forEach(c => c.classList.remove('active'));

        // 添加当前 active 状态
        tab.classList.add('active');
        const os = tab.dataset.os;
        document.getElementById(os).classList.add('active');
      });
    });

    // 复制代码功能
    function copyCode(button) {
      const codeBlock = button.parentElement;
      const code = codeBlock.querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = "${T('btn_copied_text')}";
        setTimeout(() => {
          button.textContent = "${T('btn_copy')}";
        }, 2000);
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' }
  });
}
