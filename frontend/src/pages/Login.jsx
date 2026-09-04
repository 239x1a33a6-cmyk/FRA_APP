import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(form.email, form.password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const demoLogin = (email) => {
        setForm({ email, password: 'password123' })
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="emblem">🌿</div>
                    <h4>FRA Atlas</h4>
                    <p>Forest Rights Act Claims Management Platform</p>
                </div>

                {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-control form-control-sm" value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control form-control-sm" value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <hr className="my-3" />
                <p className="text-center mb-2" style={{ fontSize: '0.75rem', color: '#888' }}>Quick Demo Access</p>
                <div className="row g-1">
                    {[
                        ['admin@fra.gov.in', 'Admin'],
                        ['frc@fra.gov.in', 'FRC'],
                        ['gramsabha@fra.gov.in', 'Gram Sabha'],
                        ['sdlc@fra.gov.in', 'SDLC'],
                        ['dlc@fra.gov.in', 'DLC'],
                        ['viewer@fra.gov.in', 'Viewer']
                    ].map(([email, label]) => (
                        <div className="col-4" key={email}>
                            <button className="btn btn-outline-secondary btn-sm w-100" style={{ fontSize: '0.7rem' }}
                                onClick={() => demoLogin(email)} type="button">{label}</button>
                        </div>
                    ))}
                </div>
                <p className="text-center mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    )
}
