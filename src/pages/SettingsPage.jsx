import React, { useState, useEffect } from 'react'
import { Settings, Clock, Stethoscope, Users, Save, CheckCircle, Activity, Mic, Plus, Trash2, Power } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Moon, Sun } from 'lucide-react'

const TimeInput = ({ value, onChange }) => {
  const [hours, mins] = value ? value.split(':') : ['08', '00']
  
  const handleHourChange = (e) => {
    let newH = e.target.value
    if (newH === '') {
      onChange(`00:${mins}`)
      return
    }
    let num = parseInt(newH, 10)
    if (isNaN(num)) num = 0
    if (num < 0) num = 0
    if (num > 23) num = 23
    const strH = num.toString().padStart(2, '0')
    onChange(`${strH}:${mins}`)
  }
  
  const handleMinChange = (e) => {
    onChange(`${hours}:${e.target.value}`)
  }

  return (
    <div className="flex items-center gap-1">
      <input 
        type="number" 
        min="0" max="23" 
        value={hours} 
        onChange={handleHourChange}
        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-center focus:ring-blue-500 focus:border-blue-500"
      />
      <span className="font-bold text-gray-500 dark:text-gray-400">:</span>
      <select 
        value={mins} 
        onChange={handleMinChange}
        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 appearance-none text-center cursor-pointer"
      >
        <option value="00">00</option>
        <option value="15">15</option>
        <option value="30">30</option>
        <option value="45">45</option>
      </select>
    </div>
  )
}

