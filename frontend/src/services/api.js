import axios from 'axios'

// In dev: Vite proxy forwards /api → localhost:8100
// In production (Vercel): use VITE_API_URL set in Vercel dashboard
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach stored JWT token as Authorization header
// This ensures requests work cross-domain (Vercel → Render) where cookies may be blocked
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fra_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor — redirect to login on 401 (except /auth/me which is the initial check)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    // Don't redirect for the auth check itself — AuthContext handles that gracefully
    if (err.response?.status === 401 && !url.includes('/auth/me')) {
      localStorage.removeItem('fra_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
