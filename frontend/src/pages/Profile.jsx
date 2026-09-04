import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Profile() {
    const { user } = useAuth()
    const [form, setForm] = useState({ name: user?.name || '', password: '', confirm: '' })
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('')
        if (form.password && form.password !== form.confirm) return setError('Passwords do not match')
        setLoading(true)
        try {
            await api.put('/users/profile', { name: form.name, password: form.password || undefined })
            setSuccess('Profile updated successfully')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed')
        } finally { setLoading(false) }
    }

    return (
        <div>
            <div className="page-header"><div><h2>Profile</h2><p>View and update your account information</p></div></div>
            <div className="row g-3">
                <div className="col-12 col-md-4">
                    <div className="section-card text-center">
                        <div className="user-avatar mx-auto mb-2" style={{ width: 64, height: 64, fontSize: '1.4rem', background: '#1e5c9b', color: '#fff' }}>
                            {user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{user?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{user?.email}</div>
                        <div className="mt-2">
                            <span className={`badge-status badge-${user?.role}`}>{user?.role}</span>
                            {user?.authorityId && <div style={{ fontSize: '0.76rem', color: '#888', marginTop: '0.25rem' }}>{user.authorityId.name}</div>}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-8">
                    <div className="form-card">
                        <div className="form-section-title">Update Profile</div>
                        {success && <div className="alert alert-success py-2 mb-3" style={{ fontSize: '0.82rem' }}>{success}</div>}
                        {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-12">
                                    <label className="form-label">Full Name</label>
                                    <input className="form-control form-control-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Email</label>
                                    <input className="form-control form-control-sm" value={user?.email} disabled />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">New Password</label>
                                    <input type="password" className="form-control form-control-sm" value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Confirm Password</label>
                                    <input type="password" className="form-control form-control-sm" value={form.confirm}
                                        onChange={e => setForm({ ...form, confirm: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm mt-3" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
