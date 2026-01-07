import React from 'react';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import './CommonPage.less';

const News = () => {
  const { t } = useI18n();

  return (
    <div className="common-page">
      <Header />
      <div className="page-content">
        <h1>{t('nav_news')}</h1>
        <p>新闻页面开发中...</p>
      </div>
    </div>
  );
};

export default News;
