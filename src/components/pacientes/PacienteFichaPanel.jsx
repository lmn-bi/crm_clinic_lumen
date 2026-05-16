import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, Mail, FileText, Activity } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function PacienteFichaPanel({ isOpen, onClose, paciente }) {
  const [citas, setCitas] = useState([])
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (isOpen && paciente?.id) {
      fetchCitas()
    } else {
      setCitas([])
      setFetchError(null)
    }
  }, [isOpen, paciente])

  const fetchCitas = async () => {
    setLoadingCitas(true)
    setFetchError(null)
    try {
      // Hacemos el JOIN con doctores para traer el nombre
      const { data, error } = await supabase
        .from('citas')
        .select(`
          *,
          doctores (
            nombre,
            apellidos,
            especialidad
          )
        `)
        .eq('paciente_id', paciente.id)
        .order('inicio', { ascending: false })

      if (error) throw error
      setCitas(data || [])
    } catch (error) {
      console.error('Error cargando historial de citas:', error)
      setFetchError(error.message)
    } finally {
      setLoadingCitas(false)
    }
  }

  // Para prevenir scroll en el body cuando el panel está abierto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || !paciente) return null

  // Helpers seguros para evitar crasheos (TypeError)
  const safeNombre = paciente?.nombre || ''
  const safeApellidos = paciente?.apellidos || ''
  const iniciales = `${safeNombre.charAt(0) || ''}${safeApellidos.charAt(0) || ''}`.toUpperCase()

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Fondo oscuro con opacidad */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose} 
        />

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              
              {/* HEADER DEL PANEL */}
              <div className="bg-primary px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">Ficha Personal</h2>
                  <button
                    type="button"
                    className="rounded-md text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Cerrar panel</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4 flex items-center">
                  <div className="h-16 w-16 flex-shrink-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white">
                    {iniciales || <User className="h-8 w-8 text-white" />}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">{safeNombre} {safeApellidos}</h3>
                    <p className="text-blue-200 text-sm">
                      DNI/NIE: {paciente?.doc_identidad || 'No registrado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <div className="relative flex-1 px-4 py-6 sm:px-6">
                
                {/* GRID DE INFORMACIÓN BÁSICA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Teléfono</p>
                      <p className="text-base text-gray-900">{paciente?.telefono || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-base text-gray-900">{paciente?.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha de Nacimiento</p>
                      <p className="text-base text-gray-900">
                        {paciente?.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* NOTAS MÉDICAS Y ALERGIAS */}
                <div className="mb-8 space-y-6">
                  <div>
                    <h4 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                      <Activity className="h-5 w-5 text-danger mr-2" />
                      Alergias
                    </h4>
                    <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
                      {paciente?.alergias || 'No reporta alergias conocidas.'}
                    </div>
                  </div>
                  <div>
                    <h4 className="flex items-center text-sm font-medium text-gray-900 mb-2">
                      <FileText className="h-5 w-5 text-gray-400 mr-2" />
                      Historial General / Notas
                    </h4>
                    <div className="bg-gray-50 text-gray-800 p-4 rounded-lg text-sm whitespace-pre-wrap">
                      {paciente?.historial_notas || 'No hay notas generales registradas.'}
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* HISTORIAL DE CITAS (TIMELINE) */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Historial de Citas</h4>
                  
                  {fetchError ? (
                    <div className="p-4 bg-red-50 text-danger rounded-md text-sm border border-red-200">
                      Error de base de datos al buscar citas: {fetchError}. <br />
                      Asegúrate de que la tabla "citas" existe y tiene relación con "doctores".
                    </div>
                  ) : loadingCitas ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : citas.length === 0 ? (
                    <p className="text-gray-500 text-sm">Este paciente aún no ha tenido citas.</p>
                  ) : (
                    <div className="flow-root">
                      <ul role="list" className="-mb-8">
                        {citas.map((cita, citaIdx) => (
                          <li key={cita.id || citaIdx}>
                            <div className="relative pb-8">
                              {citaIdx !== citas.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                                    ${cita?.estado === 'completada' ? 'bg-secondary' : 
                                      cita?.estado === 'cancelada' ? 'bg-danger' : 'bg-primary'}`}>
                                    <Calendar className="h-4 w-4 text-white" aria-hidden="true" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {cita?.tipo_tratamiento || 'Consulta General'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      Atendido por <span className="font-medium text-gray-900">Dr. {cita?.doctores?.nombre || ''} {cita?.doctores?.apellidos || ''}</span>
                                    </p>
                                    {cita?.notas && (
                                      <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
                                        {cita.notas}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time dateTime={cita?.inicio || ''}>
                                      {cita?.inicio ? new Date(cita.inicio).toLocaleDateString() : 'Sin fecha'}
                                    </time>
                                    <div className="mt-1 font-medium capitalize">
                                      {cita?.estado || 'Programada'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
