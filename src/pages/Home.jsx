import React, { useState, useEffect } from 'react';
import { Row, Col, Spin, Button, Modal, Form, Input } from 'antd';
import { Plus, Sparkles, Zap, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import WebsiteCard from '@/components/WebsiteCard';
import { useI18n } from '@/contexts/I18nContext';
import { useWebsites, useLike, useSubmit, useFeedback, useStatus } from '@/hooks/useApi';
import { customMessage } from '../App';
import './Home.less';

const { TextArea } = Input;

const Home = () => {
  const { t } = useI18n();
  const { websites, loading, refetch } = useWebsites();
  const { statuses } = useStatus();
  const { toggleLike } = useLike();
  const { submitWebsite, submitting } = useSubmit();
  const { submitFeedback } = useFeedback();

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [submitForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();

  // 合并网站数据和状态数据
  const [enrichedWebsites, setEnrichedWebsites] = useState([]);

  useEffect(() => {
    if (websites.length > 0 && statuses.length > 0) {
      const merged = websites.map(site => {
        const statusData = statuses.find(s => s.card_id === site.id);
        return {
          ...site,
          status: statusData?.status || 'checking',
          latency: statusData?.latency || null,
        };
      });
      setEnrichedWebsites(merged);
    } else {
      setEnrichedWebsites(websites);
    }
  }, [websites, statuses]);

  const handleLike = async (cardId) => {
    try {
      const result = await toggleLike(cardId);
      customMessage.success(t('btn_copied'));
      // 更新本地数据
      setEnrichedWebsites(prev =>
        prev.map(site =>
          site.id === cardId ? { ...site, likes: result.count } : site
        )
      );
    } catch (error) {
      if (error.message === 'like_limit') {
        customMessage.warning(t('alert_like_limit'));
      } else {
        customMessage.error(t('alert_network_error'));
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      await submitWebsite(values);
      customMessage.success(t('alert_submit_success'));
      setSubmitModalOpen(false);
      submitForm.resetFields();
      refetch();
    } catch (error) {
      customMessage.error(t('alert_submit_fail'));
    }
  };

  const handleFeedback = async (values) => {
    try {
      await submitFeedback(values);
      customMessage.success(t('alert_feedback_success'));
      setFeedbackModalOpen(false);
      feedbackForm.resetFields();
    } catch (error) {
      customMessage.error(t('alert_network_error'));
    }
  };

  return (
    <div className="home-page">
      <Header />

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>
              <Sparkles size={36} color="#ffa502" strokeWidth={2.5} style={{ marginRight: '12px' }} />
              {t('hero_title')}
            </h1>
            <p>
              <TrendingUp size={20} color="#52c41a" strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {t('hero_subtitle')}
            </p>
          </div>
          <div className="submit-wrapper">
            <span className="submit-hint">
              <Zap size={18} color="#5b8def" strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              {t('submit_hint')}
            </span>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={20} strokeWidth={2.5} />}
              onClick={() => setSubmitModalOpen(true)}
            >
              {t('btn_submit')}
            </Button>
          </div>
        </div>
      </section>

      <section className="websites-section">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" tip={t('loading')} />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {enrichedWebsites.map(website => (
              <Col key={website.id} xs={24} sm={12} lg={8} xl={6}>
                <WebsiteCard
                  website={website}
                  onLike={handleLike}
                  onToggleComments={(id) => console.log('Toggle comments', id)}
                />
              </Col>
            ))}
          </Row>
        )}
      </section>

      {/* 提交网站 Modal */}
      <Modal
        title={t('modal_submit_title')}
        open={submitModalOpen}
        onCancel={() => setSubmitModalOpen(false)}
        footer={null}
        width={560}
      >
        <p className="modal-desc">{t('modal_submit_desc')}</p>
        <Form
          form={submitForm}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label={t('label_name')}
            rules={[{ required: true, message: t('alert_nickname_required') }]}
          >
            <Input placeholder={t('placeholder_name')} />
          </Form.Item>

          <Form.Item
            name="url"
            label={t('label_url')}
            rules={[
              { required: true, message: t('alert_nickname_required') },
              { type: 'url', message: 'Invalid URL' }
            ]}
          >
            <Input placeholder={t('placeholder_url')} />
          </Form.Item>

          <Form.Item
            name="invite_link"
            label={t('label_invite')}
            rules={[{ type: 'url', message: 'Invalid URL' }]}
          >
            <Input placeholder={t('placeholder_invite')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('label_desc')}
          >
            <TextArea rows={3} placeholder={t('placeholder_desc')} />
          </Form.Item>

          <div className="modal-footer">
            <Button
              type="dashed"
              onClick={() => {
                setSubmitModalOpen(false);
                setFeedbackModalOpen(true);
              }}
            >
              {t('btn_feedback')}
            </Button>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => setSubmitModalOpen(false)}>
                {t('btn_cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t('btn_submit_confirm')}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* 反馈 Modal */}
      <Modal
        title={t('modal_feedback_title')}
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
        footer={null}
        width={560}
      >
        <p className="modal-desc">{t('modal_feedback_desc')}</p>
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleFeedback}
        >
          <Form.Item
            name="content"
            label={t('label_feedback_content')}
            rules={[{ required: true, message: t('alert_nickname_required') }]}
          >
            <TextArea rows={4} placeholder={t('placeholder_feedback_content')} />
          </Form.Item>

          <Form.Item
            name="contact"
            label={t('label_contact')}
          >
            <Input placeholder={t('placeholder_contact')} />
          </Form.Item>

          <div className="modal-footer">
            <Button onClick={() => setFeedbackModalOpen(false)}>
              {t('btn_cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {t('btn_send_feedback')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Home;
