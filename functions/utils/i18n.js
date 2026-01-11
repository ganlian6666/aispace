export const translations = {
    // 中文
    zh: {
        // Shared
        brand_name: "自由空间",
        brand_subtitle: "自由AI空间·开放分享平台",
        nav_home: "API中转汇聚",
        nav_news: "AI 前沿动态",
        nav_vpn: "VPN",
        nav_guide: "配置指南",
        github_text: "GitHub",

        // Home (index.js)
        home_title: "API中转汇聚 · 自由空间",
        hero_title: "不定期分享优质API接口",
        hero_subtitle: "每一条 API 都经过人工检测，基本支持claude code，codex和国内优质AI模型，请放心使用！",
        submit_hint: "欢迎分享稳定高效的中转站!",
        btn_submit: "提交网站",
        status_checking: "检测中",
        btn_invite_copy: "邀请链接 · 复制",
        btn_copied: "已复制!",
        text_last_checked: "最后检测",
        text_never_checked: "从未检测",
        comment_placeholder: "输入评论...",
        btn_send: "发送",
        nickname_current: "当前昵称",
        btn_modify: "[修改]",
        modal_submit_title: "提交新的中转站",
        modal_submit_desc: "欢迎分享你的中转站，提交后需要审核验证，通过的会将你的邀请链接挂到主页上！",
        label_name: "中转站名称 *",
        placeholder_name: "例如: OpenAI官方API",
        label_url: "网站地址 *",
        placeholder_url: "例如: https://chatgpt.com/",
        label_invite: "邀请链接",
        placeholder_invite: "例如: https://chatgpt.com/invite?code=abc",
        label_desc: "简单描述",
        placeholder_desc: "简单介绍一下...",
        btn_feedback: "反馈建议",
        btn_cancel: "取消",
        btn_submit_confirm: "提交",
        modal_feedback_title: "意见反馈",
        modal_feedback_desc: "无论是 Bug 报告还是功能建议，我们都非常欢迎！",
        label_feedback_content: "反馈内容 *",
        placeholder_feedback_content: "请详细描述您的建议或遇到的问题...",
        label_contact: "联系方式 (选填)",
        placeholder_contact: "邮箱或微信号，方便我们联系您",
        btn_send_feedback: "发送反馈",
        modal_nickname_title: "设置昵称",
        modal_nickname_desc: "请设置一个昵称以便发表评论。设置后将自动保存。",
        label_nickname: "昵称 *",
        placeholder_nickname: "例如: 匿名用户",
        btn_anonymous: "匿名访问",
        btn_save: "保存",
        alert_submit_success: "提交成功！感谢您的分享。",
        alert_submit_fail: "提交失败",
        alert_network_error: "网络错误，请稍后重试",
        alert_feedback_success: "感谢您的反馈！我们会认真查看。",
        alert_like_limit: "您今天点赞太频繁了，请明天再来！",
        alert_comment_limit: "您今天评论太多了，休息一下吧！",
        alert_nickname_required: "请输入昵称",
        loading: "加载中...",
        no_comments: "暂无评论，快来抢沙发！",

        // News (news.js)
        news_page_title: "AI 前沿动态 · 自由空间",
        news_header: "AI 前沿动态",
        news_subtitle: "汇聚 TechCrunch 与 36Kr 的最新 AI 资讯，实时翻译，全球同步。",
        btn_refresh_news: "刷新资讯",
        btn_refreshing: "正在获取...",
        btn_read_more: "阅读原文",
        btn_load_more: "查看更早的新闻",
        text_no_news: "暂无新闻，请点击刷新按钮获取最新资讯。",
        alert_update_success: "更新成功！获取了 {fetched} 条，新增 {inserted} 条。",
        alert_rate_limit: "刷新太频繁，请稍后再试。",

        // VPN (vpn.js)
        vpn_page_title: "VPN推荐 · 自由空间",
        vpn_hero_title: "VPN 推荐 · 精选服务",
        vpn_hero_desc: "经过严格测试和用户反馈筛选的优质VPN服务，提供稳定快速的全球网络访问体验。",
        vpn_top_1: "TOP 1",
        vpn_top_2: "TOP 2",
        vpn_top_3: "TOP 3",
        tag_speed: "⚡ 速度",
        tag_stable: "● 稳定",
        price_suffix: "/月起",
        btn_visit: "立即访问",
        section_features: "核心特性",
        section_payment: "💳 支付方式",

        // Guide (guide.js)
        guide_page_title: "配置指南 · 自由空间",
        guide_hero_title: "API 配置指南",
        guide_hero_desc: "全面的 Claude Code 和 Codex CLI 配置教程，帮助你快速接入第三方 API 中转服务。",
        guide_win_title: "Windows 系统配置教程",
        guide_win_desc: "本教程将指导你在 Windows 系统上配置 Claude Code 和 Codex CLI 使用第三方 API 中转服务。",
        guide_mac_title: "macOS 系统配置教程",
        guide_mac_desc: "本教程将指导你在 macOS 系统上配置 Claude Code 和 Codex CLI 使用第三方 API 中转服务。",
        guide_linux_title: "Linux 系统配置教程",
        guide_linux_desc: "本教程将指导你在 Linux 系统上配置 Claude Code 和 Codex CLI 使用第三方 API 中转服务。",
        guide_common_title: "通用配置说明",
        guide_env_vars: "支持的环境变量",
        guide_table_tool: "工具",
        guide_table_env: "环境变量",
        guide_table_desc: "说明",
        guide_tip_security: "安全提醒",
        guide_security_1: "不要将 API 密钥提交到公开的代码仓库",
        guide_security_2: "定期轮换你的 API 密钥",
        guide_security_3: "使用环境变量而非硬编码密钥",
        guide_security_4: "在共享设备上使用完毕后清除环境变量",
        btn_copy: "复制",
        btn_copied_text: "已复制",

        // Guide Content Headers & Steps
        guide_step_env: "一、环境准备",
        guide_step_claude: "二、配置 Claude Code 使用第三方 API",
        guide_step_codex: "三、配置 Codex CLI 使用第三方 API",
        guide_step_verify: "四、验证配置",
        guide_step_troubleshoot: "四、常见问题排查",

        // Detailed Steps (New)
        guide_step_1_node: "1. 安装 Node.js",
        guide_step_1_homebrew: "1. 安装 Homebrew（如未安装）",
        guide_step_2_node: "2. 安装 Node.js",
        guide_step_2_cli: "2. 安装 Claude Code CLI",
        guide_step_3_cli: "3. 安装 Claude Code 和 Codex CLI",
        guide_step_3_codex: "3. 安装 Codex CLI",

        guide_desc_node_check: "首先确保你的系统已安装 Node.js (建议 v18 或更高版本)：",
        guide_desc_node_source: "使用 NodeSource 仓库安装最新版 Node.js：",
        guide_desc_mac_brew: "使用 Homebrew 安装",

        guide_method_1_env: "方法一：使用环境变量配置",
        guide_method_2_perm: "方法二：永久配置环境变量",
        guide_method_1_temp: "方法一：临时配置（当前终端会话有效）",
        guide_method_2_perm_rec: "方法二：永久配置（推荐）",
        guide_method_3_systemd: "方法三：使用 systemd 用户环境变量（适用于桌面环境）",

        guide_text_open_ps: "打开 PowerShell 或命令提示符，设置环境变量：",
        guide_text_edit_profile: "编辑你的 shell 配置文件：",
        guide_text_append: "在文件末尾添加以下内容：",
        guide_text_save_apply: "保存后执行以下命令使配置生效：",
        guide_tip_persist: "提示：建议将环境变量添加到系统的永久配置中，避免每次重启后需要重新设置。",

        // Windows Specific Steps
        guide_win_step_1: "右键点击\"此电脑\" → \"属性\" → \"高级系统设置\"",
        guide_win_step_2: "点击\"环境变量\"按钮",
        guide_win_step_3: "在\"用户变量\"中点击\"新建\"",
        guide_win_step_4: "添加以下变量：",
        guide_win_step_5: "点击\"确定\"保存，重启终端生效",
        guide_var_name: "变量名",
        guide_var_value: "变量值",

        // Code Comments & Tips
        code_comment_check_node: "# 检查 Node.js 版本",
        code_comment_install_node_missing: "# 如未安装，请从官网下载: https://nodejs.org/",
        code_comment_npm_global: "# 使用 npm 全局安装",
        code_comment_anthropic_base_long: "# 设置 API 基础地址（替换为你的中转服务地址）",
        code_comment_anthropic_key_long: "# 设置 API 密钥（替换为你的密钥）",
        code_comment_start_claude: "# 启动 Claude Code",
        code_comment_openai_base: "# 设置 OpenAI API 基础地址",
        code_comment_openai_key: "# 设置 API 密钥",
        code_comment_start_codex: "# 启动 Codex",
        code_comment_test_claude: "# 测试 Claude Code",
        code_comment_test_codex: "# 测试 Codex",
        code_comment_install_claude: "# 安装 Claude Code",
        code_comment_install_codex: "# 安装 Codex",
        code_comment_set_api_base: "# 设置 API 基础地址",
        code_comment_set_api_key: "# 设置 API 密钥",
        code_comment_claude_config: "# Claude Code API 配置",
        code_comment_codex_config: "# Codex API 配置",
        code_comment_reload_config: "# 重新加载配置",
        code_comment_check_env: "# 检查环境变量是否设置成功",
        code_comment_set_env_launch: "# 设置环境变量并启动",
        code_comment_use_editor: "# 使用你喜欢的编辑器",
        code_comment_or: "# 或",
        code_comment_api_config_header: "# ===== API 配置 =====",
        code_comment_create_env_file: "# 创建或编辑环境变量文件",
        code_comment_verify_env: "# 验证环境变量",
        guide_nvm_tip: "<strong>提示：</strong> 如果遇到权限问题，可以考虑使用 nvm (Node Version Manager) 来管理 Node.js，这样可以避免使用 sudo 安装全局包。",
        code_comment_check_network: "# 检查网络连接",
        code_comment_check_dns: "# 检查 DNS 解析",
        code_comment_use_proxy: "# 如果使用代理",
        code_comment_verify_install: "# 验证安装",
        guide_desc_api_base: "API 基础地址",
        guide_desc_api_key: "API 密钥",
        code_comment_mac_zsh: "# 如果使用 zsh（macOS 默认）",
        code_comment_mac_bash: "# 如果使用 bash",
        guide_note_label: "注意："
    },

    // English
    en: {
        // Shared
        brand_name: "AI Space",
        brand_subtitle: "Open AI Sharing Platform",
        nav_home: "API Hub",
        nav_news: "AI News",
        nav_vpn: "VPN",
        nav_guide: "Setup Guide",
        github_text: "GitHub",

        // Home (index.js)
        home_title: "API Hub · AI Space",
        hero_title: "Quality API Relay Sharing",
        hero_subtitle: "Verified APIs supporting Claude Code, Codex, and top AI models. Use with confidence!",
        submit_hint: "Share your stable API relay!",
        btn_submit: "Submit Site",
        status_checking: "Checking",
        btn_invite_copy: "Invite Link · Copy",
        btn_copied: "Copied!",
        text_last_checked: "Last Checked",
        text_never_checked: "Never Checked",
        comment_placeholder: "Type a comment...",
        btn_send: "Send",
        nickname_current: "Nickname",
        btn_modify: "[Edit]",
        modal_submit_title: "Submit New Relay",
        modal_submit_desc: "Share your API relay. Once verified, your invite link will be featured on the homepage!",
        label_name: "Relay Name *",
        placeholder_name: "e.g., OpenAI Official API",
        label_url: "Website URL *",
        placeholder_url: "e.g., https://chatgpt.com/",
        label_invite: "Invite Link",
        placeholder_invite: "e.g., https://chatgpt.com/invite?code=abc",
        label_desc: "Description",
        placeholder_desc: "Brief description...",
        btn_feedback: "Feedback",
        btn_cancel: "Cancel",
        btn_submit_confirm: "Submit",
        modal_feedback_title: "Feedback",
        modal_feedback_desc: "Bug reports or feature suggestions are welcome!",
        label_feedback_content: "Content *",
        placeholder_feedback_content: "Describe your suggestion or issue...",
        label_contact: "Contact (Optional)",
        placeholder_contact: "Email or WeChat for follow-up",
        btn_send_feedback: "Send Feedback",
        modal_nickname_title: "Set Nickname",
        modal_nickname_desc: "Set a nickname to post comments. It will be saved automatically.",
        label_nickname: "Nickname *",
        placeholder_nickname: "e.g., Anonymous",
        btn_anonymous: "Go Anonymous",
        btn_save: "Save",
        alert_submit_success: "Submitted successfully! Thanks for sharing.",
        alert_submit_fail: "Submission failed",
        alert_network_error: "Network error, please try again later",
        alert_feedback_success: "Thank you for your feedback!",
        alert_like_limit: "You've liked too many times today, come back tomorrow!",
        alert_comment_limit: "You've commented too much today, take a break!",
        alert_nickname_required: "Please enter a nickname",
        loading: "Loading...",
        no_comments: "No comments yet, be the first!",

        // News (news.js)
        news_page_title: "AI News · AI Space",
        news_header: "AI Frontier News",
        news_subtitle: "Latest AI news from TechCrunch & 36Kr, translated globally.",
        btn_refresh_news: "Refresh News",
        btn_refreshing: "Fetching...",
        btn_read_more: "Read More",
        btn_load_more: "Load More News",
        text_no_news: "No news available, click refresh to get the latest updates.",
        alert_update_success: "Update successful! Fetched {fetched}, Inserted {inserted}.",
        alert_rate_limit: "Too many requests, please try again later.",

        // VPN (vpn.js)
        vpn_page_title: "VPN Recommendations · AI Space",
        vpn_hero_title: "Recommended VPNs",
        vpn_hero_desc: "Strictly tested VPN services providing stable and fast global access.",
        vpn_top_1: "TOP 1",
        vpn_top_2: "TOP 2",
        vpn_top_3: "TOP 3",
        tag_speed: "⚡ Speed",
        tag_stable: "● Stable",
        price_suffix: "/mo",
        btn_visit: "Visit Now",
        section_features: "Core Features",
        section_payment: "💳 Payment Methods",

        // Guide (guide.js)
        guide_page_title: "Setup Guide · AI Space",
        guide_hero_title: "API Setup Guide",
        guide_hero_desc: "Comprehensive tutorials for Claude Code and Codex CLI configuration.",
        guide_win_title: "Windows Configuration",
        guide_win_desc: "Tutorial for configuring Claude Code and Codex CLI on Windows.",
        guide_mac_title: "macOS Configuration",
        guide_mac_desc: "Tutorial for configuring Claude Code and Codex CLI on macOS.",
        guide_linux_title: "Linux Configuration",
        guide_linux_desc: "Tutorial for configuring Claude Code and Codex CLI on Linux.",
        guide_common_title: "Common Configuration",
        guide_env_vars: "Supported Environment Variables",
        guide_table_tool: "Tool",
        guide_table_env: "Env Variable",
        guide_table_desc: "Description",
        guide_tip_security: "Security Notice",
        guide_security_1: "Do not commit API keys to public repos",
        guide_security_2: "Rotate your API keys regularly",
        guide_security_3: "Use environment variables instead of hardcoding",
        guide_security_4: "Clear env vars after using shared devices",
        btn_copy: "Copy",
        btn_copied_text: "Copied",

        // Guide Content Headers & Steps
        guide_step_env: "I. Environment Prep",
        guide_step_claude: "II. Configure Claude Code",
        guide_step_codex: "III. Configure Codex CLI",
        guide_step_verify: "IV. Verify Configuration",
        guide_step_troubleshoot: "IV. Troubleshooting",

        // Detailed Steps (New)
        guide_step_1_node: "1. Install Node.js",
        guide_step_1_homebrew: "1. Install Homebrew (if missing)",
        guide_step_2_node: "2. Install Node.js",
        guide_step_2_cli: "2. Install Claude Code CLI",
        guide_step_3_cli: "3. Install Claude Code & Codex CLI",
        guide_step_3_codex: "3. Install Codex CLI",

        guide_desc_node_check: "Ensure Node.js is installed (v18+ recommended):",
        guide_desc_node_source: "Install latest Node.js via NodeSource:",
        guide_desc_mac_brew: "Install via Homebrew",

        guide_method_1_env: "Method 1: Use Environment Variables",
        guide_method_2_perm: "Method 2: Permanent Configuration",
        guide_method_1_temp: "Method 1: Temporary (Session only)",
        guide_method_2_perm_rec: "Method 2: Permanent (Recommended)",
        guide_method_3_systemd: "Method 3: Systemd User Service (Desktop)",

        guide_text_open_ps: "Open PowerShell or Command Prompt:",
        guide_text_edit_profile: "Edit your shell profile:",
        guide_text_append: "Append the following:",
        guide_text_save_apply: "Save and reload configuration:",
        guide_tip_persist: "Tip: Add to permanent config to avoid resetting on reboot.",

        // Windows Specific Steps
        guide_win_step_1: "Right-click 'This PC' → 'Properties' → 'Advanced system settings'",
        guide_win_step_2: "Click 'Environment Variables'",
        guide_win_step_3: "Click 'New' under 'User variables'",
        guide_win_step_4: "Add the following variables:",
        guide_win_step_5: "Click 'OK' to save, restart terminal to take effect",
        guide_var_name: "Variable Name",
        guide_var_value: "Variable Value",

        // Code Comments & Tips
        code_comment_check_node: "# Check Node.js version",
        code_comment_install_node_missing: "# If missing, download from: https://nodejs.org/",
        code_comment_npm_global: "# Install globally via npm",
        code_comment_anthropic_base_long: "# Set API Base URL (your proxy address)",
        code_comment_anthropic_key_long: "# Set API Key (your key)",
        code_comment_start_claude: "# Start Claude Code",
        code_comment_openai_base: "# Set OpenAI API Base URL",
        code_comment_openai_key: "# Set API Key",
        code_comment_start_codex: "# Start Codex",
        code_comment_test_claude: "# Test Claude Code",
        code_comment_test_codex: "# Test Codex",
        code_comment_install_claude: "# Install Claude Code",
        code_comment_install_codex: "# Install Codex",
        code_comment_set_api_base: "# Set API Base URL",
        code_comment_set_api_key: "# Set API Key",
        code_comment_claude_config: "# Claude Code API Config",
        code_comment_codex_config: "# Codex API Config",
        code_comment_reload_config: "# Reload configuration",
        code_comment_check_env: "# Check if env vars are set",
        code_comment_set_env_launch: "# Set env vars and start",
        code_comment_use_editor: "# Use your preferred editor",
        code_comment_or: "# OR",
        code_comment_api_config_header: "# ===== API Config =====",
        code_comment_create_env_file: "# Create/Edit env file",
        code_comment_verify_env: "# Verify environment variables",
        guide_nvm_tip: "<strong>Tip:</strong> If you face permission issues, consider using nvm (Node Version Manager) to avoid using sudo for global packages.",
        code_comment_check_network: "# Check network connection",
        code_comment_check_dns: "# Check DNS resolution",
        code_comment_use_proxy: "# If using a proxy",
        code_comment_verify_install: "# Verify installation",
        guide_desc_api_base: "API Base URL",
        guide_desc_api_key: "API Key",
        code_comment_mac_zsh: "# If using zsh (macOS default)",
        code_comment_mac_bash: "# If using bash",
        guide_note_label: "Note:"
    }
};

/**
 * Parses headers to determine the locale. Priority: Cookie > Accept-Language.
 * @param {string|null} acceptLanguage - The Accept-Language header value.
 * @param {string|null} cookieHeader - The Cookie header value.
 * @returns {string} 'zh' or 'en'
 */
export function getLocale(acceptLanguage, cookieHeader) {
    // 1. Check Cookie
    if (cookieHeader) {
        if (cookieHeader.includes('locale=zh')) return 'zh';
        if (cookieHeader.includes('locale=en')) return 'en';
    }

    // 2. Check Accept-Language
    if (!acceptLanguage) return 'en';
    if (acceptLanguage.toLowerCase().includes('zh')) {
        return 'zh';
    }
    return 'en';
}

/**
 * Returns the translation for the given key and locale.
 * @param {string} locale - 'zh' or 'en'
 * @param {string} key - The translation key.
 * @param {object} [vars] - Variables to replace in the string (e.g., {name: 'John'}).
 * @returns {string} The translated string or the key if not found.
 */
export function t(locale, key, vars = {}) {
    const dict = translations[locale] || translations['en'];
    let text = dict[key] || key;

    // Simple variable replacement {varName}
    for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }

    return text;
}
