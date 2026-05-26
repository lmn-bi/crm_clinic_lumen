import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function DoctorFormModal({ isOpen, onClose, doctorToEdit, onSaveSuccess }) {
  const { perfil } = useAuth()
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    especialidad: '',
    num_colegiado: '',
    telefono: '',
    email: '',
    color_calendario: '#3B82F6',
    activo: true,
    horario: []
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Generar opciones de tiempo (09:00 a 19:00 cada 30 min)
  const timeOptions = []
  for (let h = 9; h <= 19; h++) {
    for (let m of ['00', '30']) {
      if (h === 19 && m === '30') continue
      const hourStr = h.toString().padStart(2, '0')
      timeOptions.push(`${hourStr}:${m}`)
    }
  }

  useEffect(() => {
    if (doctorToEdit) {
      setFormData({
        nombre: doctorToEdit.nombre || '',
        apellidos: doctorToEdit.apellidos || '',
        especialidad: doctorToEdit.especialidad || '',
        num_colegiado: doctorToEdit.num_colegiado || '',
        telefono: doctorToEdit.telefono || '',
        email: doctorToEdit.email || '',
        color_calendario: doctorToEdit.color_calendario || '#3B82F6',
        activo: doctorToEdit.activo ?? true,
        // Compatibilidad con el array de strings anterior, por si acaso
        horario: (doctorToEdit.horario || []).map(h => 
          typeof h === 'string' ? { id: Math.random().toString(), dia: h, inicio: '09:00', fin: '19:00' } : { ...h, id: h.id || Math.random().toString() }
        )
      })
    } else {
      setFormData({
        nombre: '',
        apellidos: '',
        especialidad: '',
        num_colegiado: '',
        telefono: '',
        email: '',
        color_calendario: '#3B82F6',
        activo: true,
        horario: []
      })
    }
    setErrorMsg('')
  }, [doctorToEdit, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  // Activa o desactiva un día entero
  const toggleDia = (dia) => {
    setFormData(prev => {
      const isSelected = prev.horario.some(h => h.dia === dia)
      if (isSelected) {
        // Eliminar todos los tramos de este día
        return { ...prev, horario: prev.horario.filter(h => h.dia !== dia) }
      } else {
        // Añadir el primer tramo por defecto
        return { ...prev, horario: [...prev.horario, { id: Math.random().toString(), dia, inicio: '09:00', fin: '13:00' }] }
      }
    })
  }

  // Añadir un nuevo tramo a un día existente
  const addTramo = (dia) => {
    setFormData(prev => {
      return { 
        ...prev, 
        horario: [...prev.horario, { id: Math.random().toString(), dia, inicio: '16:00', fin: '19:00' }] 
      }
    })
  }

  // Eliminar un tramo específico
  const removeTramo = (id) => {
    setFormData(prev => ({
      ...prev,
      horario: prev.horario.filter(h => h.id !== id)
    }))
  }

  // Modificar la hora de un tramo específico
  const handleTimeChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      horario: prev.horario.map(h => h.id === id ? { ...h, [field]: value } : h)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // Validar horarios lógicos
      for (const tramo of formData.horario) {
        if (tramo.inicio >= tramo.fin) {
          setErrorMsg(`Error en ${tramo.dia}: La hora de inicio (${tramo.inicio}) debe ser menor a la hora de fin (${tramo.fin}).`)
          setLoading(false)
          return
        }
      }

      // Limpiar IDs temporales antes de guardar para no saturar la DB (opcional, pero limpio)
      const payloadHorario = formData.horario.map(({ id, ...rest }) => rest)
      
      const payload = { 
        ...formData,
        horario: payloadHorario,
        clinica_id: perfil.clinica_id
      }

      if (doctorToEdit) {
        const { error } = await supabase
          .from('doctores')
          .update(payload)
          .eq('id', doctorToEdit.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('doctores')
          .insert([payload])
        
        if (error) throw error
      }

      onSaveSuccess()
      onClose()
    } catch (error) {
      console.error('Error guardando doctor:', error)
      setErrorMsg(error.message || 'Error al guardar el doctor.')
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
                {doctorToEdit ? 'Editar Doctor' : 'Nuevo Doctor'}
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
                    <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700">Especialidad</label>
                    <input type="text" name="especialidad" id="especialidad"
                      value={formData.especialidad} onChange={handleChange}
                      className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border" />
                  </div>
                  <div>
                    <label htmlFor="num_colegiado" className="block text-sm font-medium text-gray-700">Nº Colegiado</label>
                    <input type="text" name="num_colegiado" id="num_colegiado"
                      value={formData.num_colegiado} onChange={handleChange}
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
                  
                  {/* Opciones Avanzadas: Color y Estado */}
                  <div className="flex items-center space-x-4">
                    <div className="w-1/2">
                      <label htmlFor="color_calendario" className="block text-sm font-medium text-gray-700">Color Agenda</label>
                      <input type="color" name="color_calendario" id="color_calendario"
                        value={formData.color_calendario} onChange={handleChange}
                        className="block w-full h-10 mt-1 border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary cursor-pointer" />
                    </div>
                    <div className="w-1/2 flex items-center mt-6">
                      <input type="checkbox" name="activo" id="activo"
                        checked={formData.activo} onChange={handleChange}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                      <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                        Doctor Activo
                      </label>
                    </div>
                  </div>

                  {/* Disponibilidad (Días de Trabajo y Horas) */}
                  <div className="sm:col-span-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad y Horarios</label>
                    <div className="space-y-3">
                      {DIAS_SEMANA.map(dia => {
                        const tramosDelDia = formData.horario.filter(h => h.dia === dia)
                        const isSelected = tramosDelDia.length > 0

                        return (
                          <div key={dia} className={`flex flex-col p-3 rounded-lg border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                            
                            {/* Cabecera del día */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <input 
                                  type="checkbox" 
                                  id={`dia-${dia}`}
                                  checked={isSelected}
                                  onChange={() => toggleDia(dia)}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label htmlFor={`dia-${dia}`} className="ml-2 font-medium text-sm text-gray-700 cursor-pointer w-24">
                                  {dia}
                                </label>
                              </div>
                              
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() => addTramo(dia)}
                                  className="text-xs flex items-center text-primary hover:text-blue-700"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Añadir horario
                                </button>
                              )}
                            </div>

                            {/* Tramos del día */}
                            {isSelected && (
                              <div className="mt-3 space-y-2 pl-6">
                                {tramosDelDia.map((tramo, index) => (
                                  <div key={tramo.id} className="flex items-center space-x-2">
                                    <select 
                                      value={tramo.inicio}
                                      onChange={(e) => handleTimeChange(tramo.id, 'inicio', e.target.value)}
                                      className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                    >
                                      {timeOptions.map(t => <option key={`inicio-${t}`} value={t}>{t}</option>)}
                                    </select>
                                    <span className="text-gray-500 text-sm">a</span>
                                    <select 
                                      value={tramo.fin}
                                      onChange={(e) => handleTimeChange(tramo.id, 'fin', e.target.value)}
                                      className="block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                                    >
                                      {timeOptions.map(t => <option key={`fin-${t}`} value={t}>{t}</option>)}
                                    </select>
                                    
                                    {/* Botón borrar tramo (si hay más de 1 tramo, permitimos borrar) */}
                                    <button
                                      type="button"
                                      onClick={() => removeTramo(tramo.id)}
                                      className="text-gray-400 hover:text-red-500 ml-2"
                                      title="Eliminar este horario"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar Doctor'}
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
