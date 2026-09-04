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

// Response interceptor — redirect to login on 401 (except /auth/me which is the initial check)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    // Don't redirect for the auth check itself — AuthContext handles that gracefully
    if (err.response?.status === 401 && !url.includes('/auth/me')) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
