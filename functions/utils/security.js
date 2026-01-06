/**
 * 安全响应头配置
 * 用于统一管理所有页面的安全 HTTP 响应头
 */

/**
 * 获取标准的安全响应头
 * @returns {Object} 包含安全响应头的对象
 */
export function getSecurityHeaders() {
  return {
    'Content-Type': 'text/html;charset=UTF-8',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // 当前需要 inline script
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

/**
 * 获取 JSON API 的安全响应头
 * @returns {Object} 包含 API 安全响应头的对象
 */
export function getApiSecurityHeaders() {
  return {
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Content-Type-Options': 'nosniff'
  };
}