export default function SettingsPage() {
  const { perfil, session, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' })
  
  // Estados para Generales
  const [generalConfig, setGeneralConfig] = useState({
    nombre_clinica: '',
    hora_apertura: '08:00',
    hora_cierre: '21:00',
    asistente_voz_activo: false,
    duracion_cita_defecto: 30
  })

  // Estados para Usuarios
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    especialidad: '',
    rol: 'doctor'
  })

  // Estados para Tratamientos
  const [tratamientos, setTratamientos] = useState([])
  const [nuevoTratamiento, setNuevoTratamiento] = useState({
    nombre: '',
    duracion_min: 30
  })

  useEffect(() => {
    if (perfil?.clinica_id) {
      fetchGeneralConfig()
      fetchTratamientos()
    }
  }, [perfil])

  const fetchGeneralConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', perfil.clinica_id)
        .single()
      
      if (error) throw error
      if (data) {
        setGeneralConfig({
          nombre_clinica: data.nombre || '',
          hora_apertura: data.hora_apertura ? data.hora_apertura.substring(0,5) : '08:00',
          hora_cierre: data.hora_cierre ? data.hora_cierre.substring(0,5) : '21:00',
          asistente_voz_activo: data.asistente_voz_activo || false,
          duracion_cita_defecto: data.duracion_cita_defecto || 30
        })
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }

  const fetchTratamientos = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_tratamiento')
        .select('*')
        .eq('clinica_id', perfil.clinica_id)
        .order('nombre')
      
      if (error) throw error
      setTratamientos(data || [])
    } catch (error) {
      console.error('Error cargando tratamientos:', error)
    }
  }

  const handleSaveGeneral = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaveMessage({ type: '', text: '' })
    
    try {
      const { data, error } = await supabase
        .from('clinicas')
        .update({
          nombre: generalConfig.nombre_clinica,
          hora_apertura: generalConfig.hora_apertura,
          hora_cierre: generalConfig.hora_cierre,
          asistente_voz_activo: generalConfig.asistente_voz_activo,
          duracion_cita_defecto: generalConfig.duracion_cita_defecto
        })
        .eq('id', perfil.clinica_id)
        .select()
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('No se pudo actualizar la clínica. Es posible que te falten permisos de administrador en la base de datos (RLS).')
      }
      
      await refreshProfile()
      setSaveMessage({ type: 'success', text: 'Configuración guardada correctamente.' })
    } catch (error) {
      console.error(error)
      setSaveMessage({ type: 'error', text: 'Error al guardar configuración.' })
    } finally {
      setLoading(false)
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSaveMessage({ type: '', text: '' })
    
    try {
      // 1. Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          rol: newUser.rol,
          nombre: newUser.nombre,
          apellidos: newUser.apellidos,
          especialidad: newUser.especialidad
        }
      })
      
      if (error) throw new Error(error.message || 'Error del servidor')
      if (data?.error) throw new Error(data.error)
      
      setSaveMessage({ type: 'success', text: `Usuario ${newUser.nombre} creado correctamente.` })
      setNewUser({ email: '', password: '', nombre: '', apellidos: '', especialidad: '', rol: 'doctor' })
    } catch (error) {
      console.error("Error creating user:", error)
      setSaveMessage({ type: 'error', text: error.message || 'Error al crear usuario.' })
    } finally {
      setLoading(false)
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleCreateTratamiento = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('tipos_tratamiento')
        .insert([{
          nombre: nuevoTratamiento.nombre,
          duracion_min: parseInt(nuevoTratamiento.duracion_min, 10),
          clinica_id: perfil.clinica_id,
          activo: true
        }])
        .select()
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('No se pudo insertar el tratamiento. Revisa los permisos de la base de datos (RLS).')
      }
      
      setSaveMessage({ type: 'success', text: 'Tratamiento añadido correctamente.' })
      setNuevoTratamiento({ nombre: '', duracion_min: 30 })
      fetchTratamientos()
    } catch (error) {
      console.error(error)
      setSaveMessage({ type: 'error', text: `Error: ${error?.message || 'Error al añadir tratamiento'}` })
    } finally {
      setLoading(false)
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleToggleTratamiento = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('tipos_tratamiento')
        .update({ activo: !currentStatus })
        .eq('id', id)
      
      if (error) throw error
      fetchTratamientos()
    } catch (error) {
      console.error(error)
      alert("Error al cambiar el estado del tratamiento")
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'tratamientos', name: 'Tratamientos', icon: Activity },
    { id: 'usuarios', name: 'Crear Doctores', icon: Users },
  ]

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del CRM</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap flex py-4 px-4 border-b-2 font-medium text-sm
                    ${isActive 
                      ? 'border-primary text-primary dark:text-blue-400' 
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <Icon className={`mr-2 h-5 w-5 ${isActive ? 'text-primary dark:text-blue-400' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* MENSAJES DE ESTADO */}
          {saveMessage.text && (
            <div className={`mb-6 p-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
              <div className="flex">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p className="text-sm font-medium">{saveMessage.text}</p>
              </div>
            </div>
          )}

          {/* TAB GENERAL */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Información de la Clínica</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Clínica</label>
                    <input type="text" required value={generalConfig.nombre_clinica} onChange={e => setGeneralConfig({...generalConfig, nombre_clinica: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                    <p className="mt-1 text-xs text-gray-500">Este es el nombre que los doctores deben escribir al iniciar sesión.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-400" /> Horarios del Calendario
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora de Apertura</label>
                    <TimeInput 
                      value={generalConfig.hora_apertura}
                      onChange={(val) => setGeneralConfig({...generalConfig, hora_apertura: val})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hora de Cierre</label>
                    <TimeInput 
                      value={generalConfig.hora_cierre}
                      onChange={(val) => setGeneralConfig({...generalConfig, hora_cierre: val})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-gray-400" /> Integraciones
                </h3>
                <div className="flex items-center">
                  <input type="checkbox" id="asistente_voz" checked={generalConfig.asistente_voz_activo} onChange={e => setGeneralConfig({...generalConfig, asistente_voz_activo: e.target.checked})} 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <label htmlFor="asistente_voz" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Activar Asistente de Voz (Recepción Telefónica IA)
                  </label>
                </div>
              </div>

              <div className="pt-5 flex justify-end">
                <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* TAB USUARIOS */}
          {activeTab === 'usuarios' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Añadir Nuevo Doctor</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Crea una cuenta segura para que un doctor pueda iniciar sesión en el CRM y gestiona su ficha médica al mismo tiempo.
                </p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6 max-w-2xl bg-gray-50 dark:bg-gray-700/30 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email de acceso</label>
                    <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña temporal</label>
                    <input type="password" required minLength="6" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Doctor</label>
                    <input type="text" required value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellidos</label>
                    <input type="text" required value={newUser.apellidos} onChange={e => setNewUser({...newUser, apellidos: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad (Opcional)</label>
                    <input type="text" value={newUser.especialidad} onChange={e => setNewUser({...newUser, especialidad: e.target.value})} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                  </div>
                </div>

                <div className="pt-5 flex justify-end">
                  <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50">
                    <Users className="h-4 w-4 mr-2" />
                    {loading ? 'Creando...' : 'Crear Usuario y Ficha'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB TRATAMIENTOS */}
          {activeTab === 'tratamientos' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Tipos de Tratamiento</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Gestiona los tratamientos que ofrece tu clínica. Estos aparecerán en el calendario y presupuestos.
                </p>
              </div>

              {/* Formulario de añadir */}
              <form onSubmit={handleCreateTratamiento} className="flex flex-col sm:flex-row items-end gap-4 mb-8 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Tratamiento</label>
                  <input type="text" required value={nuevoTratamiento.nombre} onChange={e => setNuevoTratamiento({...nuevoTratamiento, nombre: e.target.value})} 
                    placeholder="Ej: Ortodoncia"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duración (min)</label>
                  <input type="number" required min="15" step="15" value={nuevoTratamiento.duracion_min} onChange={e => setNuevoTratamiento({...nuevoTratamiento, duracion_min: e.target.value})} 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 border" />
                </div>
                <div className="w-full sm:w-auto">
                  <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 h-[38px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </button>
                </div>
              </form>

              {/* Lista de tratamientos */}
              <div className="overflow-hidden bg-white dark:bg-gray-800 shadow sm:rounded-md border border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tratamientos.length === 0 ? (
                    <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No hay tratamientos configurados. Añade uno arriba.
                    </li>
                  ) : tratamientos.map((trat) => (
                    <li key={trat.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${trat.activo ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                          {trat.nombre}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {trat.duracion_min} minutos
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium mr-4 ${trat.activo ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {trat.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleToggleTratamiento(trat.id, trat.activo)}
                          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none ${trat.activo ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                          title={trat.activo ? "Desactivar" : "Activar"}
                        >
                          <Power className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
