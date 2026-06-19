import axios from 'axios';
import {
  mockStartups,
  mockRiskScan,
  mockAiResponse,
  mockPlaybook,
  mockPitchDeckAutopsy
} from './mockApi';

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
  
  // Mock /startups endpoint
  if (url.includes('/startups')) {
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
