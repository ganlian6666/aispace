import React, { createContext, useContext, useState, useEffect } from 'react';

// 翻译数据 - 从原 functions/utils/i18n.js 迁移
const translations = {
  zh: {
    // Shared
    brand_name: "自由空间",
    brand_subtitle: "自由AI空间·开放分享平台",
    nav_home: "API中转汇聚",
    nav_news: "AI 前沿动态",
    nav_vpn: "VPN",
    nav_guide: "配置指南",
    github_text: "GitHub",

    // Home
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

    // News
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

    // VPN
    vpn_page_title: "VPN推荐 · 自由空间",
    vpn_hero_title: "VPN 推荐 · 精选服务",
    vpn_hero_desc: "经过严格测试和用户反馈筛选的优质VPN服务，提供稳定快速的全球网络访问体验。",

    // Guide
    guide_page_title: "配置指南 · 自由空间",
    guide_hero_title: "API 配置指南",
    guide_hero_desc: "全面的 Claude Code 和 Codex CLI 配置教程，帮助你快速接入第三方 API 中转服务。",
  },

  en: {
    // Shared
    brand_name: "Free Space",
    brand_subtitle: "AI Service Hub · Open Sharing Platform",
    nav_home: "API Gateway",
    nav_news: "AI News",
    nav_vpn: "VPN",
    nav_guide: "Guide",
    github_text: "GitHub",

    // Home
    home_title: "API Gateway · Free Space",
    hero_title: "Premium API Endpoints Collection",
    hero_subtitle: "Every API is manually tested. Supports Claude Code, Codex, and premium Chinese AI models!",
    submit_hint: "Welcome to share reliable API endpoints!",
    btn_submit: "Submit",
    status_checking: "Checking",
    btn_invite_copy: "Copy Invite Link",
    btn_copied: "Copied!",
    text_last_checked: "Last Checked",
    text_never_checked: "Never Checked",
    comment_placeholder: "Type a comment...",
    btn_send: "Send",
    nickname_current: "Current Nickname",
    btn_modify: "[Edit]",
    modal_submit_title: "Submit New Endpoint",
    modal_submit_desc: "Share your API endpoint. It will be reviewed and approved before being listed!",
    label_name: "Name *",
    placeholder_name: "e.g., OpenAI Official API",
    label_url: "URL *",
    placeholder_url: "e.g., https://chatgpt.com/",
    label_invite: "Invite Link",
    placeholder_invite: "e.g., https://chatgpt.com/invite?code=abc",
    label_desc: "Description",
    placeholder_desc: "Brief introduction...",
    btn_feedback: "Feedback",
    btn_cancel: "Cancel",
    btn_submit_confirm: "Submit",
    modal_feedback_title: "Feedback",
    modal_feedback_desc: "Bug reports and feature suggestions are welcome!",
    label_feedback_content: "Content *",
    placeholder_feedback_content: "Describe your suggestion or issue...",
    label_contact: "Contact (Optional)",
    placeholder_contact: "Email or WeChat ID",
    btn_send_feedback: "Send",
    modal_nickname_title: "Set Nickname",
    modal_nickname_desc: "Set a nickname to post comments. It will be saved automatically.",
    label_nickname: "Nickname *",
    placeholder_nickname: "e.g., Anonymous",
    btn_anonymous: "Anonymous",
    btn_save: "Save",
    alert_submit_success: "Submitted successfully! Thank you for sharing.",
    alert_submit_fail: "Failed to submit",
    alert_network_error: "Network error, please try again later",
    alert_feedback_success: "Thank you for your feedback!",
    alert_like_limit: "You've liked too many times today!",
    alert_comment_limit: "You've commented too much today!",
    alert_nickname_required: "Please enter a nickname",
    loading: "Loading...",
    no_comments: "No comments yet. Be the first!",

    // News
    news_page_title: "AI News · Free Space",
    news_header: "AI News",
    news_subtitle: "Latest AI news from TechCrunch and 36Kr, translated in real-time.",
    btn_refresh_news: "Refresh",
    btn_refreshing: "Fetching...",
    btn_read_more: "Read More",
    btn_load_more: "Load Earlier News",
    text_no_news: "No news yet. Click refresh to fetch latest updates.",
    alert_update_success: "Success! Fetched {fetched}, added {inserted}.",
    alert_rate_limit: "Refreshing too frequently, please try again later.",

    // VPN
    vpn_page_title: "VPN Recommendations · Free Space",
    vpn_hero_title: "VPN · Premium Services",
    vpn_hero_desc: "Carefully tested VPN services for stable and fast global network access.",

    // Guide
    guide_page_title: "Configuration Guide · Free Space",
    guide_hero_title: "API Configuration Guide",
    guide_hero_desc: "Complete guide for Claude Code and Codex CLI with third-party API endpoints.",
  },
};

const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    // 优先从 Cookie 读取
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1];

    if (cookieLocale === 'zh' || cookieLocale === 'en') {
      return cookieLocale;
    }

    // 从浏览器语言检测
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('zh') ? 'zh' : 'en';
  });

  const t = (key, vars = {}) => {
    let text = translations[locale][key] || key;
    // 支持变量替换 {variable}
    Object.keys(vars).forEach(varKey => {
      text = text.replace(new RegExp(`\\{${varKey}\\}`, 'g'), vars[varKey]);
    });
    return text;
  };

  const switchLanguage = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    setLocale(newLocale);
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    // 更新 HTML lang 属性
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, switchLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
