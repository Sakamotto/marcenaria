// Centralized API configuration for Marcena.net
// Dynamically switches between localhost (for development) and production backend URL on Render.
export const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000/api'
  : 'https://marcenaria-api.onrender.com/api';
