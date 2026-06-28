import axios from 'axios';
import {
  mockStartups,
  mockRiskScan,
  mockAiResponse,
  mockPlaybook,
  mockPitchDeckAutopsy,
  getStartupBySlug,
  generateMockExternalSources
} from './mockApi';
import { getRandomQuestions } from './quizData';

export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const TOKEN_KEY = 'pivotvault-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

const realApi = axios.create({ baseURL: `${API_URL}/api` });

// Attach Bearer token on every request
realApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// LocalStorage helpers for mock persistence
const getSavedBookmarks = () => {
  const saved = localStorage.getItem('pivotvault_bookmarks');
  return saved ? JSON.parse(saved) : [];
};

const getSearchHistory = () => {
  const saved = localStorage.getItem('pivotvault_history');
  return saved ? JSON.parse(saved) : [];
};

const addSearchHistory = (query) => {
  const history = getSearchHistory();
  if (history.some(h => h.query === query)) return;
  history.unshift({
    id: Date.now().toString(),
    query,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('pivotvault_history', JSON.stringify(history.slice(0, 50)));
};

const defaultConfessions = [
  { id: '1', text: 'I scaled marketing before figuring out our unit economics. Lost $2M in 6 months.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), upvotes: 12 },
  { id: '2', text: 'Never raise money from investors who do not understand your core space. They forced us to pivot into a wall.', createdAt: new Date(Date.now() - 86400000).toISOString(), upvotes: 8 },
  { id: '3', text: 'We spent 18 months building the perfect tech without talking to a single customer. Classic mistake.', createdAt: new Date().toISOString(), upvotes: 24 }
];

const getConfessions = () => {
  const saved = localStorage.getItem('pivotvault_confessions');
  if (!saved) {
    localStorage.setItem('pivotvault_confessions', JSON.stringify(defaultConfessions));
    return defaultConfessions;
  }
  return JSON.parse(saved);
};

// Mock API handler
const mockApiHandler = async (config) => {
  const { method, url, data } = config;
  
  // Mock /quiz endpoint
  if (url.includes('/quiz')) {
    // Parse query parameters
    const urlObj = new URL(url, 'http://localhost');
    const count = parseInt(urlObj.searchParams.get('count')) || 5;
    const difficulty = urlObj.searchParams.get('difficulty') || 'mixed';
    return {
      data: {
        questions: getRandomQuestions(count, difficulty)
      }
    };
  }

  // Mock /auth/login and /auth/register
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    const postData = typeof data === 'string' ? JSON.parse(data) : data;
    const name = postData?.name || 'Demo Founder';
    const email = postData?.email || 'demo@pivotvault.com';
    return {
      data: {
        token: 'demo-token-123456789',
        user: { name, email, role: 'founder' }
      }
    };
  }

  // Mock /auth/me
  if (url.includes('/auth/me')) {
    return {
      data: {
        user: { name: 'Demo Founder', email: 'demo@pivotvault.com', role: 'founder' }
      }
    };
  }

  // Mock /startups endpoint
  if (url.includes('/startups')) {
    // Check for similar startups endpoint
    const similarMatch = url.match(/\/startups\/([^/?#]+)\/similar/);
    if (similarMatch) {
      const slug = similarMatch[1];
      const filtered = mockStartups.filter(s => s.slug !== slug).slice(0, 3);
      return {
        data: filtered
      };
    }

    // Check for external-research endpoint
    const researchMatch = url.match(/\/startups\/([^/?#]+)\/external-research/);
    if (researchMatch) {
      const slug = researchMatch[1];
      const startup = getStartupBySlug(slug);
      return {
        data: {
          sources: generateMockExternalSources(startup.name)
        }
      };
    }
    
    // Check if it's a single startup request (has slug)
    const match = url.match(/\/startups\/([^/?#]+)/);
    if (match) {
      const slug = match[1];
      return {
        data: getStartupBySlug(slug)
      };
    }
    
    return {
      data: {
        data: mockStartups,
        total: mockStartups.length,
        startups: mockStartups
      }
    };
  }
  
  // Mock /ai/risk-scan endpoint
  if (url.includes('/ai/risk-scan')) {
    return { data: mockRiskScan };
  }
  
  // Mock /ai/research endpoint
  if (url.includes('/ai/research')) {
    const postData = typeof data === 'string' ? JSON.parse(data) : data;
    if (postData?.query) {
      addSearchHistory(postData.query);
    }
    return { data: mockAiResponse };
  }
  
  // Mock /ai/playbook endpoint
  if (url.includes('/ai/playbook')) {
    return { data: mockPlaybook };
  }
  
  // Mock /ai/autopsy endpoint
  if (url.includes('/ai/autopsy')) {
    return { data: mockPitchDeckAutopsy };
  }
  
  // Mock /insights endpoint
  if (url.includes('/insights')) {
    return {
      data: {
        metrics: {
          totalFailed: 12437,
          totalFundingLost: '145250000000',
          mostCommonReason: 'pmf',
          fastestCollapse: 'Quibi (6 months)',
          industryRiskScore: 78
        },
        industryBreakdown: [
          { industry: 'E-Commerce', count: 2800 },
          { industry: 'FinTech', count: 2200 },
          { industry: 'Health Tech', count: 1800 },
          { industry: 'SaaS', count: 1500 }
        ],
        topFailureReasonsByIndustry: [
          { category: 'No PMF', count: 4500 },
          { category: 'Unit Economics', count: 2800 },
          { category: 'Cash Burn', count: 2100 },
          { category: 'Competition', count: 1500 }
        ],
        yearlyTrends: [
          { year: 2019, count: 1800 },
          { year: 2020, count: 2500 },
          { year: 2021, count: 2200 },
          { year: 2022, count: 1900 },
          { year: 2023, count: 1700 }
        ],
        topViewed: mockStartups,
        deathZones: [
          { industry: 'Grocery & Delivery', riskLevel: 'extreme', deathCount: 840, avgLifespan: 18, reason: 'High customer acquisition and delivery costs.' },
          { industry: 'FinTech', riskLevel: 'critical', deathCount: 710, avgLifespan: 24, reason: 'Regulatory hurdles and competition.' }
        ]
      }
    };
  }
  
  // Mock /graph/edges endpoint
  if (url.includes('/graph/edges')) {
    return {
      data: {
        nodes: [
          { id: '1', name: 'Juicero', type: 'startup' },
          { id: '2', name: 'Theranos', type: 'startup' },
          { id: '3', name: 'No PMF', type: 'failure_reason' },
          { id: '4', name: 'Unit Economics', type: 'failure_reason' },
          { id: 'shutdown', name: 'Shutdown', type: 'shutdown' }
        ],
        links: [
          { source: '1', target: '4', weight: 2 },
          { source: '2', target: '3', weight: 3 },
          { source: '3', target: 'shutdown', weight: 1 },
          { source: '4', target: 'shutdown', weight: 1 }
        ]
      }
    };
  }
  
  // Mock /bookmarks endpoint
  if (url.includes('/bookmarks')) {
    const savedSlugs = getSavedBookmarks();
    if (method === 'get') {
      const bookmarkedStartups = mockStartups.filter(s => savedSlugs.includes(s.slug));
      return {
        data: {
          data: bookmarkedStartups,
          slugs: savedSlugs
        }
      };
    }
    if (method === 'post') {
      const postData = typeof data === 'string' ? JSON.parse(data) : data;
      const slug = postData?.slug;
      if (slug && !savedSlugs.includes(slug)) {
        savedSlugs.push(slug);
        localStorage.setItem('pivotvault_bookmarks', JSON.stringify(savedSlugs));
      }
      return { data: { success: true, slugs: savedSlugs } };
    }
    if (method === 'delete') {
      const match = url.match(/\/bookmarks\/([^/?#]+)/);
      const slug = match ? match[1] : null;
      const updated = savedSlugs.filter(s => s !== slug);
      localStorage.setItem('pivotvault_bookmarks', JSON.stringify(updated));
      return { data: { success: true, slugs: updated } };
    }
  }

  // Mock /ai/history endpoint
  if (url.includes('/ai/history')) {
    return {
      data: {
        history: getSearchHistory()
      }
    };
  }

  // Mock /confessions endpoint
  if (url.includes('/confessions')) {
    const confessions = getConfessions();
    if (method === 'get') {
      return { data: confessions };
    }
    if (url.endsWith('/upvote')) {
      const match = url.match(/\/confessions\/([^/]+)\/upvote/);
      const id = match ? match[1] : null;
      if (id) {
        const updated = confessions.map(c => c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c);
        localStorage.setItem('pivotvault_confessions', JSON.stringify(updated));
      }
      return { data: { success: true } };
    }
    if (method === 'post') {
      const postData = typeof data === 'string' ? JSON.parse(data) : data;
      const newConfession = {
        id: Date.now().toString(),
        text: postData?.text || '',
        createdAt: new Date().toISOString(),
        upvotes: 0
      };
      confessions.unshift(newConfession);
      localStorage.setItem('pivotvault_confessions', JSON.stringify(confessions));
      return { data: newConfession };
    }
  }

  // Mock /ai/ghost-chat endpoint
  if (url.includes('/ai/ghost-chat')) {
    const postData = typeof data === 'string' ? JSON.parse(data) : data;
    const message = postData?.message || '';
    const slug = postData?.slug || '';
    const startupName = slug.charAt(0).toUpperCase() + slug.slice(1);
    
    let content = `We just ran out of options. We kept convincing ourselves that if we built one more feature, we'd hit the turning point. It was a delusion.`;
    if (message.toLowerCase().includes('why') || message.toLowerCase().includes('fail')) {
      content = `Ultimately, our unit economics were completely broken. We were losing money on every single order, and scaling only accelerated our death. We should have stopped and verified product-market fit.`;
    } else if (message.toLowerCase().includes('money') || message.toLowerCase().includes('funding')) {
      content = `We raised too much money too early, which made us lazy. We spent $10M on marketing campaigns before finding the core product value.`;
    } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      content = `Hello. Yes, the afterlife is quiet. Ask me anything about ${startupName} and I'll tell you the brutal truth.`;
    }
    return {
      data: {
        content
      }
    };
  }

  // Default mock response
  return { data: { success: true } };
};

// Create a wrapper that tries real API first, falls back to mock
const api = {
  async get(url, config = {}) {
    if (DEMO_MODE) {
      return mockApiHandler({ method: 'get', url, ...config });
    }
    try {
      return await realApi.get(url, config);
    } catch (err) {
      console.warn('Backend unavailable, using mock data:', err);
      return mockApiHandler({ method: 'get', url, ...config });
    }
  },
  async post(url, data, config = {}) {
    if (DEMO_MODE) {
      return mockApiHandler({ method: 'post', url, data, ...config });
    }
    try {
      return await realApi.post(url, data, config);
    } catch (err) {
      console.warn('Backend unavailable, using mock data:', err);
      return mockApiHandler({ method: 'post', url, data, ...config });
    }
  },
  async put(url, data, config = {}) {
    if (DEMO_MODE) {
      return mockApiHandler({ method: 'put', url, data, ...config });
    }
    try {
      return await realApi.put(url, data, config);
    } catch (err) {
      console.warn('Backend unavailable, using mock data:', err);
      return mockApiHandler({ method: 'put', url, data, ...config });
    }
  },
  async delete(url, config = {}) {
    if (DEMO_MODE) {
      return mockApiHandler({ method: 'delete', url, ...config });
    }
    try {
      return await realApi.delete(url, config);
    } catch (err) {
      console.warn('Backend unavailable, using mock data:', err);
      return mockApiHandler({ method: 'delete', url, ...config });
    }
  }
};

// Broadcast 401s so AuthContext can log the user out
realApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('pv-unauthorized'));
    }
    return Promise.reject(err);
  }
);

export default api;
