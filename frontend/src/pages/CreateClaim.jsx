import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function CreateClaim() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [beneficiaries, setBeneficiaries] = useState([])
    const [units, setUnits] = useState([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [bSearch, setBSearch] = useState('')

    const [form, setForm] = useState({
        beneficiaryId: '', claimType: 'IFR', administrativeUnitId: '',
        evidenceSummary: '', remarks: '',
        claimDetails: {
            // IFR
            landArea: '', landPurpose: '', disputedLand: false, pattaDetails: '', rehabilitationDetails: '',
            // CR
            nistar: '', minorForestProduce: '', waterBodies: '', grazing: '', traditionalResourceAccess: '',
            // CFR
            forestResourceDetails: '', communityForestArea: '', biodiversityDetails: '', traditionalKnowledge: ''
        }
    })

    useEffect(() => {
        api.get('/beneficiaries?limit=100').then(r => setBeneficiaries(r.data.beneficiaries))
        api.get('/administrative-units?type=VILLAGE').then(r => setUnits(r.data))
    }, [])

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
    const setDetail = (field, val) => setForm(f => ({ ...f, claimDetails: { ...f.claimDetails, [field]: val } }))

    const filteredB = beneficiaries.filter(b => b.name.toLowerCase().includes(bSearch.toLowerCase()))

    const submit = async () => {
        setError('')
        if (!form.beneficiaryId) return setError('Please select a beneficiary')
        if (!form.administrativeUnitId) return setError('Please select a village/location')
        setLoading(true)
        try {
            const res = await api.post('/claims', form)
            navigate(`/claims/${res.data._id}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create claim')
            setStep(1)
        } finally {
            setLoading(false)
        }
    }

    const steps = ['Beneficiary', 'Claim Type', 'Details', 'Location', 'Review']

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>New FRA Claim</h2>
                    <p>Submit a new Forest Rights Act claim</p>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="d-flex align-items-center mb-4" style={{ gap: '0.5rem', overflowX: 'auto' }}>
                {steps.map((s, i) => (
                    <div key={s} className="d-flex align-items-center gap-1">
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: i + 1 < step ? '#2e7d32' : i + 1 === step ? '#1e5c9b' : '#e0e0e0',
                            color: i + 1 <= step ? '#fff' : '#999', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0
                        }}>{i + 1 < step ? '✓' : i + 1}</div>
                        <span style={{ fontSize: '0.78rem', fontWeight: i + 1 === step ? 600 : 400, color: i + 1 === step ? '#1e5c9b' : '#888', whiteSpace: 'nowrap' }}>{s}</span>
                        {i < steps.length - 1 && <div style={{ width: 24, height: 1, background: '#ddd', flexShrink: 0 }} />}
                    </div>
                ))}
            </div>

            {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.82rem' }}>{error}</div>}

            <div className="form-card">
                {/* Step 1: Beneficiary */}
                {step === 1 && (
                    <div>
                        <div className="form-section-title">Select Beneficiary / Claimant</div>
                        <input className="form-control form-control-sm mb-3" placeholder="Search beneficiary by name..."
                            value={bSearch} onChange={e => setBSearch(e.target.value)} />
                        <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 6 }}>
                            {filteredB.map(b => (
                                <div key={b._id} className="d-flex align-items-center gap-2 p-2"
                                    style={{ cursor: 'pointer', background: form.beneficiaryId === b._id ? '#e8f0f9' : 'transparent', borderBottom: '1px solid #f5f5f5' }}
                                    onClick={() => set('beneficiaryId', b._id)}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: form.beneficiaryId === b._id ? '#1e5c9b' : '#ddd', flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{b.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: '#888' }}>{b.category} · {b.administrativeUnitId?.name}</div>
                                    </div>
                                </div>
                            ))}
                            {filteredB.length === 0 && <div className="text-center text-muted py-3" style={{ fontSize: '0.82rem' }}>No beneficiaries found</div>}
                        </div>
                    </div>
                )}

                {/* Step 2: Claim Type */}
                {step === 2 && (
                    <div>
                        <div className="form-section-title">Select Claim Type</div>
                        <div className="row g-3">
                            {[
                                { type: 'IFR', title: 'Individual Forest Rights', desc: 'Rights of individual/families to cultivate/occupy forest land', icon: '🌾' },
                                { type: 'CR', title: 'Community Rights', desc: 'Nistar, minor forest produce, water bodies, grazing rights', icon: '🏘️' },
                                { type: 'CFR', title: 'Community Forest Resource', desc: 'Rights of communities to conserve and manage forest areas', icon: '🌳' }
                            ].map(({ type, title, desc, icon }) => (
                                <div className="col-12 col-md-4" key={type}>
                                    <div onClick={() => set('claimType', type)} style={{
                                        border: `2px solid ${form.claimType === type ? '#1e5c9b' : '#dee2e6'}`,
                                        borderRadius: 8, padding: '1.25rem', cursor: 'pointer',
                                        background: form.claimType === type ? '#e8f0f9' : '#fff'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{type}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: '0.4rem' }}>{title}</div>
                                        <div style={{ fontSize: '0.76rem', color: '#888' }}>{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <div>
                        <div className="form-section-title">{form.claimType} — Claim Information</div>
                        {form.claimType === 'IFR' && (
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Land Area (acres)</label>
                                    <input type="number" step="0.01" className="form-control form-control-sm" value={form.claimDetails.landArea}
                                        onChange={e => setDetail('landArea', e.target.value)} />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Land Purpose</label>
                                    <input className="form-control form-control-sm" value={form.claimDetails.landPurpose}
                                        onChange={e => setDetail('landPurpose', e.target.value)} placeholder="e.g. Agriculture - Paddy" />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Disputed Land?</label>
                                    <select className="form-select form-select-sm" value={form.claimDetails.disputedLand}
                                        onChange={e => setDetail('disputedLand', e.target.value === 'true')}>
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Patta Details</label>
                                    <input className="form-control form-control-sm" value={form.claimDetails.pattaDetails}
                                        onChange={e => setDetail('pattaDetails', e.target.value)} />
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Rehabilitation Details</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.rehabilitationDetails}
                                        onChange={e => setDetail('rehabilitationDetails', e.target.value)} />
                                </div>
                            </div>
                        )}
                        {form.claimType === 'CR' && (
                            <div className="row g-3">
                                <div className="col-12"><label className="form-label">Nistar Rights</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.nistar} onChange={e => setDetail('nistar', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Minor Forest Produce</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.minorForestProduce} onChange={e => setDetail('minorForestProduce', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Water Bodies</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.waterBodies} onChange={e => setDetail('waterBodies', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Grazing</label>
                                    <input className="form-control form-control-sm" value={form.claimDetails.grazing} onChange={e => setDetail('grazing', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Traditional Resource Access</label>
                                    <input className="form-control form-control-sm" value={form.claimDetails.traditionalResourceAccess} onChange={e => setDetail('traditionalResourceAccess', e.target.value)} /></div>
                            </div>
                        )}
                        {form.claimType === 'CFR' && (
                            <div className="row g-3">
                                <div className="col-12"><label className="form-label">Forest Resource Details</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.forestResourceDetails} onChange={e => setDetail('forestResourceDetails', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Community Forest Area (acres)</label>
                                    <input type="number" step="0.01" className="form-control form-control-sm" value={form.claimDetails.communityForestArea} onChange={e => setDetail('communityForestArea', e.target.value)} /></div>
                                <div className="col-md-6"><label className="form-label">Biodiversity Details</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.biodiversityDetails} onChange={e => setDetail('biodiversityDetails', e.target.value)} /></div>
                                <div className="col-12"><label className="form-label">Traditional Knowledge</label>
                                    <textarea rows={2} className="form-control form-control-sm" value={form.claimDetails.traditionalKnowledge} onChange={e => setDetail('traditionalKnowledge', e.target.value)} /></div>
                            </div>
                        )}
                        <div className="mt-3">
                            <label className="form-label">Evidence Summary</label>
                            <textarea rows={3} className="form-control form-control-sm" value={form.evidenceSummary}
                                onChange={e => set('evidenceSummary', e.target.value)}
                                placeholder="Describe supporting documents, witnesses, history of occupation..." />
                        </div>
                    </div>
                )}

                {/* Step 4: Location */}
                {step === 4 && (
                    <div>
                        <div className="form-section-title">Administrative Location</div>
                        <label className="form-label">Village / Gram Panchayat</label>
                        <select className="form-select form-select-sm mb-3" value={form.administrativeUnitId}
                            onChange={e => set('administrativeUnitId', e.target.value)}>
                            <option value="">Select a village...</option>
                            {units.map(u => <option key={u._id} value={u._id}>{u.name} ({u.type})</option>)}
                        </select>
                        <label className="form-label">Remarks (optional)</label>
                        <textarea rows={3} className="form-control form-control-sm" value={form.remarks}
                            onChange={e => set('remarks', e.target.value)} />
                    </div>
                )}

                {/* Step 5: Review */}
                {step === 5 && (
                    <div>
                        <div className="form-section-title">Review & Submit</div>
                        {[
                            ['Beneficiary', beneficiaries.find(b => b._id === form.beneficiaryId)?.name || '—'],
                            ['Claim Type', form.claimType],
                            ['Location', units.find(u => u._id === form.administrativeUnitId)?.name || '—'],
                            ['Evidence', form.evidenceSummary || '—']
                        ].map(([l, v]) => (
                            <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-value">{v}</span></div>
                        ))}
                        <div className="alert alert-info mt-3 py-2" style={{ fontSize: '0.82rem' }}>
                            After submission, this claim will be assigned to the <strong>Gram Sabha</strong> for initial review, then forwarded to FRC for physical verification.
                        </div>
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-between mt-3">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/claims')} disabled={loading}>
                    {step === 1 ? 'Cancel' : '← Back'}
                </button>
                {step < 5 ? (
                    <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}>Next →</button>
                ) : (
                    <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading}>
                        {loading ? <><span className="spinner-border spinner-border-sm me-2" />Submitting...</> : '✓ Submit Claim'}
                    </button>
                )}
            </div>
        </div>
    )
}
