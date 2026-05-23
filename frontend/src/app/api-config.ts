// Centralized API configuration for CRM Marcenaria
// Dynamically switches between localhost (for development) and relative paths (for Vercel deployment).
export const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : '/api';
