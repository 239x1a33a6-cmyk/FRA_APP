import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Users() {
    const [users, setUsers] = useState([])
    const [authorities, setAuthorities] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('pending')
    const [approveModal, setApproveModal] = useState(null) // user object
    const [approveForm, setApproveForm] = useState({ role: 'VIEWER', authorityId: '' })
    const [approving, setApproving] = useState(false)
    const [error, setError] = useState('')

    const load = () => {
        setLoading(true)
        Promise.all([api.get('/users'), api.get('/authorities')])
            .then(([u, a]) => { setUsers(u.data); setAuthorities(a.data) })
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const pending = users.filter(u => !u.isApproved)
    const approved = users.filter(u => u.isApproved)

    const openApprove = (user) => {
        setApproveModal(user)
        setApproveForm({ role: user.role || 'VIEWER', authorityId: user.authorityId?._id || '' })
        setError('')
    }

    const handleApprove = async (e) => {
        e.preventDefault()
        setApproving(true)
        setError('')
        try {
            await api.patch(`/users/${approveModal._id}/approve`, approveForm)
            setApproveModal(null)
            load()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve')
        } finally {
            setApproving(false)
        }
    }

    const updateUser = async (id, data) => {
        try {
            await api.put(`/users/${id}`, data)
            load()
        } catch (err) { alert(err.response?.data?.message || 'Failed') }
    }

    const toggleActive = (user) => {
        if (!window.confirm(`${user.isActive ? 'Deactivate' : 'Activate'} user ${user.name}?`)) return
        updateUser(user._id, { isActive: !user.isActive })
    }

    const revokeApproval = (user) => {
        if (!window.confirm(`Revoke approval for ${user.name}? They will not be able to log in.`)) return
        updateUser(user._id, { isApproved: false })
    }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>User Management</h2>
                    <p>Approve new accounts and manage user roles and authority assignments.</p>
                </div>
                <div className="d-flex gap-2">
                    {pending.length > 0 && (
                        <span className="badge bg-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem', borderRadius: 6 }}>
                            {pending.length} Pending
                        </span>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
                        Pending Approval
                        {pending.length > 0 && <span className="ms-2 badge bg-danger" style={{ fontSize: '0.65rem' }}>{pending.length}</span>}
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${tab === 'approved' ? 'active' : ''}`} onClick={() => setTab('approved')}>
                        Approved Users ({approved.length})
                    </button>
                </li>
            </ul>

            {/* Pending Tab */}
            {tab === 'pending' && (
                pending.length === 0 ? (
                    <div className="empty-state section-card">
                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>✓</span>
                        <p style={{ color: '#888' }}>No pending approvals</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Registered</th><th>Status</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {pending.map(u => (
                                        <tr key={u._id}>
                                            <td style={{ fontWeight: 500 }}>{u.name}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{u.email}</td>
                                            <td style={{ fontSize: '0.78rem', color: '#888' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td><span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#e65100', background: '#fff3e0', padding: '2px 8px', borderRadius: 4 }}>PENDING</span></td>
                                            <td>
                                                <button className="btn btn-primary btn-sm me-1" onClick={() => openApprove(u)}>Approve</button>
                                                <button className="btn btn-outline-danger btn-sm" onClick={() => updateUser(u._id, { isActive: false })}>Reject</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* Approved Tab */}
            {tab === 'approved' && (
                <div className="table-wrapper">
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Role</th><th>Authority</th><th>Status</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {approved.map(u => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{u.email}</td>
                                        <td>
                                            <select className="form-select form-select-sm" style={{ width: 110 }}
                                                value={u.role} onChange={e => updateUser(u._id, { role: e.target.value })}>
                                                <option value="ADMIN">Admin</option>
                                                <option value="OFFICER">Officer</option>
                                                <option value="VIEWER">Viewer</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select className="form-select form-select-sm" style={{ width: 160 }}
                                                value={u.authorityId?._id || ''}
                                                onChange={e => updateUser(u._id, { authorityId: e.target.value || null })}>
                                                <option value="">No Authority</option>
                                                {authorities.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: u.isActive ? '#2e7d32' : '#c62828' }}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="d-flex gap-1">
                                            <button className={`btn btn-sm ${u.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                                            <button className="btn btn-outline-danger btn-sm" onClick={() => revokeApproval(u)}>Revoke</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {approveModal && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header py-2">
                                <h6 className="modal-title">Approve Account — {approveModal.name}</h6>
                                <button type="button" className="btn-close" onClick={() => setApproveModal(null)} />
                            </div>
                            <form onSubmit={handleApprove}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}
                                    <div className="section-card mb-3" style={{ background: '#f8f9fa' }}>
                                        {[['Name', approveModal.name], ['Email', approveModal.email],
                                        ['Registered', new Date(approveModal.createdAt).toLocaleDateString('en-IN')]].map(([l, v]) => (
                                            <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v}</span></div>
                                        ))}
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">Assign Role <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" value={approveForm.role}
                                                onChange={e => setApproveForm({ ...approveForm, role: e.target.value })}>
                                                <option value="VIEWER">Viewer — Read only access</option>
                                                <option value="OFFICER">Officer — Can submit verifications and decisions</option>
                                                <option value="ADMIN">Admin — Full system access</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Assign Authority (if Officer)</label>
                                            <select className="form-select form-select-sm" value={approveForm.authorityId}
                                                onChange={e => setApproveForm({ ...approveForm, authorityId: e.target.value })}>
                                                <option value="">No specific authority</option>
                                                {authorities.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                                            </select>
                                            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.25rem' }}>
                                                Assigning an authority restricts this officer to only see and process claims at that level.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setApproveModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={approving}>
                                        {approving ? 'Approving...' : 'Approve & Activate Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
