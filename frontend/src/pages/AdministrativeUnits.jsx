import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdministrativeUnits() {
    const [units, setUnits] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', type: 'VILLAGE', code: '', parentId: '' })
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetch = () => {
        setLoading(true)
        api.get('/administrative-units').then(r => setUnits(r.data)).finally(() => setLoading(false))
    }

    useEffect(() => { fetch() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSubmitting(true)
        try {
            await api.post('/administrative-units', form)
            setShowModal(false); setForm({ name: '', type: 'VILLAGE', code: '', parentId: '' }); fetch()
        } catch (err) { setError(err.response?.data?.message || 'Failed') }
        finally { setSubmitting(false) }
    }

    const typeColors = { STATE: '#880e4f', DISTRICT: '#0277bd', SUB_DIVISION: '#e65100', MANDAL: '#6a1b9a', GRAM_PANCHAYAT: '#2e7d32', VILLAGE: '#00695c' }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>

    return (
        <div>
            <div className="page-header">
                <div><h2>Administrative Units</h2><p>Hierarchical administrative areas — State → District → Mandal → Village.</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add Unit</button>
            </div>

            <div className="table-wrapper">
                <div className="table-responsive">
                    <table className="table">
                        <thead><tr><th>Name</th><th>Type</th><th>Code</th><th>Parent</th></tr></thead>
                        <tbody>
                            {units.map(u => (
                                <tr key={u._id}>
                                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                                    <td><span style={{ fontSize: '0.72rem', fontWeight: 600, color: typeColors[u.type] || '#333', background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{u.type}</span></td>
                                    <td style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>{u.code || '—'}</td>
                                    <td style={{ fontSize: '0.78rem' }}>{u.parentId?.name || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header py-2">
                                <h6 className="modal-title">Add Administrative Unit</h6>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.82rem' }}>{error}</div>}
                                    <div className="row g-3">
                                        <div className="col-8"><label className="form-label">Name <span className="text-danger">*</span></label>
                                            <input className="form-control form-control-sm" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                                        <div className="col-4"><label className="form-label">Code</label>
                                            <input className="form-control form-control-sm" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                                        <div className="col-12"><label className="form-label">Type <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                                {['STATE', 'DISTRICT', 'SUB_DIVISION', 'MANDAL', 'GRAM_PANCHAYAT', 'VILLAGE'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select></div>
                                        <div className="col-12"><label className="form-label">Parent Unit</label>
                                            <select className="form-select form-select-sm" value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}>
                                                <option value="">None (top-level)</option>
                                                {units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.type})</option>)}
                                            </select></div>
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Saving...' : 'Add Unit'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
