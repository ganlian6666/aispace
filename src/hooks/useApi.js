import { useState, useEffect } from 'react';

export const useWebsites = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWebsites = async () => {
    try {
      setLoading(true);

      // Mock data for development
      const mockData = [
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
          formatted_date: '2026-01-07'
        },
        {
          id: 2,
          name: 'Claude API 中转',
          description: '高速稳定的 Claude API 中转服务，延迟低至95ms',
          display_url: 'https://claude.ai',
          invite_link: 'https://claude.ai/invite?code=abc123',
          status: 'online',
          latency: 95,
          likes: 38,
          comments: 12,
          formatted_date: '2026-01-07'
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
          formatted_date: '2026-01-06'
        },
        {
          id: 4,
          name: 'Anthropic Claude API',
          description: '官方Claude API，支持Claude 3 Opus/Sonnet/Haiku',
          display_url: 'https://anthropic.com',
          invite_link: 'https://anthropic.com/api',
          status: 'online',
          latency: 110,
          likes: 56,
          comments: 20,
          formatted_date: '2026-01-07'
        }
      ];

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setWebsites(mockData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching websites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  return { websites, loading, error, refetch: fetchWebsites };
};

export const useLike = () => {
  const [liking, setLiking] = useState(false);

  const toggleLike = async (cardId) => {
    if (liking) return;

    try {
      setLiking(true);
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('like_limit');
        }
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLiking(false);
    }
  };

  return { toggleLike, liking };
};

export const useComments = (cardId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments?card_id=${cardId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const postComment = async (content, nickname) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, content, nickname }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('comment_limit');
        }
        throw new Error('Failed to post comment');
      }

      await fetchComments();
      return true;
    } catch (error) {
      throw error;
    }
  };

  return { comments, loading, fetchComments, postComment };
};

export const useSubmit = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitWebsite = async (data) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit website');
      }

      return true;
    } catch (error) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitWebsite, submitting };
};

export const useFeedback = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (data) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      return true;
    } catch (error) {
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return { submitFeedback, submitting };
};

export const useStatus = () => {
  const [statuses, setStatuses] = useState([]);

  const fetchStatus = async () => {
    try {
      // Mock status data
      const mockStatuses = [
        { card_id: 1, status: 'online', latency: 120 },
        { card_id: 2, status: 'online', latency: 95 },
        { card_id: 3, status: 'offline', latency: null },
        { card_id: 4, status: 'online', latency: 110 }
      ];

      await new Promise(resolve => setTimeout(resolve, 300));
      setStatuses(mockStatuses);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { statuses, refetch: fetchStatus };
};
