import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AuditLogs() {
    const [logs, setLogs] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)

    const fetch = (p = page) => {
        setLoading(true)
        api.get('/audit-logs', { params: { page: p, limit: 30 } })
            .then(r => { setLogs(r.data.logs); setTotal(r.data.total) })
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetch(page) }, [page])

    const pages = Math.ceil(total / 30)
    const actionColors = { LOGIN: '#0277bd', REGISTER: '#2e7d32', CREATE: '#2e7d32', UPDATE: '#e65100', DELETE: '#c62828' }

    return (
        <div>
            <div className="page-header">
                <div><h2>Audit Logs</h2><p>System activity log — all user actions are recorded.</p></div>
                <span style={{ fontSize: '0.82rem', color: '#888' }}>{total.toLocaleString()} entries</span>
            </div>

            <div className="table-wrapper">
                <div className="table-responsive">
                    <table className="table">
                        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Description</th></tr></thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary" /></td></tr>
                            ) : logs.map(log => (
                                <tr key={log._id}>
                                    <td style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                                        {new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '0.82rem' }}>{log.userId?.name || '—'}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{log.userId?.role}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: actionColors[log.action] || '#333', background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem' }}>{log.entityType}</td>
                                    <td style={{ fontSize: '0.78rem', color: '#555' }}>{log.description}</td>
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
        </div>
    )
}
