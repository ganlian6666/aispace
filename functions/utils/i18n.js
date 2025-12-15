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

        // Guide Content Headers
        guide_step_env: "一、环境准备",
        guide_step_claude: "二、配置 Claude Code 使用第三方 API",
        guide_step_codex: "三、配置 Codex CLI 使用第三方 API",
        guide_step_verify: "四、验证配置",
        guide_step_troubleshoot: "四、常见问题排查"
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

        // Guide Content Headers
        guide_step_env: "I. Environment Prep",
        guide_step_claude: "II. Configure Claude Code",
        guide_step_codex: "III. Configure Codex CLI",
        guide_step_verify: "IV. Verify Configuration",
        guide_step_troubleshoot: "IV. Troubleshooting"
    }
};

/**
 * Parses the Accept-Language header and returns the matched locale (zh or en).
 * @param {string|null} header - The Accept-Language header value.
 * @returns {string} 'zh' or 'en'
 */
export function getLocale(header) {
    if (!header) return 'en';
    // Simple check: if the header contains 'zh', return 'zh', else 'en'
    // More complex parsing can be added if needed, but this suffices for zh/en split.
    if (header.toLowerCase().includes('zh')) {
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
        text = text.replace(new RegExp(\`{\${k}}\`, 'g'), v);
  }
  
  return text;
}
