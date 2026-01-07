import React from 'react';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import './CommonPage.less';

const Guide = () => {
  const { t } = useI18n();

  return (
    <div className="common-page">
      <Header />
      <div className="page-content">
        <h1>{t('nav_guide')}</h1>
        <p>配置指南页面开发中...</p>
      </div>
    </div>
  );
};

export default Guide;
