import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function GramSabhaDecision() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [claim, setClaim] = useState(null)
    const [verifications, setVerifications] = useState([])
    const [authorities, setAuthorities] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({ decision: 'RECOMMENDED', resolutionNumber: '', remarks: '', authorityId: '' })

    useEffect(() => {
        Promise.all([
            api.get(`/claims/${id}`),
            api.get(`/claims/${id}/verifications`),
            api.get('/authorities?type=GRAM_SABHA')
        ]).then(([c, v, a]) => {
            setClaim(c.data); setVerifications(v.data); setAuthorities(a.data)
            if (user?.authorityId?._id) setForm(f => ({ ...f, authorityId: user.authorityId._id }))
        }).finally(() => setLoading(false))
    }, [id])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            await api.post(`/claims/${id}/decisions`, { decisionLevel: 'GRAM_SABHA', ...form })
            navigate(`/claims/${id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed')
        } finally { setSubmitting(false) }
    }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>
    if (!claim) return <div className="alert alert-danger">Claim not found</div>

    const latestV = verifications[0]

    return (
        <div>
            <div className="page-header">
                <div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}><a href={`/claims/${id}`}>← Back to Claim</a></div>
                    <h2>Gram Sabha Resolution</h2>
                    <p>Claim {claim.claimNumber} · {claim.beneficiaryId?.name}</p>
                </div>
            </div>

            {/* FRC Findings */}
            {latestV && (
                <div className="section-card mb-3" style={{ borderLeft: '3px solid #e65100' }}>
                    <h6>FRC Verification Findings</h6>
                    {[['Verified By', latestV.verifiedBy?.name], ['Site Visited', latestV.siteVisited ? 'Yes' : 'No'],
                    ['Claimed Area', latestV.claimedArea ? `${latestV.claimedArea} acres` : '—'],
                    ['Verified Area', latestV.verifiedArea ? `${latestV.verifiedArea} acres` : '—'],
                    ['Findings', latestV.findings]].map(([l, v]) => (
                        <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                    ))}
                </div>
            )}

            {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-card">
                    <div className="form-section-title">Gram Sabha Resolution</div>
                    <div className="row g-3">
                        {!user?.authorityId && (
                            <div className="col-12">
                                <label className="form-label">Gram Sabha Authority</label>
                                <select className="form-select form-select-sm" value={form.authorityId} onChange={e => setForm({ ...form, authorityId: e.target.value })}>
                                    <option value="">Select...</option>
                                    {authorities.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="col-12">
                            <label className="form-label">Decision / Recommendation <span className="text-danger">*</span></label>
                            <div className="d-flex gap-2 flex-wrap">
                                {[['RECOMMENDED', 'Recommended'], ['NOT_RECOMMENDED', 'Not Recommended'], ['RETURNED', 'Returned']].map(([v, l]) => (
                                    <button type="button" key={v} onClick={() => setForm({ ...form, decision: v })}
                                        className={`btn btn-sm ${form.decision === v ? 'btn-primary' : 'btn-outline-secondary'}`}>{l}</button>
                                ))}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Resolution Number</label>
                            <input className="form-control form-control-sm" value={form.resolutionNumber}
                                onChange={e => setForm({ ...form, resolutionNumber: e.target.value })}
                                placeholder="e.g. GS/VLG/2024/001" />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Remarks <span className="text-danger">*</span></label>
                            <textarea rows={4} className="form-control form-control-sm" required value={form.remarks}
                                onChange={e => setForm({ ...form, remarks: e.target.value })}
                                placeholder="Record the Gram Sabha resolution details, voting outcome, and any special observations..." />
                        </div>
                    </div>
                </div>
                <div className="alert alert-info mt-2 py-2" style={{ fontSize: '0.82rem' }}>
                    If <strong>Recommended</strong>, claim will move to <strong>SDLC Review</strong>.
                    If <strong>Returned</strong>, claim goes back to Gram Sabha stage.
                </div>
                <div className="d-flex gap-2 mt-3">
                    <a href={`/claims/${id}`} className="btn btn-outline-secondary btn-sm">Cancel</a>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : '✓ Submit Resolution'}
                    </button>
                </div>
            </form>
        </div>
    )
}
