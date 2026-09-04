import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check if we have a stored token and verify it
        const token = localStorage.getItem('fra_token')
        if (!token) {
            setLoading(false)
            return
        }
        api.get('/auth/me')
            .then(res => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('fra_token')
                setUser(null)
            })
            .finally(() => setLoading(false))
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, ...userData } = res.data
        // Store token in localStorage for cross-domain use
        if (token) localStorage.setItem('fra_token', token)
        setUser(userData)
        return userData
    }

    const register = async (data) => {
        const res = await api.post('/auth/register', data)
        return res.data
    }

    const logout = async () => {
        try { await api.post('/auth/logout') } catch (_) { /* ignore */ }
        localStorage.removeItem('fra_token')
        setUser(null)
    }

    const isAdmin = () => user?.role === 'ADMIN'
    const isOfficer = () => user?.role === 'OFFICER' || user?.role === 'ADMIN'
    const getAuthorityType = () => user?.authorityId?.type || null

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isOfficer, getAuthorityType }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
