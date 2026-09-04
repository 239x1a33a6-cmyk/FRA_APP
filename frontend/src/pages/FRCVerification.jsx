import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function FRCVerification() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [claim, setClaim] = useState(null)
    const [authorities, setAuthorities] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        siteVisited: true, landVerified: true, claimedArea: '', verifiedArea: '',
        findings: '', remarks: '', authorityId: ''
    })

    useEffect(() => {
        Promise.all([
            api.get(`/claims/${id}`),
            api.get('/authorities?type=FRC')
        ]).then(([c, a]) => {
            setClaim(c.data)
            setAuthorities(a.data)
            if (c.data.claimDetails?.landArea) setForm(f => ({ ...f, claimedArea: c.data.claimDetails.landArea }))
            if (user?.authorityId?._id) setForm(f => ({ ...f, authorityId: user.authorityId._id }))
        }).finally(() => setLoading(false))
    }, [id])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await api.post(`/claims/${id}/verification`, form)
            navigate(`/claims/${id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit verification')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>
    if (!claim) return <div className="alert alert-danger">Claim not found</div>

    return (
        <div>
            <div className="page-header">
                <div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}><a href={`/claims/${id}`}>← Back to Claim</a></div>
                    <h2>FRC Physical Verification</h2>
                    <p>Claim {claim.claimNumber} — {claim.claimType} | Beneficiary: {claim.beneficiaryId?.name}</p>
                </div>
            </div>

            {/* Claim summary */}
            <div className="section-card mb-3">
                <h6>Claim Reference</h6>
                <div className="row g-2">
                    {[['Claim No.', claim.claimNumber], ['Type', claim.claimType], ['Beneficiary', claim.beneficiaryId?.name],
                    ['Location', claim.administrativeUnitId?.name], ['Claimed Area', claim.claimDetails?.landArea ? `${claim.claimDetails.landArea} acres` : '—']].map(([l, v]) => (
                        <div className="col-6 col-md-3" key={l}>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{l}</div>
                            <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{v || '—'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-section-title">Physical Verification Record</div>
                    <div className="row g-3">
                        {!user?.authorityId && (
                            <div className="col-12">
                                <label className="form-label">FRC Authority</label>
                                <select className="form-select form-select-sm" value={form.authorityId}
                                    onChange={e => setForm({ ...form, authorityId: e.target.value })}>
                                    <option value="">Select FRC...</option>
                                    {authorities.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="col-md-6">
                            <label className="form-label">Site Visited</label>
                            <div className="d-flex gap-2">
                                {[true, false].map(v => (
                                    <button type="button" key={v.toString()}
                                        className={`btn btn-sm ${form.siteVisited === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setForm({ ...form, siteVisited: v })}>{v ? 'Yes' : 'No'}</button>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Land Verified</label>
                            <div className="d-flex gap-2">
                                {[true, false].map(v => (
                                    <button type="button" key={v.toString()}
                                        className={`btn btn-sm ${form.landVerified === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => setForm({ ...form, landVerified: v })}>{v ? 'Yes' : 'No'}</button>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Claimed Area (acres)</label>
                            <input type="number" step="0.01" className="form-control form-control-sm" value={form.claimedArea}
                                onChange={e => setForm({ ...form, claimedArea: e.target.value })} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Verified Area (acres)</label>
                            <input type="number" step="0.01" className="form-control form-control-sm" value={form.verifiedArea}
                                onChange={e => setForm({ ...form, verifiedArea: e.target.value })} />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Findings <span className="text-danger">*</span></label>
                            <textarea rows={4} className="form-control form-control-sm" required value={form.findings}
                                onChange={e => setForm({ ...form, findings: e.target.value })}
                                placeholder="Record field findings, observations, land usage details, witnesses met..." />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Remarks</label>
                            <textarea rows={2} className="form-control form-control-sm" value={form.remarks}
                                onChange={e => setForm({ ...form, remarks: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className="alert alert-info mt-2 py-2" style={{ fontSize: '0.82rem' }}>
                    Submitting this verification will move the claim to <strong>Gram Sabha Decision</strong> stage.
                </div>

                <div className="d-flex gap-2 mt-3">
                    <a href={`/claims/${id}`} className="btn btn-outline-secondary btn-sm">Cancel</a>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : '✓ Submit Verification'}
                    </button>
                </div>
            </form>
        </div>
    )
}
