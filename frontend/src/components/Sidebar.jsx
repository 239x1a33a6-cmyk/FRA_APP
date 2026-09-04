import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Icon = ({ ch }) => <span className="icon">{ch}</span>

export default function Sidebar() {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const authorityType = user?.authorityId?.type

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h6>Government of India</h6>
                <h5>🌿 FRA Atlas</h5>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Main</div>
                <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Icon ch="📊" /> Dashboard
                </NavLink>
                <NavLink to="/claims" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Icon ch="📋" /> Claims
                </NavLink>
                <NavLink to="/beneficiaries" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <Icon ch="👥" /> Beneficiaries
                </NavLink>

                {/* FRC specific */}
                {(authorityType === 'FRC' || isAdmin()) && (
                    <>
                        <div className="sidebar-section-title">FRC</div>
                        <NavLink to="/claims?stage=FRC_VERIFICATION" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="🔍" /> FRC Verifications
                        </NavLink>
                    </>
                )}

                {/* Gram Sabha specific */}
                {(authorityType === 'GRAM_SABHA' || isAdmin()) && (
                    <>
                        <div className="sidebar-section-title">Gram Sabha</div>
                        <NavLink to="/claims?stage=GRAM_SABHA_DECISION" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="🏛️" /> Gram Sabha Resolutions
                        </NavLink>
                    </>
                )}

                {/* SDLC specific */}
                {(authorityType === 'SDLC' || isAdmin()) && (
                    <>
                        <div className="sidebar-section-title">SDLC</div>
                        <NavLink to="/claims?stage=SDLC_REVIEW" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="📁" /> SDLC Review
                        </NavLink>
                    </>
                )}

                {/* DLC specific */}
                {(authorityType === 'DLC' || isAdmin()) && (
                    <>
                        <div className="sidebar-section-title">DLC</div>
                        <NavLink to="/claims?stage=DLC_REVIEW" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="⚖️" /> DLC Decisions
                        </NavLink>
                    </>
                )}

                {/* Admin only */}
                {isAdmin() && (
                    <>
                        <div className="sidebar-section-title">Administration</div>
                        <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="👤" /> Users
                        </NavLink>
                        <NavLink to="/authorities" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="🏢" /> Authorities
                        </NavLink>
                        <NavLink to="/administrative-units" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="📍" /> Admin Units
                        </NavLink>
                        <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                            <Icon ch="📝" /> Audit Logs
                        </NavLink>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">{initials}</div>
                    <div className="user-details">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{user?.role} {user?.authorityId ? `· ${user.authorityId.type}` : ''}</div>
                    </div>
                </div>
                <NavLink to="/profile" className="sidebar-link" style={{ padding: '0.3rem 0' }}>
                    <Icon ch="⚙️" /> Profile
                </NavLink>
                <button onClick={handleLogout} className="sidebar-link w-100 text-start border-0 bg-transparent" style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                    <Icon ch="🚪" /> Logout
                </button>
            </div>
        </aside>
    )
}
