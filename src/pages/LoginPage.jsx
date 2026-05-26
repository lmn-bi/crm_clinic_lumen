import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingClinic, setValidatingClinic] = useState(false)
  
  const { login, logout, perfil } = useAuth()
  const navigate = useNavigate()

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)
    setValidatingClinic(true)

    try {
      const { user } = await login(email, password)
      
      // Validar clínica post-login
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('clinicas(nombre)')
        .eq('id', user.id)
        .single()

      if (perfilError || !perfilData) {
        await logout()
        throw new Error('No se pudo verificar la clínica asignada al usuario.')
      }

      const dbClinicName = perfilData.clinicas?.nombre || ''
      const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
      
      if (normalize(dbClinicName) !== normalize(clinicName)) {
        await logout()
        throw new Error('Credenciales o nombre de clínica incorrectos.')
      }

      // Si es válido, permitimos la redirección
      setValidatingClinic(false)
    } catch (error) {
      console.error('Error en el login:', error)
      setErrorMsg(`Error: ${error.message || 'Credenciales incorrectas o error en el servidor.'}`)
      setValidatingClinic(false)
    } finally {
      setLoading(false)
    }
  }

  // Redirigir si ya está autenticado
  React.useEffect(() => {
    if (perfil && !validatingClinic) {
      if (perfil.rol === 'admin') {
        navigate('/')
      } else if (perfil.rol === 'doctor') {
        navigate('/calendario')
      }
    }
  }, [perfil, navigate, validatingClinic])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
            Clínica CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa con tus credenciales
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="text-danger text-sm text-center bg-red-50 p-2 rounded">
              {errorMsg}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="clinic-name" className="sr-only">
                Nombre de la Clínica
              </label>
              <input
                id="clinic-name"
                name="clinicName"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Nombre de la Clínica"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/reset-password" className="font-medium text-primary hover:text-blue-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
