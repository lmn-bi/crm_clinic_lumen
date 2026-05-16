import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PacientesPage from './pages/PacientesPage'
import CalendarioPage from './pages/CalendarioPage'
import DoctoresPage from './pages/DoctoresPage'
import PresupuestosPage from './pages/PresupuestosPage'

import MainLayout from './components/layout/MainLayout'

// Componente para proteger rutas según autenticación y rol
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, perfil, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!user) {
    // Si no está autenticado, ir a login
    return <Navigate to="/login" replace />
  }

  if (perfil && !allowedRoles.includes(perfil.rol)) {
    // Si está autenticado pero no tiene el rol necesario
    return <Navigate to="/calendario" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas con Layout Principal */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/pacientes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PacientesPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/calendario"
          element={
            <ProtectedRoute allowedRoles={['admin', 'doctor']}>
              <CalendarioPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/doctores"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DoctoresPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/presupuestos"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PresupuestosPage />
            </ProtectedRoute>
          }
        />
      </Route>
      
      {/* Ruta por defecto para capturar 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
