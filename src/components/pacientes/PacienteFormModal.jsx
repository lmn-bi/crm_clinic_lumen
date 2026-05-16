import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function PacienteFormModal({ isOpen, onClose, pacienteToEdit, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    doc_identidad: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '',
    alergias: '',
    historial_notas: ''
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (pacienteToEdit) {
      setFormData({
        nombre: pacienteToEdit.nombre || '',
        apellidos: pacienteToEdit.apellidos || '',
        doc_identidad: pacienteToEdit.doc_identidad || '',
        telefono: pacienteToEdit.telefono || '',
        email: pacienteToEdit.email || '',
        fecha_nacimiento: pacienteToEdit.fecha_nacimiento || '',
        alergias: pacienteToEdit.alergias || '',
        historial_notas: pacienteToEdit.historial_notas || ''
      })
    } else {
      setFormData({
        nombre: '',
        apellidos: '',
        doc_identidad: '',
        telefono: '',
        email: '',
        fecha_nacimiento: '',
        alergias: '',
        historial_notas: ''
      })
    }
    setErrorMsg('')
  }, [pacienteToEdit, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (pacienteToEdit) {
        const { error } = await supabase
          .from('pacientes')
          .update(payload)
          .eq('id', pacienteToEdit.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('pacientes')
          .insert([payload])
        
        if (error) throw error
      }

      onSaveSuccess()
      onClose()
    } catch (error) {
      console.error('Error guardando paciente:', error)
      setErrorMsg(error.message || 'Error al guardar el paciente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle sm:p-6">
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

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {pacienteToEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h3>
              
              {errorMsg && (
                <div className="mt-2 p-2 text-sm text-danger bg-red-50 rounded">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre *</label>
                    <input type="text" name="nombre" id="nombre" required
                      value={formData.nombre} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">Apellidos *</label>
                    <input type="text" name="apellidos" id="apellidos" required
                      value={formData.apellidos} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="doc_identidad" className="block text-sm font-medium text-gray-700">DNI / NIE</label>
                    <input type="text" name="doc_identidad" id="doc_identidad"
                      value={formData.doc_identidad} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="tel" name="telefono" id="telefono"
                      value={formData.telefono} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" id="email"
                      value={formData.email} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nacimiento" id="fecha_nacimiento"
                      value={formData.fecha_nacimiento} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="alergias" className="block text-sm font-medium text-gray-700">Alergias</label>
                    <textarea name="alergias" id="alergias" rows="2"
                      value={formData.alergias} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"></textarea>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="historial_notas" className="block text-sm font-medium text-gray-700">Historial / Notas</label>
                    <textarea name="historial_notas" id="historial_notas" rows="3"
                      value={formData.historial_notas} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"></textarea>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Paciente'}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
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
