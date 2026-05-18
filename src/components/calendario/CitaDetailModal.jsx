import React, { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock, User, Phone, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

export default function CitaDetailModal({ isOpen, onClose, cita, onSaveSuccess }) {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin'

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isEditingNotas, setIsEditingNotas] = useState(false)
  const [notasTemp, setNotasTemp] = useState('')

  useEffect(() => {
    if (isOpen && cita) {
      setNotasTemp(cita.notas || '')
      setIsEditingNotas(false)
      setErrorMsg('')
    }
  }, [isOpen, cita])

  if (!isOpen || !cita) return null

  // Helper de fecha/hora en España
  const dateObj = new Date(cita.inicio)
  const fechaStr = dateObj.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const horaInicioStr = dateObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
  
  const dateFinObj = new Date(cita.fin)
  const horaFinStr = dateFinObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })

  // Colores de estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmada': return 'bg-blue-100 text-blue-800'
      case 'completada': return 'bg-green-100 text-green-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800' // pendiente
    }
  }

  // Actualizar estado de la cita
  const handleUpdateEstado = async (nuevoEstado) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', cita.id)

      if (error) throw error
      if (onSaveSuccess) onSaveSuccess() // En Realtime mode, esto solo fuerza un refetch manual o simplemente cierra el modal. Normalmente con realtime no hace falta re-fetch, pero cerramos el modal o dejamos actualizar.
      
      // Actualizamos localmente para feedback inmediato si no cerramos
      cita.estado = nuevoEstado
    } catch (err) {
      setErrorMsg(`Error al actualizar estado: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Guardar notas editadas
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

  // Eliminar cita
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.')) return
    
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('citas')
        .delete()
        .eq('id', cita.id)

      if (error) throw error
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err) {
      setErrorMsg(`Error al eliminar cita: ${err.message}`)
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

          <div className="sm:flex sm:items-start w-full">
            <div className="mt-3 text-left w-full">
              <div className="flex items-center justify-between mb-4 border-b pb-4">
                <h3 className="text-xl font-bold leading-6 text-gray-900">
                  Detalle de la Cita
                </h3>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getEstadoColor(cita.estado)}`}>
                  {cita.estado}
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
                  <div className="flex items-center mb-2">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-semibold text-lg text-gray-900">
                      {cita.pacientes?.nombre} {cita.pacientes?.apellidos}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 pl-7">
                    <span>Atendido por: <strong>Dr/a. {cita.doctores?.nombre} {cita.doctores?.apellidos}</strong></span>
                  </div>
                </div>

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
                      {cita.estado !== 'confirmada' && cita.estado !== 'completada' && (
                        <button onClick={() => handleUpdateEstado('confirmada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                        </button>
                      )}
                      {cita.estado !== 'completada' && (
                        <button onClick={() => handleUpdateEstado('completada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar Completada
                        </button>
                      )}
                      {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                        <button onClick={() => handleUpdateEstado('cancelada')} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none">
                          <AlertCircle className="w-3.5 h-3.5 mr-1 text-gray-400" /> Cancelar Cita
                        </button>
                      )}
                      
                      <div className="flex-grow"></div>
                      
                      <button onClick={handleDelete} disabled={loading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
