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

// Mock API handler
const mockApiHandler = async (config) => {
  const { method, url, data } = config;

  // Mock /auth endpoints — keeps login/signup working in DEMO_MODE or when the
  // backend is unreachable (e.g. a cold-started host). Without this, a failed
  // /auth/login falls through to the default { success: true } response, which
  // has no token/user, so the user is silently bounced back by ProtectedRoute.
  if (url.includes('/auth')) {
    const demoUser = {
      id: 'demo-user',
      name: 'Demo Founder',
      email: 'founder@pivotvault.demo',
    };
    if (url.includes('/auth/me')) {
      return { data: { user: demoUser } };
    }
    const body = data || {};
    const email = body.email || demoUser.email;
    const name = body.name || (email.includes('@') ? email.split('@')[0] : 'Founder');
    return {
      data: {
        token: 'demo-token',
        user: { ...demoUser, name, email },
      },
    };
  }

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

  // Mock /startups endpoint
  if (url.includes('/startups')) {
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
      if (import.meta.env.DEV) console.warn('Backend unavailable, using mock data:', err);
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
      if (import.meta.env.DEV) console.warn('Backend unavailable, using mock data:', err);
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
      if (import.meta.env.DEV) console.warn('Backend unavailable, using mock data:', err);
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
      if (import.meta.env.DEV) console.warn('Backend unavailable, using mock data:', err);
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
