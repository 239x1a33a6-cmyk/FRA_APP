import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
