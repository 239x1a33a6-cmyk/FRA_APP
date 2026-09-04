import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const STAGES = ['GRAM_SABHA', 'FRC_VERIFICATION', 'GRAM_SABHA_DECISION', 'SDLC_REVIEW', 'DLC_REVIEW', 'COMPLETED']
const STAGE_LABELS = {
    GRAM_SABHA: 'Gram Sabha', FRC_VERIFICATION: 'FRC Verification',
    GRAM_SABHA_DECISION: 'Gram Sabha Decision', SDLC_REVIEW: 'SDLC Review',
    DLC_REVIEW: 'DLC Review', COMPLETED: 'Completed'
}

function WorkflowTimeline({ currentStage, overallStatus }) {
    const currentIdx = STAGES.indexOf(currentStage)
    return (
        <div className="workflow-timeline">
            {STAGES.map((stage, i) => {
                const isDone = i < currentIdx || (stage === 'COMPLETED' && overallStatus !== 'IN_PROCESS')
                const isActive = i === currentIdx && stage !== 'COMPLETED'
                const isLast = i === STAGES.length - 1
                let cls = isDone ? 'done' : isActive ? 'active' : 'pending'
                let icon = isDone ? '✓' : isActive ? '●' : '○'
                let sub = isDone ? 'Completed' : isActive ? 'Current Stage' : 'Pending'
                if (stage === 'COMPLETED' && overallStatus === 'APPROVED') { cls = 'done'; icon = '✓'; sub = 'Approved' }
                if (stage === 'COMPLETED' && overallStatus === 'REJECTED') { cls = 'done'; icon = '✗'; sub = 'Rejected' }

                return (
                    <div key={stage} className={`workflow-step ${cls}`}>
                        <div className={`step-icon ${cls}`}>{icon}</div>
                        <div className="step-content">
                            <div className={`step-label ${cls}`}>{STAGE_LABELS[stage]}</div>
                            <div className="step-sub">{sub}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default function ClaimDetails() {
    const { id } = useParams()
    const { user, isOfficer } = useAuth()
    const navigate = useNavigate()
    const [claim, setClaim] = useState(null)
    const [history, setHistory] = useState([])
    const [verifications, setVerifications] = useState([])
    const [decisions, setDecisions] = useState([])
    const [documents, setDocuments] = useState([])
    const [tab, setTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [forwarding, setForwarding] = useState(false)

    const load = () => {
        setLoading(true)
        Promise.all([
            api.get(`/claims/${id}`),
            api.get(`/claims/${id}/history`),
            api.get(`/claims/${id}/verifications`),
            api.get(`/claims/${id}/decisions`),
            api.get(`/claims/${id}/documents`)
        ]).then(([c, h, v, d, docs]) => {
            setClaim(c.data); setHistory(h.data); setVerifications(v.data)
            setDecisions(d.data); setDocuments(docs.data)
        }).finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [id])

    const forwardToFRC = async () => {
        if (!window.confirm('Forward this claim to FRC for physical verification?')) return
        setForwarding(true)
        try {
            await api.post(`/claims/${id}/forward`, { remarks: 'Forwarded to FRC for verification' })
            load()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed')
        } finally { setForwarding(false) }
    }

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>
    if (!claim) return <div className="alert alert-danger">Claim not found</div>

    const b = claim.beneficiaryId
    const au = claim.administrativeUnitId
    const authorityType = user?.authorityId?.type
    const canForward = claim.currentStage === 'GRAM_SABHA' && isOfficer()
    const canVerify = claim.currentStage === 'FRC_VERIFICATION' && (authorityType === 'FRC' || user?.role === 'ADMIN')
    const canGramSabha = claim.currentStage === 'GRAM_SABHA_DECISION' && (authorityType === 'GRAM_SABHA' || user?.role === 'ADMIN')
    const canSDLC = claim.currentStage === 'SDLC_REVIEW' && (authorityType === 'SDLC' || user?.role === 'ADMIN')
    const canDLC = claim.currentStage === 'DLC_REVIEW' && (authorityType === 'DLC' || user?.role === 'ADMIN')

    return (
        <div>
            <div className="page-header">
                <div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.25rem' }}>
                        <Link to="/claims">Claims</Link> / {claim.claimNumber}
                    </div>
                    <h2>{claim.claimNumber}</h2>
                    <p>
                        <span className={`badge-status badge-${claim.claimType} me-2`}>{claim.claimType}</span>
                        <span className={`badge-status badge-${claim.overallStatus}`}>{claim.overallStatus}</span>
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {canForward && <button className="btn btn-outline-primary btn-sm" onClick={forwardToFRC} disabled={forwarding}>→ Forward to FRC</button>}
                    {canVerify && <Link to={`/claims/${id}/frc-verify`} className="btn btn-primary btn-sm">🔍 Submit Verification</Link>}
                    {canGramSabha && <Link to={`/claims/${id}/gram-sabha`} className="btn btn-primary btn-sm">🏛️ Record Resolution</Link>}
                    {canSDLC && <Link to={`/claims/${id}/sdlc`} className="btn btn-primary btn-sm">📁 Record SDLC Review</Link>}
                    {canDLC && <Link to={`/claims/${id}/dlc`} className="btn btn-primary btn-sm">⚖️ Record DLC Decision</Link>}
                </div>
            </div>

            <div className="row g-3">
                {/* Left column — timeline */}
                <div className="col-12 col-md-3">
                    <div className="section-card">
                        <h6>Workflow Status</h6>
                        <WorkflowTimeline currentStage={claim.currentStage} overallStatus={claim.overallStatus} />
                    </div>
                </div>

                {/* Right column — tabs */}
                <div className="col-12 col-md-9">
                    <ul className="nav nav-tabs mb-3">
                        {['overview', 'details', 'verification', 'decisions', 'documents', 'history'].map(t => (
                            <li key={t} className="nav-item">
                                <button className={`nav-link ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {tab === 'overview' && (
                        <div className="row g-3">
                            <div className="col-12 col-lg-6">
                                <div className="section-card">
                                    <h6>Beneficiary</h6>
                                    {[['Name', b?.name], ['Father/Mother', b?.fatherOrMotherName], ['Gender', b?.gender], ['Category', b?.category], ['Contact', b?.contactNumber], ['Address', b?.address]].map(([l, v]) => (
                                        <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-12 col-lg-6">
                                <div className="section-card">
                                    <h6>Claim Info</h6>
                                    {[['Claim No.', claim.claimNumber], ['Type', claim.claimType], ['Location', au?.name], ['Stage', STAGE_LABELS[claim.currentStage]], ['Status', claim.overallStatus], ['Submitted By', claim.submittedBy?.name], ['Created', new Date(claim.createdAt).toLocaleDateString('en-IN')]].map(([l, v]) => (
                                        <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                                    ))}
                                </div>
                            </div>
                            {claim.remarks && <div className="col-12">
                                <div className="section-card"><h6>Remarks</h6><p style={{ margin: 0, fontSize: '0.84rem' }}>{claim.remarks}</p></div>
                            </div>}
                        </div>
                    )}

                    {tab === 'details' && (
                        <div className="section-card">
                            <h6>Claim Details ({claim.claimType})</h6>
                            {claim.claimType === 'IFR' && <>
                                {[['Land Area', claim.claimDetails?.landArea ? `${claim.claimDetails.landArea} acres` : '—'],
                                ['Land Purpose', claim.claimDetails?.landPurpose],
                                ['Disputed Land', claim.claimDetails?.disputedLand ? 'Yes' : 'No'],
                                ['Patta Details', claim.claimDetails?.pattaDetails],
                                ['Rehabilitation', claim.claimDetails?.rehabilitationDetails]].map(([l, v]) => (
                                    <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                                ))}
                            </>}
                            {claim.claimType === 'CR' && <>
                                {[['Nistar', claim.claimDetails?.nistar], ['Minor Forest Produce', claim.claimDetails?.minorForestProduce],
                                ['Water Bodies', claim.claimDetails?.waterBodies], ['Grazing', claim.claimDetails?.grazing],
                                ['Traditional Access', claim.claimDetails?.traditionalResourceAccess]].map(([l, v]) => (
                                    <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                                ))}
                            </>}
                            {claim.claimType === 'CFR' && <>
                                {[['Forest Resources', claim.claimDetails?.forestResourceDetails],
                                ['Community Area', claim.claimDetails?.communityForestArea ? `${claim.claimDetails.communityForestArea} acres` : '—'],
                                ['Biodiversity', claim.claimDetails?.biodiversityDetails],
                                ['Traditional Knowledge', claim.claimDetails?.traditionalKnowledge]].map(([l, v]) => (
                                    <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                                ))}
                            </>}
                            {claim.evidenceSummary && <div className="info-row"><span className="info-label">Evidence</span><span className="info-value">{claim.evidenceSummary}</span></div>}
                        </div>
                    )}

                    {tab === 'verification' && (
                        verifications.length === 0 ? <div className="empty-state"><span className="fs-1">🔍</span><p>No verifications yet</p></div>
                            : verifications.map(v => (
                                <div className="section-card mb-2" key={v._id}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <h6 className="mb-0">FRC Verification</h6>
                                        <span className={`badge-status badge-${v.verificationStatus}`}>{v.verificationStatus}</span>
                                    </div>
                                    {[['Verified By', v.verifiedBy?.name], ['Date', new Date(v.verificationDate).toLocaleDateString('en-IN')],
                                    ['Site Visited', v.siteVisited ? 'Yes' : 'No'], ['Land Verified', v.landVerified ? 'Yes' : 'No'],
                                    ['Claimed Area', v.claimedArea ? `${v.claimedArea} acres` : '—'],
                                    ['Verified Area', v.verifiedArea ? `${v.verifiedArea} acres` : '—'],
                                    ['Findings', v.findings], ['Remarks', v.remarks]].map(([l, val]) => (
                                        <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{val || '—'}</span></div>
                                    ))}
                                </div>
                            ))
                    )}

                    {tab === 'decisions' && (
                        decisions.length === 0 ? <div className="empty-state"><span className="fs-1">⚖️</span><p>No decisions recorded</p></div>
                            : decisions.map(d => (
                                <div className="section-card mb-2" key={d._id}>
                                    <div className="d-flex justify-content-between mb-2">
                                        <h6 className="mb-0">{d.decisionLevel} Decision</h6>
                                        <span className={`badge-status badge-${d.decision}`}>{d.decision}</span>
                                    </div>
                                    {[['Decided By', d.decidedBy?.name], ['Authority', d.authorityId?.name],
                                    ['Date', new Date(d.decisionDate).toLocaleDateString('en-IN')],
                                    ['Resolution No.', d.resolutionNumber], ['Remarks', d.remarks]].map(([l, val]) => (
                                        <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{val || '—'}</span></div>
                                    ))}
                                </div>
                            ))
                    )}

                    {tab === 'documents' && (
                        documents.length === 0 ? <div className="empty-state"><span className="fs-1">📄</span><p>No documents attached</p></div>
                            : <div className="section-card">
                                {documents.map(d => (
                                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom" key={d._id}>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '0.84rem' }}>{d.documentName}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{d.documentType} · Uploaded by {d.uploadedBy?.name}</div>
                                        </div>
                                        <a href={d.documentUrl} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm">📎 View</a>
                                    </div>
                                ))}
                            </div>
                    )}

                    {tab === 'history' && (
                        <div className="section-card">
                            <h6>Claim History</h6>
                            {history.length === 0 ? <p className="text-muted" style={{ fontSize: '0.84rem' }}>No history</p>
                                : history.map((h, i) => (
                                    <div key={h._id} className="d-flex gap-3 py-2" style={{ borderBottom: i < history.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                        <div style={{ width: 90, fontSize: '0.72rem', color: '#888', flexShrink: 0 }}>
                                            {new Date(h.createdAt).toLocaleDateString('en-IN')}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{h.action?.replace(/_/g, ' ')}</div>
                                            <div style={{ fontSize: '0.76rem', color: '#888' }}>
                                                {h.fromStage} → {h.toStage} · {h.performedBy?.name}
                                            </div>
                                            {h.remarks && <div style={{ fontSize: '0.76rem', color: '#666', marginTop: '0.2rem' }}>{h.remarks}</div>}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
