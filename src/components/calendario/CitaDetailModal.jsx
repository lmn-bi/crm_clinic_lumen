import React, { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock, User, Phone, Edit2, CheckCircle2, AlertCircle, Eye, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function CitaDetailModal({ isOpen, onClose, cita, onSaveSuccess }) {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin'

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isEditingNotas, setIsEditingNotas] = useState(false)
  const [notasTemp, setNotasTemp] = useState('')

  // Cambio 3: Ficha rápida del paciente
  const [showFichaPaciente, setShowFichaPaciente] = useState(false)
  const [fichaPaciente, setFichaPaciente] = useState(null)
  const [loadingFicha, setLoadingFicha] = useState(false)

  // Cambio 4: Modo Edición Completa
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [editDoctores, setEditDoctores] = useState([])
  const [editTipos, setEditTipos] = useState([])
  const [editDuracion, setEditDuracion] = useState(30)

  // Generar timeOptions (cada 15 min)
  const timeOptions = []
  for (let h = 8; h <= 19; h++) {
    for (let m of ['00', '15', '30', '45']) {
      timeOptions.push(`${h.toString().padStart(2, '0')}:${m}`)
    }
  }

  useEffect(() => {
    if (isOpen && cita) {
      setNotasTemp(cita.notas || '')
      setIsEditingNotas(false)
      setErrorMsg('')
      setLoading(false) // Fix: resetear loading al abrir/reabrir modal
      setShowFichaPaciente(false)
      setFichaPaciente(null)
      setIsEditing(false)
    }
  }, [isOpen, cita])

  useEffect(() => {
    if (showFichaPaciente && !fichaPaciente && cita) {
      const fetchPaciente = async () => {
        setLoadingFicha(true)
        try {
          const { data, error } = await supabase
            .from('pacientes')
            .select('telefono, email, fecha_nacimiento, alergias, historial_notas, doc_identidad')
            .eq('id', cita.paciente_id)
            .single()
          if (error) throw error
          setFichaPaciente(data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingFicha(false)
        }
      }
      fetchPaciente()
    }
  }, [showFichaPaciente, cita, fichaPaciente])

  useEffect(() => {
    if (isEditing && cita) {
      const fetchMaestros = async () => {
        try {
          const [docsRes, tiposRes] = await Promise.all([
            supabase.from('doctores').select('id,nombre,apellidos').eq('activo', true),
            supabase.from('tipos_tratamiento').select('*').eq('activo', true)
          ])
          
          setEditDoctores(docsRes.data || [])
          setEditTipos(tiposRes.data || [])

          const fechaLocal = new Date(cita.inicio).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
          const horaLocal = new Date(cita.inicio).toLocaleTimeString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })

          setEditData({
            doctor_id: cita.doctor_id,
            fecha: fechaLocal,
            hora_inicio: horaLocal,
            tipo_tratamiento: cita.tipo_tratamiento,
            estado: cita.estado,
            notas: cita.notas || ''
          })
          setEditDuracion(cita.duracion_min || 30)
        } catch (err) {
          setErrorMsg('Error al cargar datos para edición.')
        }
      }
      fetchMaestros()
    }
  }, [isEditing, cita])

  if (!isOpen || !cita) return null

  // Helpers visualización
  const dateObj = new Date(cita.inicio)
  const fechaStr = dateObj.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const horaInicioStr = dateObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
  
  const dateFinObj = new Date(cita.fin)
  const horaFinStr = dateFinObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })

  // Cambio 2: Semáforo
  const getSemaforo = (estado) => {
    switch (estado) {
      case 'confirmada': return { bg: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400', txt: 'Confirmada' }
      case 'completada': return { bg: 'bg-green-100 text-green-800', dot: 'bg-green-400', txt: 'Completada' }
      case 'no_show': return { bg: 'bg-gray-200 text-gray-700', dot: 'bg-gray-600', txt: 'No asistió' }
      case 'cancelada': return { bg: 'bg-gray-100 text-gray-500', dot: '', txt: 'Cancelada' }
      case 'pendiente':
      default: return { bg: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400', txt: 'Pendiente' }
    }
  }

  const semaforo = getSemaforo(cita.estado)

  // Acciones Rápidas
  const handleUpdateEstado = async (nuevoEstado) => {
    if (nuevoEstado === 'cancelada') {
      if (!window.confirm(`¿Estás seguro de que deseas cancelar la cita de ${cita.pacientes?.nombre} ${cita.pacientes?.apellidos}?`)) {
        return
      }
    }
    
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', cita.id)

      if (error) throw error
      if (onSaveSuccess) onSaveSuccess()
      onClose() // Cerrar modal inmediatamente tras cambiar estado
    } catch (err) {
      setErrorMsg(`Error al actualizar estado: ${err.message}`)
      setLoading(false)
    }
  }

  const handleSaveNotas = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('citas')
        .update({ notas: notasTemp })
        .eq('id', cita.id)

      if (error) throw error
      cita.notas = notasTemp
      setIsEditingNotas(false)
    } catch (err) {
      setErrorMsg(`Error al guardar notas: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Manejadores modo edición
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))

    if (name === 'tipo_tratamiento') {
      if (value === 'Otros') {
        // Dejar editDuracion como está, pero hacerla editable
      } else {
        const tipoObj = editTipos.find(t => t.nombre === value)
        if (tipoObj) setEditDuracion(tipoObj.duracion_min)
      }
    }
  }

  // Verificación de solapamiento frontend
  const checkOverlap = async (doctorId, inicio, fin, excludeCitaId = null) => {
    const { data, error } = await supabase
      .from('citas')
      .select('id, inicio, fin, pacientes(nombre, apellidos)')
      .eq('doctor_id', doctorId)
      .neq('estado', 'cancelada')
      .lt('inicio', fin.toISOString())
      .gt('fin', inicio.toISOString())

    if (error) return null // Si falla la consulta, dejar pasar

    const conflictos = excludeCitaId
      ? (data || []).filter(c => c.id !== excludeCitaId)
      : (data || [])

    return conflictos.length > 0 ? conflictos[0] : null
  }

  const handleSaveEdicion = async (e) => {
    e.preventDefault()

    if (editData.estado === 'cancelada' && cita.estado !== 'cancelada') {
      if (!window.confirm(`¿Estás seguro de que deseas cancelar la cita de ${cita.pacientes?.nombre} ${cita.pacientes?.apellidos}?`)) {
        return
      }
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const startDate = new Date(`${editData.fecha}T${editData.hora_inicio}:00`)
      const endDate = new Date(startDate.getTime() + editDuracion * 60000)

      // Validación frontend de solapamiento
      const conflicto = await checkOverlap(editData.doctor_id, startDate, endDate, cita.id)
      if (conflicto) {
        const hConf = new Date(conflicto.inicio).toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
        throw new Error(`El doctor ya tiene una cita a las ${hConf} con ${conflicto.pacientes?.nombre} ${conflicto.pacientes?.apellidos}. Elige otro horario.`)
      }

      const payload = {
        doctor_id: editData.doctor_id,
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
        tipo_tratamiento: editData.tipo_tratamiento,
        duracion_min: editDuracion,
        estado: editData.estado,
        notas: editData.notas || null
      }

      const { error } = await supabase
        .from('citas')
        .update(payload)
        .eq('id', cita.id)

      if (error) throw error

      setIsEditing(false)
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(`Error al guardar edición: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar</span>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* MODO EDICIÓN COMPLETA */}
          {isEditing ? (
            <div className="sm:flex sm:items-start w-full">
              <div className="mt-3 text-left w-full">
                <h3 className="text-xl font-bold leading-6 text-gray-900 mb-4 border-b pb-4">
                  Editar Cita
                </h3>

                {errorMsg && (
                  <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSaveEdicion} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Doctor/a</label>
                      <select
                        name="doctor_id" required value={editData.doctor_id || ''} onChange={handleEditChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                      >
                        {editDoctores.map(d => (
                          <option key={d.id} value={d.id}>Dr/a. {d.nombre} {d.apellidos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado</label>
                      <select
                        name="estado" required value={editData.estado || ''} onChange={handleEditChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="no_show">No asistió</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fecha</label>
                      <input
                        type="date" name="fecha" required value={editData.fecha || ''} onChange={handleEditChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hora de Inicio</label>
                      <select
                        name="hora_inicio" required value={editData.hora_inicio || ''} onChange={handleEditChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tratamiento</label>
                      <select
                        name="tipo_tratamiento" required value={editData.tipo_tratamiento || ''} onChange={handleEditChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md border"
                      >
                        <option value="" disabled>Seleccione tratamiento</option>
                        {editTipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                        <option value="Otros">Otros (Duración manual)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duración (min)</label>
                      <input
                        type="number" 
                        disabled={editData.tipo_tratamiento !== 'Otros'}
                        value={editData.tipo_tratamiento ? editDuracion : ''}
                        onChange={(e) => setEditDuracion(e.target.value)}
                        min="15" step="15"
                        className={`block w-full mt-1 rounded-md shadow-sm sm:text-sm py-2 px-3 border ${editData.tipo_tratamiento === 'Otros' ? 'bg-white border-gray-300 focus:ring-primary focus:border-primary' : 'bg-gray-50 border-gray-300 text-gray-500'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notas adicionales</label>
                    <textarea
                      name="notas" rows={2} value={editData.notas || ''} onChange={handleEditChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                    />
                  </div>

                  <div className="pt-4 sm:flex sm:flex-row-reverse border-t mt-6">
                    <button
                      type="submit" disabled={loading}
                      className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button" onClick={() => setIsEditing(false)}
                      className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Cancelar edición
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* MODO VISUALIZACIÓN (DEFAULT) */
            <div className="sm:flex sm:items-start w-full">
              <div className="mt-3 text-left w-full">
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold leading-6 text-gray-900">
                      Detalle de la Cita
                    </h3>
                    {isAdmin && (
                      <button onClick={() => setIsEditing(true)} title="Editar Cita" className="text-gray-400 hover:text-blue-600 focus:outline-none">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Semáforo de Estado */}
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${semaforo.bg}`}>
                    {semaforo.dot && <span className={`w-2 h-2 rounded-full ${semaforo.dot}`}></span>}
                    {semaforo.txt}
                  </span>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Info principal paciente y doctor */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-semibold text-lg text-gray-900">
                          {cita.pacientes?.nombre} {cita.pacientes?.apellidos}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowFichaPaciente(!showFichaPaciente)}
                        title="Ver datos del paciente"
                        className="text-gray-400 hover:text-blue-600 focus:outline-none"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 pl-7">
                      <span>Atendido por: <strong>Dr/a. {cita.doctores?.nombre} {cita.doctores?.apellidos}</strong></span>
                    </div>
                  </div>

                  {/* Ficha Rápida del Paciente */}
                  {showFichaPaciente && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 animate-in fade-in duration-200">
                      {loadingFicha ? (
                        <div className="flex justify-center p-2"><div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div></div>
                      ) : fichaPaciente ? (
                        <div className="space-y-3">
                          <div className="flex gap-4 text-sm text-gray-700">
                            <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> {fichaPaciente.telefono || '-'}</div>
                            <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" /> {fichaPaciente.email || '-'}</div>
                          </div>
                          <div>
                            <div className={`rounded p-2 text-sm ${fichaPaciente.alergias ? 'bg-red-50 text-red-800' : 'text-gray-500'}`}>
                              <strong>Alergias: </strong> {fichaPaciente.alergias || 'Sin alergias registradas'}
                            </div>
                          </div>
                          <div>
                            <div className={`rounded p-2 text-sm ${fichaPaciente.historial_notas ? 'bg-gray-100 text-gray-800' : 'text-gray-500'}`}>
                              <strong>Notas clínicas: </strong> {fichaPaciente.historial_notas || 'Sin notas registradas'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">No se pudieron cargar los datos del paciente.</p>
                      )}
                    </div>
                  )}

                  {/* Fecha y Tratamiento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
                        <CalendarIcon className="h-4 w-4 mr-1" /> Fecha
                      </div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{fechaStr}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {horaInicioStr} - {horaFinStr} ({cita.duracion_min} min)
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 p-3 rounded-lg flex flex-col justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Tratamiento</div>
                        <div className="text-sm font-medium text-gray-900">{cita.tipo_tratamiento}</div>
                      </div>
                      {cita.origen === 'telefono' && (
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 self-start">
                          <Phone className="w-3 h-3 mr-1" /> Agente de Voz
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Notas de la cita</label>
                      {isAdmin && !isEditingNotas && (
                        <button onClick={() => setIsEditingNotas(true)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center">
                          <Edit2 className="w-3 h-3 mr-1" /> Editar
                        </button>
                      )}
                    </div>
                    {isEditingNotas ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={notasTemp}
                          onChange={(e) => setNotasTemp(e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm p-2 border"
                        />
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => setIsEditingNotas(false)} className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                            Cancelar
                          </button>
                          <button onClick={handleSaveNotas} disabled={loading} className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700">
                            Guardar Notas
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 min-h-[3rem] border border-gray-100 whitespace-pre-wrap">
                        {cita.notas || <span className="text-gray-400 italic">Sin notas registradas.</span>}
                      </div>
                    )}
                  </div>

                  {/* Acciones de Admin */}
                  {isAdmin && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Acciones de Administrador</p>
                      <div className="flex flex-wrap gap-2">
                        {cita.estado === 'pendiente' && (
                          <button onClick={() => handleUpdateEstado('confirmada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                          </button>
                        )}
                        {cita.estado !== 'completada' && cita.estado !== 'cancelada' && (
                          <button onClick={() => handleUpdateEstado('completada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar Completada
                          </button>
                        )}
                        {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                          <button onClick={() => handleUpdateEstado('no_show')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Paciente no asistió
                          </button>
                        )}
                        {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                          <button onClick={() => handleUpdateEstado('cancelada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-gray-400" /> Cancelar Cita
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
