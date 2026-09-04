import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Claims from './pages/Claims'
import ClaimDetails from './pages/ClaimDetails'
import CreateClaim from './pages/CreateClaim'
import Beneficiaries from './pages/Beneficiaries'
import BeneficiaryDetails from './pages/BeneficiaryDetails'
import FRCVerification from './pages/FRCVerification'
import GramSabhaDecision from './pages/GramSabhaDecision'
import SDLCReview from './pages/SDLCReview'
import DLCDecision from './pages/DLCDecision'
import Users from './pages/Users'
import Authorities from './pages/Authorities'
import AdministrativeUnits from './pages/AdministrativeUnits'
import AuditLogs from './pages/AuditLogs'
import Profile from './pages/Profile'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="claims" element={<Claims />} />
        <Route path="claims/new" element={<CreateClaim />} />
        <Route path="claims/:id" element={<ClaimDetails />} />
        <Route path="claims/:id/frc-verify" element={<FRCVerification />} />
        <Route path="claims/:id/gram-sabha" element={<GramSabhaDecision />} />
        <Route path="claims/:id/sdlc" element={<SDLCReview />} />
        <Route path="claims/:id/dlc" element={<DLCDecision />} />
        <Route path="beneficiaries" element={<Beneficiaries />} />
        <Route path="beneficiaries/:id" element={<BeneficiaryDetails />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="authorities" element={<AdminRoute><Authorities /></AdminRoute>} />
        <Route path="administrative-units" element={<AdminRoute><AdministrativeUnits /></AdminRoute>} />
        <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
