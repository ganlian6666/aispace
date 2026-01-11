import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/index.less';

// Ant Design 主题配置
const theme = {
  token: {
    colorPrimary: '#5b8def',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorText: '#333333',
    colorTextSecondary: '#666666',
    colorBorder: '#e8e8e8',
    fontSize: 14,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Button: {
      controlHeight: 36,
      borderRadiusLG: 8,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Message: {
      contentBg: '#ffffff',
      contentPadding: '14px 20px',
      fontSize: 15,
    },
    Notification: {
      borderRadiusLG: 12,
    }
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme} locale={zhCN}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
