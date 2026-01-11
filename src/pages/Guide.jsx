import React, { useState } from 'react';
import { Card, Steps, Tabs, Tag, Collapse } from 'antd';
import { BookOpen, Code, Terminal, Download, CheckCircle2, AlertCircle, Zap, Laptop, Server, Settings } from 'lucide-react';
import Header from '@/components/Header';
import { useI18n } from '@/contexts/I18nContext';
import './Guide.less';

const { Panel } = Collapse;

const Guide = () => {
  const { locale } = useI18n();
  const [activeTab, setActiveTab] = useState('windows');

  const guideSteps = [
    {
      icon: Download,
      color: '#5b8def',
      title: locale === 'zh' ? '下载客户端' : 'Download Client',
      titleEn: 'Download Client',
      desc: locale === 'zh' ? '从官网下载对应系统版本' : 'Download from official website',
    },
    {
      icon: Settings,
      color: '#ffa502',
      title: locale === 'zh' ? '配置参数' : 'Configure Settings',
      titleEn: 'Configure Settings',
      desc: locale === 'zh' ? '填写服务器地址和密钥' : 'Fill in server address and key',
    },
    {
      icon: Zap,
      color: '#52c41a',
      title: locale === 'zh' ? '连接测试' : 'Test Connection',
      titleEn: 'Test Connection',
      desc: locale === 'zh' ? '验证配置是否正确' : 'Verify configuration',
    },
    {
      icon: CheckCircle2,
      color: '#48dbfb',
      title: locale === 'zh' ? '开始使用' : 'Start Using',
      titleEn: 'Start Using',
      desc: locale === 'zh' ? '享受畅通的网络体验' : 'Enjoy smooth internet',
    }
  ];

  const osGuides = {
    windows: {
      icon: Laptop,
      name: 'Windows',
      color: '#00a4ef',
      steps: [
        {
          title: locale === 'zh' ? '下载 Clash for Windows' : 'Download Clash for Windows',
          content: locale === 'zh'
            ? '访问 GitHub 下载最新版本的 Clash for Windows'
            : 'Visit GitHub to download the latest version of Clash for Windows',
          command: 'https://github.com/Fndroid/clash_for_windows_pkg/releases'
        },
        {
          title: locale === 'zh' ? '安装并运行' : 'Install and Run',
          content: locale === 'zh'
            ? '解压下载的文件，双击运行 Clash for Windows.exe'
            : 'Extract downloaded file and run Clash for Windows.exe',
          command: null
        },
        {
          title: locale === 'zh' ? '导入订阅链接' : 'Import Subscription',
          content: locale === 'zh'
            ? '在 Profiles 页面，粘贴订阅链接后点击 Download'
            : 'In Profiles page, paste subscription link and click Download',
          command: null
        },
        {
          title: locale === 'zh' ? '开启系统代理' : 'Enable System Proxy',
          content: locale === 'zh'
            ? '在 General 页面，打开 System Proxy 开关'
            : 'In General page, turn on System Proxy switch',
          command: null
        }
      ]
    },
    macos: {
      icon: Laptop,
      name: 'macOS',
      color: '#000000',
      steps: [
        {
          title: locale === 'zh' ? '下载 ClashX' : 'Download ClashX',
          content: locale === 'zh'
            ? '访问 GitHub 下载最新版本的 ClashX'
            : 'Visit GitHub to download the latest version of ClashX',
          command: 'https://github.com/yichengchen/clashX/releases'
        },
        {
          title: locale === 'zh' ? '安装并运行' : 'Install and Run',
          content: locale === 'zh'
            ? '打开 DMG 文件，拖拽到 Applications 文件夹'
            : 'Open DMG file and drag to Applications folder',
          command: null
        },
        {
          title: locale === 'zh' ? '配置订阅' : 'Configure Subscription',
          content: locale === 'zh'
            ? '点击菜单栏图标 → 配置 → 托管配置 → 管理 → 添加'
            : 'Click menu bar icon → Config → Remote Config → Manage → Add',
          command: null
        },
        {
          title: locale === 'zh' ? '启动代理' : 'Start Proxy',
          content: locale === 'zh'
            ? '设置为系统代理，选择代理模式（规则或全局）'
            : 'Set as system proxy and select proxy mode (Rule or Global)',
          command: null
        }
      ]
    },
    linux: {
      icon: Terminal,
      name: 'Linux',
      color: '#f7a500',
      steps: [
        {
          title: locale === 'zh' ? '安装 Clash' : 'Install Clash',
          content: locale === 'zh'
            ? '下载 Clash Premium 核心'
            : 'Download Clash Premium core',
          command: 'wget https://github.com/Dreamacro/clash/releases/download/premium/clash-linux-amd64.gz'
        },
        {
          title: locale === 'zh' ? '解压并授权' : 'Extract and Grant Permission',
          content: locale === 'zh'
            ? '解压文件并赋予执行权限'
            : 'Extract file and grant execute permission',
          command: 'gunzip clash-linux-amd64.gz && chmod +x clash-linux-amd64'
        },
        {
          title: locale === 'zh' ? '下载配置文件' : 'Download Config',
          content: locale === 'zh'
            ? '将订阅链接下载为 config.yaml'
            : 'Download subscription as config.yaml',
          command: 'wget -O config.yaml "YOUR_SUBSCRIPTION_URL"'
        },
        {
          title: locale === 'zh' ? '启动 Clash' : 'Start Clash',
          content: locale === 'zh'
            ? '运行 Clash 并指定配置文件'
            : 'Run Clash with config file',
          command: './clash-linux-amd64 -f config.yaml'
        }
      ]
    },
    mobile: {
      icon: Server,
      name: locale === 'zh' ? '移动端' : 'Mobile',
      color: '#52c41a',
      steps: [
        {
          title: locale === 'zh' ? 'iOS - Shadowrocket' : 'iOS - Shadowrocket',
          content: locale === 'zh'
            ? '在 App Store 下载 Shadowrocket（需美区账号）'
            : 'Download Shadowrocket from App Store (US account required)',
          command: null
        },
        {
          title: locale === 'zh' ? 'Android - Clash for Android' : 'Android - Clash for Android',
          content: locale === 'zh'
            ? '从 GitHub 或 Google Play 下载 Clash for Android'
            : 'Download Clash for Android from GitHub or Google Play',
          command: 'https://github.com/Kr328/ClashForAndroid/releases'
        },
        {
          title: locale === 'zh' ? '导入配置' : 'Import Config',
          content: locale === 'zh'
            ? '在应用内添加订阅链接或扫描二维码'
            : 'Add subscription link or scan QR code in app',
          command: null
        },
        {
          title: locale === 'zh' ? '启动服务' : 'Start Service',
          content: locale === 'zh'
            ? '点击连接按钮，授权 VPN 权限后即可使用'
            : 'Click connect button and grant VPN permission',
          command: null
        }
      ]
    }
  };

  const faqItems = [
    {
      key: '1',
      question: locale === 'zh' ? '为什么无法连接？' : 'Why cannot connect?',
      answer: locale === 'zh'
        ? '检查订阅链接是否正确、网络连接是否正常、防火墙设置是否阻止了客户端'
        : 'Check if subscription link is correct, network connection is stable, and firewall allows the client'
    },
    {
      key: '2',
      question: locale === 'zh' ? '速度慢怎么办？' : 'What if speed is slow?',
      answer: locale === 'zh'
        ? '尝试切换不同的节点、使用延迟测试功能选择最快节点、检查本地网络带宽'
        : 'Try switching nodes, use latency test to select fastest node, check local network bandwidth'
    },
    {
      key: '3',
      question: locale === 'zh' ? '如何更新订阅？' : 'How to update subscription?',
      answer: locale === 'zh'
        ? '在客户端的订阅管理页面点击更新按钮，或设置自动更新间隔'
        : 'Click update button in subscription management page, or set auto-update interval'
    }
  ];

  return (
    <div className="guide-page">
      <Header />

      {/* Hero Section */}
      <section className="guide-hero">
        <div className="guide-hero-content">
          <div className="guide-hero-icon">
            <BookOpen size={56} color="#5b8def" strokeWidth={1.5} />
          </div>
          <h1>
            <BookOpen size={36} color="#5b8def" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            {locale === 'zh' ? '配置指南' : 'Setup Guide'}
          </h1>
          <p className="guide-hero-subtitle">
            <Code size={20} color="#52c41a" strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {locale === 'zh'
              ? '详细的客户端配置教程，快速上手各平台'
              : 'Detailed client configuration tutorials for all platforms'}
          </p>
        </div>
      </section>

      {/* Quick Steps */}
      <section className="guide-steps">
        <div className="guide-container">
          <h2 className="section-title">
            <Zap size={28} color="#ffa502" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            {locale === 'zh' ? '快速开始' : 'Quick Start'}
          </h2>
          <div className="steps-grid">
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="step-card" bordered={false} hoverable>
                  <div className="step-number" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
                    {index + 1}
                  </div>
                  <div className="step-icon" style={{ backgroundColor: `${step.color}15` }}>
                    <Icon size={36} color={step.color} strokeWidth={2} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Guides */}
      <section className="guide-platforms">
        <div className="guide-container">
          <h2 className="section-title">
            <Laptop size={28} color="#48dbfb" strokeWidth={2.5} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            {locale === 'zh' ? '平台教程' : 'Platform Tutorials'}
          </h2>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            size="large"
            items={Object.entries(osGuides).map(([key, guide]) => {
              const Icon = guide.icon;
              return {
                key,
                label: (
                  <span className="tab-label">
                    <Icon size={20} color={guide.color} strokeWidth={2} />
                    {guide.name}
                  </span>
                ),
                children: (
                  <div className="platform-content">
                    <Steps
                      direction="vertical"
                      current={-1}
                      items={guide.steps.map((step, index) => ({
                        title: step.title,
                        description: (
                          <div className="step-detail">
                            <p>{step.content}</p>
                            {step.command && (
                              <div className="command-box">
                                <Code size={16} color="#999" />
                                <code>{step.command}</code>
                              </div>
                            )}
                          </div>
                        ),
                        icon: <div className="step-icon-circle">{index + 1}</div>
                      }))}
                    />
                  </div>
                )
              };
            })}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="guide-faq">
        <div className="guide-container">
          <h2 className="section-title">
            <AlertCircle size={28} color="#ffa502" strokeWidth={2} />
            {locale === 'zh' ? '常见问题' : 'FAQ'}
          </h2>
          <Collapse
            bordered={false}
            className="faq-collapse"
            items={faqItems.map(item => ({
              key: item.key,
              label: <span className="faq-question">{item.question}</span>,
              children: <p className="faq-answer">{item.answer}</p>
            }))}
          />
        </div>
      </section>
    </div>
  );
};

export default Guide;
