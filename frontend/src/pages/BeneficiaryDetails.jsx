import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function BeneficiaryDetails() {
    const { id } = useParams()
    const [beneficiary, setBeneficiary] = useState(null)
    const [claims, setClaims] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get(`/beneficiaries/${id}`),
            api.get(`/claims?beneficiaryId=${id}&limit=50`)
        ]).then(([b, c]) => {
            setBeneficiary(b.data)
            setClaims(c.data.claims)
        }).finally(() => setLoading(false))
    }, [id])

    if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary" /></div>
    if (!beneficiary) return <div className="alert alert-danger">Beneficiary not found</div>

    const b = beneficiary
    return (
        <div>
            <div className="page-header">
                <div>
                    <div style={{ fontSize: '0.78rem', color: '#888' }}><Link to="/beneficiaries">← Beneficiaries</Link></div>
                    <h2>{b.name}</h2>
                    <p><span className="badge-status badge-IFR">{b.category}</span> · {b.administrativeUnitId?.name}</p>
                </div>
            </div>

            <div className="row g-3">
                <div className="col-12 col-md-5">
                    <div className="section-card">
                        <h6>Personal Information</h6>
                        {[['Father/Mother', b.fatherOrMotherName], ['Gender', b.gender],
                        ['Date of Birth', b.dateOfBirth ? new Date(b.dateOfBirth).toLocaleDateString('en-IN') : '—'],
                        ['Category', b.category], ['Contact', b.contactNumber], ['Address', b.address],
                        ['Village', b.administrativeUnitId?.name]].map(([l, v]) => (
                            <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v || '—'}</span></div>
                        ))}
                    </div>
                </div>
                <div className="col-12 col-md-7">
                    <div className="section-card">
                        <h6>Associated Claims ({claims.length})</h6>
                        {claims.length === 0 ? (
                            <div className="text-muted" style={{ fontSize: '0.84rem' }}>No claims filed yet</div>
                        ) : claims.map(c => (
                            <div key={c._id} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                <div>
                                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.84rem' }}>{c.claimNumber}</span>
                                    <span className={`badge-status badge-${c.claimType} ms-2`} style={{ fontSize: '0.68rem' }}>{c.claimType}</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <span className={`badge-status badge-${c.overallStatus}`}>{c.overallStatus}</span>
                                    <Link to={`/claims/${c._id}`} className="btn btn-outline-primary btn-sm">View</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
