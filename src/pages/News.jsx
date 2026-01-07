import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, Spin, Empty } from 'antd';
import { Newspaper, TrendingUp, Calendar, ExternalLink, Sparkles, Zap } from 'lucide-react';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import './News.less';

const News = () => {
  const { t, locale } = useI18n();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getSourceColor = (source) => {
    const colorMap = {
      'TechCrunch': '#0bba26',
      '36Kr': '#ff6b35',
      'default': '#5b8def'
    };
    return colorMap[source] || colorMap['default'];
  };

  return (
    <div className="news-page">
      <Header />

      {/* Hero Section */}
      <section className="news-hero">
        <div className="news-hero-content">
          <div className="news-hero-icon">
            <Newspaper size={56} color="#5b8def" strokeWidth={1.5} />
          </div>
          <h1>
            <Sparkles size={36} color="#ffa502" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            {locale === 'zh' ? 'AI 前沿资讯' : 'AI News & Insights'}
          </h1>
          <p className="news-hero-subtitle">
            <TrendingUp size={20} color="#52c41a" strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {locale === 'zh'
              ? '汇聚全球 AI 行业动态，紧跟技术前沿'
              : 'Global AI industry updates and cutting-edge technology trends'}
          </p>
        </div>
      </section>

      {/* News List */}
      <section className="news-list">
        <div className="news-container">
          <div className="news-stats">
            <div className="stat-item">
              <TrendingUp size={20} color="#52c41a" strokeWidth={2} />
              <span>
                {locale === 'zh' ? `${news.length} 条热门资讯` : `${news.length} Trending Stories`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" tip={locale === 'zh' ? '加载中...' : 'Loading...'} />
            </div>
          ) : news.length === 0 ? (
            <Empty
              description={locale === 'zh' ? '暂无新闻' : 'No news available'}
              style={{ marginTop: 60 }}
            />
          ) : (
            <Row gutter={[24, 24]}>
              {news.map((item, index) => (
                <Col key={item.id || index} xs={24} md={12} lg={8}>
                  <Card
                    className="news-card"
                    bordered={false}
                    hoverable
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <div className="news-card-header">
                      <Tag
                        color={getSourceColor(item.source)}
                        className="source-tag"
                        icon={<Zap size={14} />}
                      >
                        {item.source}
                      </Tag>
                      <div className="news-date">
                        <Calendar size={14} color="#999" />
                        <span>{formatDate(item.published_at)}</span>
                      </div>
                    </div>

                    <h3 className="news-title">{item.title}</h3>
                    <p className="news-summary">{item.summary}</p>

                    <div className="news-footer">
                      <span className="read-more">
                        {locale === 'zh' ? '阅读全文' : 'Read More'}
                        <ExternalLink size={14} strokeWidth={2} />
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>
    </div>
  );
};

export default News;
