// Mock API endpoint for development
export async function onRequestGet(context) {
  const mockWebsites = [
    {
      id: 1,
      name: 'OpenAI 官方 API',
      description: '官方稳定的 API 接口，支持 GPT-4 和 DALL-E',
      display_url: 'https://openai.com',
      invite_link: 'https://openai.com/api',
      status: 'online',
      latency: 120,
      likes: 42,
      comments: 8,
      formatted_date: '2026-01-07',
      last_checked: '2026-01-07T10:00:00Z'
    },
    {
      id: 2,
      name: 'Claude API 中转',
      description: '高速稳定的 Claude API 中转服务',
      display_url: 'https://claude.ai',
      invite_link: 'https://claude.ai/invite?code=abc123',
      status: 'online',
      latency: 95,
      likes: 38,
      comments: 12,
      formatted_date: '2026-01-07',
      last_checked: '2026-01-07T09:30:00Z'
    },
    {
      id: 3,
      name: 'Gemini Pro API',
      description: 'Google 最新 Gemini Pro 模型接口',
      display_url: 'https://gemini.google.com',
      invite_link: 'https://gemini.google.com/api',
      status: 'offline',
      latency: null,
      likes: 15,
      comments: 3,
      formatted_date: '2026-01-06',
      last_checked: '2026-01-06T18:00:00Z'
    }
  ];

  return new Response(JSON.stringify(mockWebsites), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
