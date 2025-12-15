import { getLocale, t } from './utils/i18n.js';

export async function onRequestGet(context) {
  const { request } = context;
  const cookie = request.headers.get('Cookie');
  const locale = getLocale(request.headers.get('Accept-Language'), cookie);
  const T = (key, vars) => t(locale, key, vars);

  const nextLang = locale === 'zh' ? 'en' : 'zh';

  const html = \`<!DOCTYPE html>
<html lang="\${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${T('vpn_page_title')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="/vpn.css">
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="url(#grad1)"
            d="M12 8l24 32H12z"
            opacity="0.9"
          ></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff9a4d"></stop>
              <stop offset="100%" stop-color="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>\${T('brand_name')}</strong>
          <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
            \${T('brand_subtitle')}
          </p>
        </div>
      </div>
      <nav>
        <a href="/">\${T('nav_home')}</a>
        <a href="/news">\${T('nav_news')}</a>
        <a href="/vpn" class="active">\${T('nav_vpn')}</a>
        <a href="/guide">\${T('nav_guide')}</a>
      </nav>
      <div class="actions" style="display:flex; gap:16px; align-items:center;">
        <button onclick="switchLanguage('\${nextLang}')" style="background:none; border:1px solid var(--text-muted); color:var(--text-main); padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">
            \${T('btn_lang_switch')}
        </button>
        <div class="github-link">
            <a href="https://github.com/ganlian6666/aispace" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>\${T('github_text')}</span>
            </a>
        </div>
      </div>
    </header>

    <section class="hero">
      <div>
        <h1>\${T('vpn_hero_title')}</h1>
        <p>\${T('vpn_hero_desc')}</p>
      </div>
    </section>

    <div class="vpn-grid">
      <!-- VPN Card 1 -->
      <article class="vpn-card">
        <div class="top-badge">\${T('vpn_top_1')}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">飞鸟云</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.8</span>
            </div>
            <span class="badge speed">\${T('tag_speed')}</span>
            <span class="badge stable">\${T('tag_stable')}</span>
          </div>
          <div class="vpn-price">
            1RMB<small>\${T('price_suffix')}</small>
          </div>
          <p class="vpn-desc">极致性价比，支持支付宝，稳定快速的VPN服务。</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">极致性价比</span>
            <span class="feature-tag">稳定合中国用户</span>
          </div>
          <div class="core-features">
            <h4>\${T('section_features')}</h4>
            <ul class="feature-list">
              <li>地区：台湾日本新加坡香港美国</li>
              <li>请知悉无退款服务</li>
              <li>不限网速，不限设备数量</li>
              <li>支持最新Hysteria2协议</li>
              <li>需要自己配置，记得读一下使用文档</li>
              <li>可访问ChatGPT，Google和Netflix</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>\${T('section_payment')}</h5>
            <div class="method-tags">
              <span class="method-tag">支付宝</span>
              <span class="method-tag">信用卡</span>
              <span class="method-tag">微信</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">推荐</span>
            <span class="quality-tag">支付宝</span>
            <span class="quality-tag">中国优化</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://feiniaoyun11.life/#/register?code=2J2dfAIx" target="_blank" class="visit-btn">
            \${T('btn_visit')}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>

      <!-- VPN Card 2 -->
      <article class="vpn-card">
        <div class="top-badge silver">\${T('vpn_top_2')}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">流量光</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.7</span>
            </div>
            <span class="badge speed">\${T('tag_speed')}</span>
            <span class="badge stable">\${T('tag_stable')}</span>
          </div>
          <div class="vpn-price">
            9.90RMB<small>\${T('price_suffix')}</small>
          </div>
          <p class="vpn-desc">注重隐私保护的高端VPN服务，在中国表现稳定。</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">极致隐私保护</span>
            <span class="feature-tag">流媒体解锁</span>
          </div>
          <div class="core-features">
            <h4>\${T('section_features')}</h4>
            <ul class="feature-list">
              <li>不限制设备数,不限速</li>
              <li>最高倍率: ×1（直连节点0倍率）</li>
              <li>高优先级BGP专线, 港日新台专线互联</li>
              <li>提供优秀的流媒体解锁与 ChatGPT 解锁</li>
              <li>国家/地区: 香港, 台湾, 日本, 美国, 新加坡, 韩国</li>
              <li>冷门国家/地区IP: 美国, 加拿大, 南极洲</li>
              <li>通知频道群与工单售后保障</li>
              <li>特殊商品, 无任何退款政策, 谨慎下单</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>\${T('section_payment')}</h5>
            <div class="method-tags">
              <span class="method-tag">信用卡</span>
              <span class="method-tag">支付宝</span>
              <span class="method-tag">微信</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">高端私密</span>
            <span class="quality-tag">稳定</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://llg01.com/#/register?code=vuLu4sOe" target="_blank" class="visit-btn">
            \${T('btn_visit')}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>

      <!-- VPN Card 3 -->
      <article class="vpn-card">
        <div class="top-badge">\${T('vpn_top_3')}</div>
        <div class="vpn-header">
          <h2 class="vpn-name">樱花猫</h2>
          <div class="vpn-meta">
            <div class="rating">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>4.9</span>
            </div>
            <span class="badge speed">\${T('tag_speed')}</span>
            <span class="badge stable">\${T('tag_stable')}</span>
          </div>
          <div class="vpn-price">
            3.8RMB<small>\${T('price_suffix')}</small>
          </div>
          <p class="vpn-desc">全球知名的顶级VPN服务，速度快，稳定性强。</p>
        </div>
        <div class="vpn-body">
          <div class="feature-tags">
            <span class="feature-tag">业界标杆</span>
            <span class="feature-tag">超快速度</span>
          </div>
          <div class="core-features">
            <h4>\${T('section_features')}</h4>
            <ul class="feature-list">
              <li>灵活套餐：支持月付、季付、半年付、年付等多种周期</li>
              <li>客服保障：Telegram在线客服和工单系统支持</li>
              <li>多端支持：多客户端导入和二维码订阅功能</li>
              <li>邀请返利：完善的邀请返利和佣金管理系统</li>
              <li>注意事项：不支持新疆地区，购买后无法退款，流量不可叠加</li>
            </ul>
          </div>
          <div class="payment-methods">
            <h5>\${T('section_payment')}</h5>
            <div class="method-tags">
              <span class="method-tag">信用卡</span>
              <span class="method-tag">支付宝</span>
              <span class="method-tag">微信</span>
            </div>
          </div>
          <div class="quality-tags">
            <span class="quality-tag">顶级</span>
            <span class="quality-tag">高速</span>
            <span class="quality-tag">推荐</span>
          </div>
        </div>
        <div class="vpn-footer">
          <a href="https://sakura-cat3.com/register?code=3X1mwrVL" target="_blank" class="visit-btn">
            \${T('btn_visit')}
            <svg viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z"/>
            </svg>
          </a>
        </div>
      </article>
    </div>
  </div>
  <script>
    function switchLanguage(lang) {
        document.cookie = "lang=" + lang + ";path=/;max-age=31536000";
        window.location.reload();
    }
  </script>
</body>
</html>\`;

    return new Response(html, {
        headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
}
