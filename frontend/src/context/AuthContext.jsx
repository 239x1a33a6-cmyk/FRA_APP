import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/auth/me')
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        setUser(res.data)
        return res.data
    }

    const register = async (data) => {
        const res = await api.post('/auth/register', data)
        setUser(res.data)
        return res.data
    }

    const logout = async () => {
        await api.post('/auth/logout')
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
