import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Beneficiaries() {
    const { isOfficer } = useAuth()
    const [beneficiaries, setBeneficiaries] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', fatherOrMotherName: '', gender: 'Male', category: 'ST', contactNumber: '', address: '', administrativeUnitId: '' })
    const [units, setUnits] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const fetch = (s = search, p = page) => {
        setLoading(true)
        api.get('/beneficiaries', { params: { search: s, page: p, limit: 15 } })
            .then(r => { setBeneficiaries(r.data.beneficiaries); setTotal(r.data.total) })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetch(); api.get('/administrative-units?type=VILLAGE').then(r => setUnits(r.data)) }, [])
    useEffect(() => { fetch(search, page) }, [page])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSubmitting(true)
        try {
            await api.post('/beneficiaries', form)
            setShowModal(false); setForm({ name: '', fatherOrMotherName: '', gender: 'Male', category: 'ST', contactNumber: '', address: '', administrativeUnitId: '' })
            fetch()
        } catch (err) { setError(err.response?.data?.message || 'Failed') }
        finally { setSubmitting(false) }
    }

    const pages = Math.ceil(total / 15)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Beneficiaries</h2>
                    <p>Manage FRA claimants and right-holders.</p>
                </div>
                {isOfficer() && <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add Beneficiary</button>}
            </div>

            <div className="form-card mb-3">
                <div className="row g-2">
                    <div className="col-md-4">
                        <input className="form-control form-control-sm" placeholder="Search by name..." value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); fetch(e.target.value, 1) }} />
                    </div>
                </div>
            </div>

            <div className="table-wrapper">
                <div className="px-3 py-2 border-bottom" style={{ fontSize: '0.82rem', color: '#888' }}>{total} beneficiar{total !== 1 ? 'ies' : 'y'} found</div>
                <div className="table-responsive">
                    <table className="table">
                        <thead><tr><th>Name</th><th>Category</th><th>Gender</th><th>Village</th><th>Contact</th><th></th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : beneficiaries.length === 0 ? (
                                <tr><td colSpan={6} className="empty-state"><span className="fs-1">👥</span><p>No beneficiaries found</p></td></tr>
                            ) : beneficiaries.map(b => (
                                <tr key={b._id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{b.name}</div>
                                        {b.fatherOrMotherName && <div style={{ fontSize: '0.72rem', color: '#888' }}>S/o D/o {b.fatherOrMotherName}</div>}
                                    </td>
                                    <td><span className="badge-status badge-IFR">{b.category}</span></td>
                                    <td>{b.gender}</td>
                                    <td style={{ fontSize: '0.78rem' }}>{b.administrativeUnitId?.name || '—'}</td>
                                    <td style={{ fontSize: '0.78rem' }}>{b.contactNumber || '—'}</td>
                                    <td><Link to={`/beneficiaries/${b._id}`} className="btn btn-outline-primary btn-sm">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {pages > 1 && (
                    <div className="d-flex justify-content-center gap-1 p-3">
                        <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button className="btn btn-outline-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header py-2">
                                <h6 className="modal-title">Add Beneficiary</h6>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Full Name <span className="text-danger">*</span></label>
                                            <input className="form-control form-control-sm" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Father / Mother Name</label>
                                            <input className="form-control form-control-sm" value={form.fatherOrMotherName} onChange={e => setForm({ ...form, fatherOrMotherName: e.target.value })} />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Gender <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                                                <option>Male</option><option>Female</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Category <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                                <option>ST</option><option>SC</option><option>OBC</option><option>General</option><option>Other</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Contact Number</label>
                                            <input className="form-control form-control-sm" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Address</label>
                                            <input className="form-control form-control-sm" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Village <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" required value={form.administrativeUnitId} onChange={e => setForm({ ...form, administrativeUnitId: e.target.value })}>
                                                <option value="">Select village...</option>
                                                {units.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Add Beneficiary'}
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
