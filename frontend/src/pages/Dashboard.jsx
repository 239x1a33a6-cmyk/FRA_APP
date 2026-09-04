import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const STAGE_LABELS = {
    GRAM_SABHA: 'Gram Sabha',
    FRC_VERIFICATION: 'FRC Verification',
    GRAM_SABHA_DECISION: 'Gram Sabha Decision',
    SDLC_REVIEW: 'SDLC Review',
    DLC_REVIEW: 'DLC Review',
    COMPLETED: 'Completed'
}

export default function Dashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [recent, setRecent] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/claims/stats'),
            api.get('/claims?limit=8')
        ]).then(([statsRes, claimsRes]) => {
            setStats(statsRes.data)
            setRecent(claimsRes.data.claims)
        }).finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>

    const s = stats?.byStage || {}
    const st = stats?.byStatus || {}

    const cards = [
        { label: 'Total Claims', value: stats?.total || 0, icon: 'ALL', color: '#e8f0f9', iconColor: '#1e5c9b' },
        { label: 'FRC Pending', value: s.FRC_VERIFICATION || 0, icon: 'FRC', color: '#fff3e0', iconColor: '#e65100' },
        { label: 'Gram Sabha', value: (s.GRAM_SABHA || 0) + (s.GRAM_SABHA_DECISION || 0), icon: 'GS', color: '#e8eaf6', iconColor: '#3949ab' },
        { label: 'SDLC Review', value: s.SDLC_REVIEW || 0, icon: 'SDL', color: '#f3e5f5', iconColor: '#6a1b9a' },
        { label: 'DLC Review', value: s.DLC_REVIEW || 0, icon: 'DLC', color: '#e0f2f1', iconColor: '#00695c' },
        { label: 'Approved', value: st.APPROVED || 0, icon: 'APR', color: '#e8f5e9', iconColor: '#2e7d32' },
        { label: 'Rejected', value: st.REJECTED || 0, icon: 'REJ', color: '#ffebee', iconColor: '#c62828' },
        { label: 'Returned', value: st.RETURNED || 0, icon: 'RET', color: '#fce4ec', iconColor: '#880e4f' }
    ]

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <p>Welcome back, {user?.name}. Here's the current status of FRA claims.</p>
                </div>
                <Link to="/claims/new" className="btn btn-primary btn-sm">+ New Claim</Link>
            </div>

            {/* Stat Cards */}
            <div className="row g-3 mb-4">
                {cards.map(card => (
                    <div className="col-6 col-md-4 col-lg-3" key={card.label}>
                        <div className="stat-card">
                            <div className="stat-card-icon" style={{ background: card.color }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', color: card.iconColor }}>{card.icon}</span>
                            </div>
                            <div>
                                <div className="stat-card-value">{card.value.toLocaleString()}</div>
                                <div className="stat-card-label">{card.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Claim Type Breakdown */}
            <div className="row g-3 mb-4">
                {[['IFR', 'Individual Forest Rights (Form A)'], ['CR', 'Community Rights (Form B)'], ['CFR', 'Community Forest Resource (Form C)']].map(([type, label]) => (
                    <div className="col-12 col-md-4" key={type}>
                        <div className="section-card p-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <span className={`badge-status badge-${type}`}>{type}</span>
                                    <div style={{ fontSize: '0.76rem', color: '#888', marginTop: '0.3rem' }}>{label}</div>
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>{stats?.byType?.[type] || 0}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Claims */}
            <div className="table-wrapper">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h6 className="mb-0" style={{ fontSize: '0.86rem', fontWeight: 600 }}>Recent Claims</h6>
                    <Link to="/claims" className="btn btn-outline-primary btn-sm">View All</Link>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Claim No.</th>
                                <th>Beneficiary</th>
                                <th>Type</th>
                                <th>Location</th>
                                <th>Stage</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-muted py-4">No claims found</td></tr>
                            ) : recent.map(c => (
                                <tr key={c._id}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.claimNumber}</span></td>
                                    <td>{c.beneficiaryId?.name || '—'}</td>
                                    <td><span className={`badge-status badge-${c.claimType}`}>{c.claimType}</span></td>
                                    <td style={{ fontSize: '0.78rem' }}>{c.administrativeUnitId?.name || '—'}</td>
                                    <td><span className={`badge-status badge-${c.currentStage}`}>{STAGE_LABELS[c.currentStage] || c.currentStage}</span></td>
                                    <td><span className={`badge-status badge-${c.overallStatus}`}>{c.overallStatus}</span></td>
                                    <td><Link to={`/claims/${c._id}`} className="btn btn-outline-primary btn-sm">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
