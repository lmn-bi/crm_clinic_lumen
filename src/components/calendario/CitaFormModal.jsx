import React, { useState, useEffect, useRef } from 'react'
import { X, Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { validarHorarioDoctor, fetchHorarioDoctor } from '../../utils/horarioUtils'
import { useAuth } from '../../context/AuthContext'

export default function CitaFormModal({ isOpen, onClose, onSaveSuccess, fechaInicio, horaInicio }) {
  const { perfil } = useAuth()
  // Datos maestros
  const [doctores, setDoctores] = useState([])
  const [tiposTratamiento, setTiposTratamiento] = useState([])

  // Buscador de pacientes
  const [pacienteSearch, setPacienteSearch] = useState('')
  const [pacientesResult, setPacientesResult] = useState([])
  const [selectedPaciente, setSelectedPaciente] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    doctor_id: '',
    fecha: '',
    hora_inicio: '',
    tipo_tratamiento: '',
    estado: 'confirmada',
    notas: '',
    presupuesto: ''
  })
  
  // Derivado
  const [duracionMin, setDuracionMin] = useState(30)
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Opciones de horas (08:00 a 19:45 cada 15 min)
  const timeOptions = []
  for (let h = 8; h <= 19; h++) {
    for (let m of ['00', '15', '30', '45']) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m}`)
    }
  }

  // Inicializar y cargar datos maestros
  useEffect(() => {
    if (isOpen) {
      fetchMaestros()
      
      // Reset form
      setFormData({
        doctor_id: '',
        fecha: fechaInicio || new Date().toISOString().split('T')[0],
        hora_inicio: horaInicio || '09:00',
        tipo_tratamiento: '',
        estado: 'confirmada',
        notas: '',
        presupuesto: ''
      })
      setPacienteSearch('')
      setSelectedPaciente(null)
      setPacientesResult([])
      setErrorMsg('')
    }
  }, [isOpen, fechaInicio, horaInicio])

  const fetchMaestros = async () => {
    try {
      const [docsRes, tiposRes] = await Promise.all([
        supabase.from('doctores').select('id, nombre, apellidos').eq('activo', true).eq('clinica_id', perfil.clinica_id),
        supabase.from('tipos_tratamiento').select('*').eq('activo', true).eq('clinica_id', perfil.clinica_id).order('nombre')
      ])

      if (docsRes.error) throw docsRes.error
      if (tiposRes.error) throw tiposRes.error

      setDoctores(docsRes.data || [])
      setTiposTratamiento(tiposRes.data || [])

      // Autoseleccionar doctor si hay datos y no está seleccionado
      if (docsRes.data && docsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, doctor_id: docsRes.data[0].id }))
      }
    } catch (err) {
      console.error('Error cargando maestros:', err)
      setErrorMsg('Error al cargar datos necesarios del formulario.')
    }
  }

  // Efecto para buscar pacientes con debounce
  useEffect(() => {
    if (!pacienteSearch.trim() || selectedPaciente) {
      setPacientesResult([])
      return
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data, error } = await supabase
          .from('pacientes')
          .select('id, nombre, apellidos, telefono, doc_identidad')
          .eq('clinica_id', perfil.clinica_id)
          .or(`nombre.ilike.%${pacienteSearch}%,apellidos.ilike.%${pacienteSearch}%,telefono.ilike.%${pacienteSearch}%`)
          .limit(5)

        if (error) throw error
        setPacientesResult(data || [])
      } catch (err) {
        console.error('Error buscando pacientes:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [pacienteSearch, selectedPaciente])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Autocompletar duración si cambia el tratamiento
    if (name === 'tipo_tratamiento') {
      if (value === 'Otros') {
        // Dejar duracionMin como estaba, pero editable
      } else {
        const tipoObj = tiposTratamiento.find(t => t.nombre === value)
        if (tipoObj) {
          setDuracionMin(tipoObj.duracion_min)
        }
      }
    }
  }

  // Verificación de solapamiento frontend
  const checkOverlap = async (doctorId, inicio, fin) => {
    const { data, error } = await supabase
      .from('citas')
      .select('id, inicio, fin, pacientes(nombre, apellidos)')
      .eq('doctor_id', doctorId)
      .eq('clinica_id', perfil.clinica_id)
      .neq('estado', 'cancelada')
      .lt('inicio', fin.toISOString())
      .gt('fin', inicio.toISOString())

    if (error) return null
    return (data || []).length > 0 ? data[0] : null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (!selectedPaciente) {
        throw new Error('Debes seleccionar un paciente de la lista.')
      }

      // Convertir fecha y hora local (Europa/Madrid implícito por el navegador) a UTC
      const localDateTimeString = `${formData.fecha}T${formData.hora_inicio}:00`
      const startDate = new Date(localDateTimeString)
      
      const endDate = new Date(startDate.getTime() + duracionMin * 60000)

      // Validación de horario laboral del doctor (advertencia)
      const horario = await fetchHorarioDoctor(formData.doctor_id)
      const { valido, mensaje } = validarHorarioDoctor(horario, startDate, endDate)
      if (!valido) {
        if (!window.confirm(`⚠️ ${mensaje}\n\n¿Deseas agendar la cita de todos modos?`)) {
          setLoading(false)
          return
        }
      }

      // Validación frontend de solapamiento
      const conflicto = await checkOverlap(formData.doctor_id, startDate, endDate)
      if (conflicto) {
        const hConf = new Date(conflicto.inicio).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
        throw new Error(`El doctor ya tiene una cita a las ${hConf} con ${conflicto.pacientes?.nombre} ${conflicto.pacientes?.apellidos}. Por favor, elige otro horario.`)
      }

      const payload = {
        paciente_id: selectedPaciente.id,
        doctor_id: formData.doctor_id,
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
        tipo_tratamiento: formData.tipo_tratamiento,
        duracion_min: duracionMin,
        estado: formData.estado,
        origen: 'web',
        notas: formData.notas || null,
        presupuesto: formData.presupuesto ? parseFloat(formData.presupuesto) : null,
        clinica_id: perfil.clinica_id
      }

      const { error } = await supabase
        .from('citas')
        .insert([payload])

      if (error) throw error

      onSaveSuccess()
      onClose()
    } catch (error) {
      console.error('Error guardando cita:', error)
      setErrorMsg(error.message || 'Ocurrió un error al guardar la cita.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg px-4 pt-5 pb-4 overflow-visible text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start w-full">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">
                Agendar Nueva Cita
              </h3>
              
              {errorMsg && (
                <div className="mt-2 mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* BUSCADOR DE PACIENTES */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Paciente *</label>
                  {selectedPaciente ? (
                    <div className="mt-1 flex justify-between items-center bg-blue-50 border border-blue-200 p-2 rounded-md">
                      <div>
                        <span className="font-medium text-blue-900">{selectedPaciente.nombre} {selectedPaciente.apellidos}</span>
                        <span className="text-sm text-blue-600 ml-2">{selectedPaciente.telefono}</span>
                      </div>
                      <button type="button" onClick={() => setSelectedPaciente(null)} className="text-blue-500 hover:text-blue-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar por nombre, apellidos o teléfono..."
                        value={pacienteSearch}
                        onChange={(e) => setPacienteSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                      {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {/* Resultados del buscador */}
                      {pacientesResult.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
                          {pacientesResult.map(p => (
                            <li 
                              key={p.id} 
                              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedPaciente(p)
                                setPacienteSearch('')
                                setPacientesResult([])
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{p.nombre} {p.apellidos}</span>
                                <span className="text-gray-500 text-xs">{p.doc_identidad} • {p.telefono}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {pacienteSearch && !isSearching && pacientesResult.length === 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-3 px-4 text-sm text-gray-500 ring-1 ring-black ring-opacity-5">
                          No se encontraron pacientes.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* DOCTOR */}
                  <div>
                    <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700">Doctor/a *</label>
                    <select
                      id="doctor_id" name="doctor_id" required
                      value={formData.doctor_id} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    >
                      <option value="" disabled>Seleccione un doctor</option>
                      {doctores.map(doc => (
                        <option key={doc.id} value={doc.id}>Dr/a. {doc.nombre} {doc.apellidos}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* ESTADO */}
                  <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                      id="estado" name="estado" required
                      value={formData.estado} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmada">Confirmada</option>
                    </select>
                  </div>

                  {/* FECHA Y HORA */}
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha *</label>
                    <input
                      type="date" id="fecha" name="fecha" required
                      value={formData.fecha} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    />
                  </div>
                  <div>
                    <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700">Hora de Inicio *</label>
                    <select
                      id="hora_inicio" name="hora_inicio" required
                      value={formData.hora_inicio} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    >
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* TRATAMIENTO Y DURACIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 mt-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="tipo_tratamiento" className="block text-sm font-medium text-gray-700">
                      Tratamiento *
                    </label>
                    <select
                      id="tipo_tratamiento" name="tipo_tratamiento" required
                      value={formData.tipo_tratamiento} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    >
                      <option value="" disabled>Seleccione tratamiento</option>
                      {tiposTratamiento.map(tipo => (
                        <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                      ))}
                      <option value="Otros">Otros (Duración manual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                    <input
                      type="number" 
                      disabled={formData.tipo_tratamiento !== 'Otros'}
                      value={formData.tipo_tratamiento ? duracionMin : ''}
                      onChange={(e) => setDuracionMin(e.target.value)}
                      min="15" step="15"
                      className={`block w-full mt-1 rounded-md shadow-sm sm:text-sm py-2 px-3 border ${formData.tipo_tratamiento === 'Otros' ? 'bg-white border-gray-300 focus:ring-primary focus:border-primary' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PRESUPUESTO */}
                  <div>
                    <label htmlFor="presupuesto" className="block text-sm font-medium text-gray-700">Presupuesto (€)</label>
                    <input
                      type="number" id="presupuesto" name="presupuesto" step="0.01" min="0"
                      value={formData.presupuesto} onChange={handleChange} placeholder="Ej: 150.00"
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    />
                  </div>
                </div>

                {/* NOTAS */}
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                    Notas adicionales <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    id="notas" name="notas" rows={2}
                    value={formData.notas} onChange={handleChange}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                  />
                </div>

                <div className="pt-4 sm:flex sm:flex-row-reverse border-t mt-6">
                  <button
                    type="submit" disabled={loading || !selectedPaciente}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Agendar Cita'}
                  </button>
                  <button
                    type="button" onClick={onClose}
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
