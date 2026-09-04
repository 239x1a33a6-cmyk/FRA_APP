import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Authorities() {
    const [authorities, setAuthorities] = useState([])
    const [units, setUnits] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState({ name: '', type: 'FRC', administrativeUnitId: '', description: '' })
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetch = () => {
        setLoading(true)
        Promise.all([api.get('/authorities'), api.get('/administrative-units')])
            .then(([a, u]) => { setAuthorities(a.data); setUnits(u.data) })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetch() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSubmitting(true)
        try {
            await api.post('/authorities', form)
            setShowModal(false); setForm({ name: '', type: 'FRC', administrativeUnitId: '', description: '' })
            fetch()
        } catch (err) { setError(err.response?.data?.message || 'Failed') }
        finally { setSubmitting(false) }
    }

    const typeColors = { FRC: '#e65100', GRAM_SABHA: '#3949ab', SDLC: '#6a1b9a', DLC: '#00695c' }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>

    return (
        <div>
            <div className="page-header">
                <div><h2>Authorities</h2><p>Manage FRC, Gram Sabha, SDLC, and DLC committees.</p></div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Add Authority</button>
            </div>

            <div className="row g-3">
                {['FRC', 'GRAM_SABHA', 'SDLC', 'DLC'].map(type => {
                    const group = authorities.filter(a => a.type === type)
                    return (
                        <div className="col-12 col-md-6" key={type}>
                            <div className="section-card">
                                <h6 style={{ color: typeColors[type] }}>{type.replace('_', ' ')} ({group.length})</h6>
                                {group.length === 0 ? <div style={{ fontSize: '0.82rem', color: '#aaa' }}>None configured</div>
                                    : group.map(a => (
                                        <div key={a._id} className="d-flex justify-content-between align-items-start py-2 border-bottom">
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{a.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#888' }}>{a.administrativeUnitId?.name}</div>
                                                {a.description && <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{a.description}</div>}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header py-2">
                                <h6 className="modal-title">Add Authority</h6>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label">Name <span className="text-danger">*</span></label>
                                            <input className="form-control form-control-sm" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label">Type <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                                <option value="FRC">FRC</option>
                                                <option value="GRAM_SABHA">GRAM SABHA</option>
                                                <option value="SDLC">SDLC</option>
                                                <option value="DLC">DLC</option>
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Administrative Unit <span className="text-danger">*</span></label>
                                            <select className="form-select form-select-sm" required value={form.administrativeUnitId} onChange={e => setForm({ ...form, administrativeUnitId: e.target.value })}>
                                                <option value="">Select unit...</option>
                                                {units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.type})</option>)}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label">Description</label>
                                            <input className="form-control form-control-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Saving...' : 'Add Authority'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
