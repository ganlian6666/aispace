import React from 'react';
import { Row, Col, Card, Button, Tag } from 'antd';
import { Shield, Zap, Globe2, Lock, Star, Wifi, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import './VPN.less';

const VPN = () => {
  const { t, locale } = useI18n();

  const vpnProviders = [
    {
      id: 1,
      name: 'ExpressVPN',
      rating: 4.9,
      price: '$12.95/月',
      features: ['3000+ 服务器', '94 个国家', '无限带宽', '7x24 客服'],
      featuresEn: ['3000+ Servers', '94 Countries', 'Unlimited Bandwidth', '24/7 Support'],
      highlight: '最佳速度',
      highlightEn: 'Best Speed',
      color: '#ff4757',
      link: 'https://www.expressvpn.com'
    },
    {
      id: 2,
      name: 'NordVPN',
      rating: 4.8,
      price: '$11.99/月',
      features: ['5500+ 服务器', '60 个国家', '双重加密', '威胁防护'],
      featuresEn: ['5500+ Servers', '60 Countries', 'Double Encryption', 'Threat Protection'],
      highlight: '最高安全',
      highlightEn: 'Top Security',
      color: '#5b8def',
      link: 'https://www.nordvpn.com'
    },
    {
      id: 3,
      name: 'Surfshark',
      rating: 4.7,
      price: '$12.95/月',
      features: ['3200+ 服务器', '100 个国家', '无限设备', 'CleanWeb'],
      featuresEn: ['3200+ Servers', '100 Countries', 'Unlimited Devices', 'CleanWeb'],
      highlight: '性价比高',
      highlightEn: 'Best Value',
      color: '#48dbfb',
      link: 'https://www.surfshark.com'
    },
    {
      id: 4,
      name: 'CyberGhost',
      rating: 4.6,
      price: '$12.99/月',
      features: ['9000+ 服务器', '91 个国家', '专用流媒体', '无日志政策'],
      featuresEn: ['9000+ Servers', '91 Countries', 'Streaming Optimized', 'No-Logs Policy'],
      highlight: '流媒体优化',
      highlightEn: 'Streaming Pro',
      color: '#ffa502',
      link: 'https://www.cyberghostvpn.com'
    }
  ];

  const benefits = [
    {
      icon: Shield,
      color: '#5b8def',
      title: '隐私保护',
      titleEn: 'Privacy Protection',
      desc: '军用级加密，保护您的在线隐私',
      descEn: 'Military-grade encryption to protect your online privacy'
    },
    {
      icon: Zap,
      color: '#ffa502',
      title: '极速连接',
      titleEn: 'Lightning Fast',
      desc: '全球高速服务器，无延迟体验',
      descEn: 'Global high-speed servers for seamless experience'
    },
    {
      icon: Globe2,
      color: '#48dbfb',
      title: '解锁内容',
      titleEn: 'Unlock Content',
      desc: '访问全球受限网站和流媒体',
      descEn: 'Access geo-restricted websites and streaming'
    },
    {
      icon: Lock,
      color: '#ff4757',
      title: '安全防护',
      titleEn: 'Secure Connection',
      desc: '公共WiFi安全，防止数据泄露',
      descEn: 'Safe on public WiFi, prevent data leaks'
    }
  ];

  return (
    <div className="vpn-page">
      <Header />

      {/* Hero Section */}
      <section className="vpn-hero">
        <div className="vpn-hero-content">
          <div className="vpn-hero-icon">
            <Shield size={56} color="#5b8def" strokeWidth={1.5} />
          </div>
          <h1>
            <Shield size={36} color="#5b8def" strokeWidth={2.5} style={{ marginRight: '12px' }} />
            {locale === 'zh' ? '精选 VPN 服务推荐' : 'Premium VPN Services'}
          </h1>
          <p className="vpn-hero-subtitle">
            <Lock size={20} color="#52c41a" strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {locale === 'zh'
              ? '保护您的隐私，畅享全球网络自由'
              : 'Protect your privacy and enjoy global internet freedom'}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="vpn-benefits">
        <h2 className="section-title">
          <Sparkles size={28} color="#ffa502" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {locale === 'zh' ? '为什么需要 VPN？' : 'Why Use VPN?'}
        </h2>
        <Row gutter={[24, 24]}>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card className="benefit-card" bordered={false} hoverable>
                  <div className="benefit-icon" style={{ backgroundColor: `${benefit.color}15` }}>
                    <Icon size={36} color={benefit.color} strokeWidth={2} />
                  </div>
                  <h3>{locale === 'zh' ? benefit.title : benefit.titleEn}</h3>
                  <p>{locale === 'zh' ? benefit.desc : benefit.descEn}</p>
                </Card>
              </Col>
            );
          })}
        </Row>
      </section>

      {/* VPN Providers Section */}
      <section className="vpn-providers">
        <h2 className="section-title">
          <Zap size={28} color="#48dbfb" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
          {locale === 'zh' ? '热门 VPN 服务商' : 'Popular VPN Providers'}
        </h2>
        <Row gutter={[32, 32]}>
          {vpnProviders.map((vpn) => (
            <Col key={vpn.id} xs={24} sm={24} md={12} lg={12} xl={12}>
              <Card className="vpn-card" bordered={false} hoverable>
                <div className="vpn-card-header">
                  <div className="vpn-name">
                    <div className="vpn-icon-wrapper" style={{ background: `linear-gradient(135deg, ${vpn.color}20, ${vpn.color}10)` }}>
                      <Wifi size={28} color={vpn.color} strokeWidth={2.5} />
                    </div>
                    <h3>{vpn.name}</h3>
                  </div>
                  <Tag color={vpn.color} className="vpn-highlight">
                    <Star size={14} fill={vpn.color} strokeWidth={2} style={{ marginRight: '4px' }} />
                    {locale === 'zh' ? vpn.highlight : vpn.highlightEn}
                  </Tag>
                </div>

                <div className="vpn-rating">
                  <div className="rating-stars">
                    <Star size={20} color="#ffa502" fill="#ffa502" strokeWidth={2} />
                    <span className="rating-value">{vpn.rating}</span>
                  </div>
                  <span className="rating-text">
                    {locale === 'zh' ? '用户评分' : 'User Rating'}
                  </span>
                </div>

                <div className="vpn-price">
                  <span className="price-label">
                    <Globe2 size={16} color="#999" strokeWidth={2} style={{ marginRight: '6px' }} />
                    {locale === 'zh' ? '起步价格' : 'Starting at'}
                  </span>
                  <span className="price-value">{vpn.price}</span>
                </div>

                <div className="vpn-features">
                  {(locale === 'zh' ? vpn.features : vpn.featuresEn).map((feature, idx) => (
                    <div key={idx} className="feature-item">
                      <CheckCircle2 size={18} color="#52c41a" strokeWidth={2.5} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  className="vpn-btn"
                  style={{
                    background: `linear-gradient(135deg, ${vpn.color}, ${vpn.color}dd)`,
                    borderColor: vpn.color,
                    boxShadow: `0 4px 12px ${vpn.color}40`
                  }}
                  onClick={() => window.open(vpn.link, '_blank')}
                >
                  {locale === 'zh' ? '立即访问' : 'Visit Now'}
                  <ChevronRight size={20} strokeWidth={2.5} />
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Disclaimer */}
      <section className="vpn-disclaimer">
        <p>
          {locale === 'zh'
            ? '* 以上价格仅供参考，具体以官网为准。请遵守当地法律法规使用 VPN 服务。'
            : '* Prices are for reference only. Please check official websites for details and comply with local laws.'}
        </p>
      </section>
    </div>
  );
};

export default VPN;
