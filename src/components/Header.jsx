import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, Globe } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import './Header.less';

const Header = () => {
  const { t, locale, switchLanguage } = useI18n();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="brand">
        <svg viewBox="0 0 48 48" aria-hidden="true" className="brand-logo">
          <path fill="url(#grad1)" d="M12 8l24 32H12z" opacity="0.9"></path>
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9a4d"></stop>
              <stop offset="100%" stopColor="#f552ff"></stop>
            </linearGradient>
          </defs>
        </svg>
        <div>
          <strong>{t('brand_name')}</strong>
          <p className="brand-subtitle">{t('brand_subtitle')}</p>
        </div>
      </div>

      <nav className="main-nav">
        <Link to="/" className={isActive('/') ? 'active' : ''}>
          {t('nav_home')}
        </Link>
        <Link to="/news" className={isActive('/news') ? 'active' : ''}>
          {t('nav_news')}
        </Link>
        <Link to="/vpn" className={isActive('/vpn') ? 'active' : ''}>
          {t('nav_vpn')}
        </Link>
        <Link to="/guide" className={isActive('/guide') ? 'active' : ''}>
          {t('nav_guide')}
        </Link>
      </nav>

      <div className="header-actions">
        <a
          href="https://github.com/ganlian6666/aispace"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <Github size={18} strokeWidth={2} />
          <span>{t('github_text')}</span>
        </a>

        <button className="lang-btn" onClick={switchLanguage}>
          <Globe size={16} strokeWidth={2} />
          {locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>
    </header>
  );
};

export default Header;
