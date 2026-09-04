import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const STAGE_LABELS = {
    GRAM_SABHA: 'Gram Sabha', FRC_VERIFICATION: 'FRC Verification',
    GRAM_SABHA_DECISION: 'Gram Sabha Decision', SDLC_REVIEW: 'SDLC Review',
    DLC_REVIEW: 'DLC Review', COMPLETED: 'Completed'
}

// Map authority type → default stage filter
const AUTHORITY_DEFAULT_STAGE = {
    FRC: 'FRC_VERIFICATION',
    GRAM_SABHA: 'GRAM_SABHA_DECISION',
    SDLC: 'SDLC_REVIEW',
    DLC: 'DLC_REVIEW'
}

export default function Claims() {
    const { user, isOfficer } = useAuth()
    const [searchParams] = useSearchParams()
    const authorityType = user?.authorityId?.type

    // Default stage from URL param → or authority's natural stage → or empty
    const defaultStage = searchParams.get('stage') || AUTHORITY_DEFAULT_STAGE[authorityType] || ''

    const [claims, setClaims] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        claimType: searchParams.get('claimType') || '',
        currentStage: defaultStage,
        overallStatus: searchParams.get('status') || ''
    })

    const fetchClaims = (f, p = 1) => {
        setLoading(true)
        const params = { page: p, limit: 15 }
        if (f.search) params.search = f.search
        if (f.claimType) params.claimType = f.claimType
        if (f.currentStage) params.currentStage = f.currentStage
        if (f.overallStatus) params.overallStatus = f.overallStatus

        api.get('/claims', { params })
            .then(res => { setClaims(res.data.claims); setTotal(res.data.total) })
            .finally(() => setLoading(false))
    }

    // Fetch on mount and whenever page or filters change
    useEffect(() => { fetchClaims(filters, page) }, [page])

    const applyFilters = (e) => {
        e.preventDefault()
        setPage(1)
        fetchClaims(filters, 1)
    }

    const clearFilters = () => {
        const reset = { search: '', claimType: '', currentStage: '', overallStatus: '' }
        setFilters(reset)
        setPage(1)
        fetchClaims(reset, 1)
    }

    const pages = Math.ceil(total / 15)

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Claims</h2>
                    <p>
                        {authorityType
                            ? `Showing claims at ${STAGE_LABELS[AUTHORITY_DEFAULT_STAGE[authorityType]] || 'all stages'} by default`
                            : 'Manage and track Forest Rights Act claims.'}
                    </p>
                </div>
                {isOfficer() && <Link to="/claims/new" className="btn btn-primary btn-sm">+ New Claim</Link>}
            </div>

            {/* Filters */}
            <div className="form-card mb-3">
                <form onSubmit={applyFilters}>
                    <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-3">
                            <label className="form-label">Search</label>
                            <input className="form-control form-control-sm" placeholder="Claim number or name..."
                                value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Claim Type</label>
                            <select className="form-select form-select-sm" value={filters.claimType}
                                onChange={e => setFilters({ ...filters, claimType: e.target.value })}>
                                <option value="">All Types</option>
                                <option value="IFR">IFR (Form A)</option>
                                <option value="CR">CR (Form B)</option>
                                <option value="CFR">CFR (Form C)</option>
                            </select>
                        </div>
                        <div className="col-6 col-md-3">
                            <label className="form-label">
                                Stage
                                {authorityType && AUTHORITY_DEFAULT_STAGE[authorityType] && (
                                    <span style={{ fontSize: '0.68rem', color: '#888', marginLeft: '0.4rem' }}>
                                        (your level highlighted)
                                    </span>
                                )}
                            </label>
                            <select className="form-select form-select-sm" value={filters.currentStage}
                                onChange={e => setFilters({ ...filters, currentStage: e.target.value })}>
                                <option value="">All Stages</option>
                                {Object.entries(STAGE_LABELS).map(([v, l]) => (
                                    <option key={v} value={v}
                                        style={{ fontWeight: AUTHORITY_DEFAULT_STAGE[authorityType] === v ? 700 : 400 }}>
                                        {l}{AUTHORITY_DEFAULT_STAGE[authorityType] === v ? ' ← Your Level' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-6 col-md-2">
                            <label className="form-label">Status</label>
                            <select className="form-select form-select-sm" value={filters.overallStatus}
                                onChange={e => setFilters({ ...filters, overallStatus: e.target.value })}>
                                <option value="">All</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="IN_PROCESS">In Process</option>
                                <option value="RETURNED">Returned</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <div className="col-6 col-md-2 d-flex gap-2">
                            <button type="submit" className="btn btn-primary btn-sm flex-fill">Filter</button>
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>Clear</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <span style={{ fontSize: '0.82rem', color: '#888' }}>
                        {total} claim{total !== 1 ? 's' : ''} found
                        {filters.currentStage && <span> — filtered by <strong>{STAGE_LABELS[filters.currentStage]}</strong></span>}
                    </span>
                </div>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Claim No.</th>
                                <th>Beneficiary</th>
                                <th>Type</th>
                                <th>Village</th>
                                <th>Current Stage</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : claims.length === 0 ? (
                                <tr><td colSpan={8}>
                                    <div className="empty-state">
                                        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>—</span>
                                        <p>No claims found for selected filters</p>
                                        <button className="btn btn-outline-secondary btn-sm mt-2" onClick={clearFilters}>Clear Filters</button>
                                    </div>
                                </td></tr>
                            ) : claims.map(c => (
                                <tr key={c._id}>
                                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.claimNumber}</span></td>
                                    <td>
                                        <div>{c.beneficiaryId?.name || '—'}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#888' }}>{c.beneficiaryId?.category}</div>
                                    </td>
                                    <td><span className={`badge-status badge-${c.claimType}`}>{c.claimType}</span></td>
                                    <td style={{ fontSize: '0.78rem' }}>{c.administrativeUnitId?.name || '—'}</td>
                                    <td>
                                        <span className={`badge-status badge-${c.currentStage}`}
                                            style={{ fontWeight: AUTHORITY_DEFAULT_STAGE[authorityType] === c.currentStage ? 700 : 400 }}>
                                            {STAGE_LABELS[c.currentStage]}
                                        </span>
                                    </td>
                                    <td><span className={`badge-status badge-${c.overallStatus}`}>{c.overallStatus}</span></td>
                                    <td style={{ fontSize: '0.78rem', color: '#888' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td><Link to={`/claims/${c._id}`} className="btn btn-outline-primary btn-sm">View</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="d-flex justify-content-center gap-1 p-3">
                        <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button className="btn btn-outline-secondary btn-sm" disabled={page === pages} onClick={() => setPage(p => p + 1)}>›</button>
                    </div>
                )}
            </div>
        </div>
    )
}
