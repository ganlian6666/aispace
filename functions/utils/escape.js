/**
 * XSS 防护工具模块
 * 用于在输出阶段对用户可控数据进行安全转义
 */

/**
 * HTML 实体转义 - 防止 XSS
 * @param {string|null|undefined} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * URL 属性转义 - 防止 javascript: 协议注入
 * @param {string|null|undefined} url - 需要转义的 URL
 * @returns {string} 安全的 URL 字符串
 */
export function escapeUrl(url) {
  if (!url) return '';
  const str = String(url).trim();
  // 阻止 javascript:, data:, vbscript: 等危险协议
  if (/^(javascript|data|vbscript):/i.test(str)) return '#';
  return escapeHtml(str);
}

/**
 * 生成内联的转义函数代码，用于嵌入到客户端 JS 中
 * @returns {string} 客户端可用的转义函数代码
 */
export function getClientEscapeScript() {
  return `
    function escapeHtml(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    function escapeUrl(url) {
      if (!url) return '';
      var str = String(url).trim();
      if (/^(javascript|data|vbscript):/i.test(str)) return '#';
      return escapeHtml(str);
    }
  `;
}
