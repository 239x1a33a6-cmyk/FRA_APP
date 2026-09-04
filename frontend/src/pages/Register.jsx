import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password.length < 6) return setError('Password must be at least 6 characters')
        setLoading(true)
        try {
            const res = await api.post('/auth/register', form)
            if (res.data.pending) {
                setSuccess(res.data.message)
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="emblem" style={{ background: '#e8f0f9', fontSize: '1.5rem' }}>
                        <span style={{ color: '#1e5c9b' }}>FRA</span>
                    </div>
                    <h4>Create Account</h4>
                    <p>FRA Atlas — Forest Rights Act Platform</p>
                </div>

                {success ? (
                    <div>
                        <div className="alert alert-success py-3" style={{ fontSize: '0.84rem' }}>
                            <strong>Account submitted for approval</strong>
                            <div className="mt-1">{success}</div>
                        </div>
                        <div className="section-card mt-3" style={{ background: '#f8f9fa' }}>
                            <div style={{ fontSize: '0.82rem', color: '#555' }}>
                                <strong>What happens next?</strong>
                                <ol className="mt-2 mb-0" style={{ paddingLeft: '1.2rem' }}>
                                    <li>A system administrator will review your registration</li>
                                    <li>They will assign you a role (Viewer / Officer) and authority</li>
                                    <li>You will then be able to log in with your credentials</li>
                                </ol>
                            </div>
                        </div>
                        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
                            <Link to="/login">Back to Login</Link>
                        </p>
                    </div>
                ) : (
                    <>
                        {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control form-control-sm" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-control form-control-sm" value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-control form-control-sm" value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.25rem' }}>Minimum 6 characters</div>
                            </div>
                            <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.78rem' }}>
                                New accounts require administrator approval before login. You will be assigned an appropriate role.
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm w-100" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : 'Submit Registration'}
                            </button>
                        </form>
                        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.78rem' }}>
                            Already have an account? <Link to="/login">Sign In</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
