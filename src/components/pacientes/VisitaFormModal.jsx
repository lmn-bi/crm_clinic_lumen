import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function VisitaFormModal({ isOpen, onClose, pacienteId, onSaveSuccess }) {
  const [doctores, setDoctores] = useState([])
  
  // Para la fecha por defecto (hoy en formato YYYY-MM-DD)
  const hoy = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    doctor_id: '',
    fecha: hoy,
    tratamiento: '',
    observaciones: '',
    proximos_pasos: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Cargar lista de doctores activos
  useEffect(() => {
    if (isOpen) {
      fetchDoctores()
      // Reset form al abrir
      setFormData({
        doctor_id: '',
        fecha: hoy,
        tratamiento: '',
        observaciones: '',
        proximos_pasos: ''
      })
      setErrorMsg('')
    }
  }, [isOpen])

  const fetchDoctores = async () => {
    try {
      const { data, error } = await supabase
        .from('doctores')
        .select('id, nombre, apellidos')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (error) throw error
      setDoctores(data || [])
      
      // Auto-seleccionar el primero si existe
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, doctor_id: data[0].id }))
      }
    } catch (err) {
      console.error('Error cargando doctores:', err)
      setErrorMsg('Error al cargar la lista de doctores.')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (!formData.doctor_id) {
        throw new Error('Debes seleccionar un doctor.')
      }

      const payload = {
        paciente_id: pacienteId,
        doctor_id: formData.doctor_id,
        fecha: formData.fecha,
        tratamiento: formData.tratamiento,
        observaciones: formData.observaciones || null,
        proximos_pasos: formData.proximos_pasos || null
      }

      const { error } = await supabase
        .from('visitas')
        .insert([payload])

      if (error) throw error

      onSaveSuccess()
      onClose()
    } catch (error) {
      console.error('Error guardando visita:', error)
      setErrorMsg(error.message || 'Ocurrió un error al guardar la visita.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        
        {/* Fondo oscuro */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose} 
        />

        {/* Contenido del modal */}
        <div className="relative inline-block w-full max-w-lg px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:p-6">
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
                Registrar Nueva Visita
              </h3>
              
              {errorMsg && (
                <div className="mt-2 mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Primera fila: Doctor y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700">Doctor/a *</label>
                    <select
                      id="doctor_id"
                      name="doctor_id"
                      required
                      value={formData.doctor_id}
                      onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border bg-white"
                    >
                      <option value="" disabled>Seleccione un doctor</option>
                      {doctores.map(doc => (
                        <option key={doc.id} value={doc.id}>
                          Dr/a. {doc.nombre} {doc.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha *</label>
                    <input
                      type="date"
                      id="fecha"
                      name="fecha"
                      required
                      value={formData.fecha}
                      onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                    />
                  </div>
                </div>

                {/* Tratamiento */}
                <div>
                  <label htmlFor="tratamiento" className="block text-sm font-medium text-gray-700">
                    Tratamiento Realizado *
                  </label>
                  <textarea
                    id="tratamiento"
                    name="tratamiento"
                    required
                    rows={3}
                    placeholder="Describe qué se hizo en la visita..."
                    value={formData.tratamiento}
                    onChange={handleChange}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">
                    Observaciones Clínicas <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    rows={2}
                    placeholder="Notas internas, complicaciones, estado del paciente..."
                    value={formData.observaciones}
                    onChange={handleChange}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                  />
                </div>

                {/* Próximos pasos */}
                <div>
                  <label htmlFor="proximos_pasos" className="block text-sm font-medium text-gray-700">
                    Próximos Pasos <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    id="proximos_pasos"
                    name="proximos_pasos"
                    rows={2}
                    placeholder="Qué se hará en la próxima cita..."
                    value={formData.proximos_pasos}
                    onChange={handleChange}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 border"
                  />
                </div>

                <div className="pt-4 sm:flex sm:flex-row-reverse border-t mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Visita'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
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
