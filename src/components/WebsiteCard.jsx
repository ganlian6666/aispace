import React, { useState } from 'react';
import { Card, Button, message } from 'antd';
import { Heart, MessageCircle, Copy, Check } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import './WebsiteCard.less';

const WebsiteCard = ({ website, onLike, onToggleComments, showComments }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(website.invite_link || website.display_url);
      setCopied(true);
      message.success(t('btn_copied'));
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = website.invite_link || website.display_url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const getStatusColor = () => {
    return website.status === 'online' ? 'success' : 'error';
  };

  const getStatusText = () => {
    if (website.status === 'online') {
      return (
        <>
          <div>在线</div>
          {website.latency && <div className="latency">{website.latency}ms</div>}
        </>
      );
    }
    return <div>维护中</div>;
  };

  return (
    <Card className="website-card" hoverable>
      <div className="card-head">
        <h3>{website.name}</h3>
        <div className={`status status-${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <p className="card-description">{website.description}</p>

      <div className="link-block">
        <a href={website.invite_link || website.display_url} target="_blank" rel="noopener noreferrer">
          {website.display_url}
        </a>
        <Button
          type="default"
          size="small"
          icon={copied ? <Check size={14} /> : <Copy size={14} />}
          onClick={handleCopyLink}
          className={copied ? 'copied' : ''}
        >
          {copied ? t('btn_copied') : t('btn_invite_copy')}
        </Button>
      </div>

      <div className="card-footer">
        <div className="card-actions">
          <Button
            type="text"
            size="small"
            icon={<Heart size={16} className="icon-heart" />}
            onClick={() => onLike(website.id)}
            className="action-btn like-btn"
          >
            <span className="like-count">{website.likes || 0}</span>
          </Button>

          <Button
            type="text"
            size="small"
            icon={<MessageCircle size={16} className="icon-comment" />}
            onClick={() => onToggleComments(website.id)}
            className="action-btn comment-btn"
          >
            <span className="comment-count">{website.comments || 0}</span>
          </Button>
        </div>

        <div className="last-checked">
          {t('text_last_checked')} {website.formatted_date || t('text_never_checked')}
        </div>
      </div>
    </Card>
  );
};

export default WebsiteCard;
