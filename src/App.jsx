import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { I18nProvider } from './contexts/I18nContext';
import Home from './pages/Home';
import News from './pages/News';
import VPN from './pages/VPN';
import Guide from './pages/Guide';

// 配置全局 message 样式和图标
message.config({
  top: 80,
  duration: 3,
  maxCount: 3,
});

// 自定义 message 图标
const customMessage = {
  success: (content) => {
    message.success({
      content,
      icon: <CheckCircle2 size={18} color="#52c41a" strokeWidth={2} />
    });
  },
  error: (content) => {
    message.error({
      content,
      icon: <XCircle size={18} color="#ff4d4f" strokeWidth={2} />
    });
  },
  warning: (content) => {
    message.warning({
      content,
      icon: <AlertCircle size={18} color="#faad14" strokeWidth={2} />
    });
  },
  info: (content) => {
    message.info({
      content,
      icon: <Info size={18} color="#1890ff" strokeWidth={2} />
    });
  }
};

// 导出自定义 message
export { customMessage };

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5b8def',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        },
        components: {
          Message: {
            contentBg: '#ffffff',
            contentPadding: '12px 20px',
          }
        }
      }}
    >
      <I18nProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/vpn" element={<VPN />} />
          <Route path="/guide" element={<Guide />} />
        </Routes>
      </I18nProvider>
    </ConfigProvider>
  );
}

export default App;
