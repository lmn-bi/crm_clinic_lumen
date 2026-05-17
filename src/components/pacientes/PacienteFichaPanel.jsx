import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Phone, Mail, FileText, Activity, Clock, Plus, CheckCircle2, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import VisitaFormModal from './VisitaFormModal'

export default function PacienteFichaPanel({ isOpen, onClose, paciente }) {
  const [activeTab, setActiveTab] = useState('informacion') // 'informacion' | 'historial'
  
  // Estados para Citas
  const [citas, setCitas] = useState([])
  const [loadingCitas, setLoadingCitas] = useState(true)
  const [errorCitas, setErrorCitas] = useState(null)

  // Estados para Visitas Clínicas
  const [visitas, setVisitas] = useState([])
  const [loadingVisitas, setLoadingVisitas] = useState(true)
  const [errorVisitas, setErrorVisitas] = useState(null)
  const [isVisitaModalOpen, setIsVisitaModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen && paciente?.id) {
      setActiveTab('informacion')
      fetchCitas()
      fetchVisitas()
    } else {
      setCitas([])
      setVisitas([])
      setErrorCitas(null)
      setErrorVisitas(null)
    }
  }, [isOpen, paciente])

  // ================= FETCH CITAS =================
  const fetchCitas = async () => {
    setLoadingCitas(true)
    setErrorCitas(null)
    try {
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
      console.error('Error cargando citas:', error)
      setErrorCitas(error.message)
    } finally {
      setLoadingCitas(false)
    }
  }

  // ================= FETCH VISITAS =================
  const fetchVisitas = async () => {
    setLoadingVisitas(true)
    setErrorVisitas(null)
    try {
      const { data, error } = await supabase
        .from('visitas')
        .select(`
          *,
          doctores (
            nombre,
            apellidos
          )
        `)
        .eq('paciente_id', paciente.id)
        .order('fecha', { ascending: false })

      if (error) throw error
      setVisitas(data || [])
    } catch (error) {
      console.error('Error cargando visitas:', error)
      setErrorVisitas(error.message)
    } finally {
      setLoadingVisitas(false)
    }
  }

  // Prevenir scroll en el body
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen || !paciente) return null

  const safeNombre = paciente?.nombre || ''
  const safeApellidos = paciente?.apellidos || ''
  const iniciales = `${safeNombre.charAt(0) || ''}${safeApellidos.charAt(0) || ''}`.toUpperCase()

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            onClick={onClose} 
          />

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform duration-300 ease-in-out">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                
                {/* HEADER DEL PANEL */}
                <div className="bg-primary px-4 py-6 sm:px-6 shrink-0">
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

                  {/* TABS */}
                  <div className="mt-6 border-b border-blue-400">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('informacion')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'informacion'
                            ? 'border-white text-white'
                            : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
                        }`}
                      >
                        Información General
                      </button>
                      <button
                        onClick={() => setActiveTab('historial')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'historial'
                            ? 'border-white text-white'
                            : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
                        }`}
                      >
                        Historial y Citas
                      </button>
                    </nav>
                  </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="relative flex-1 px-4 py-6 sm:px-6 bg-gray-50">
                  
                  {/* ================= PESTAÑA: INFORMACIÓN ================= */}
                  {activeTab === 'informacion' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Datos de Contacto</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4">
                          <Activity className="h-5 w-5 text-danger mr-2" />
                          Alergias Conocidas
                        </h4>
                        <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm border border-red-100">
                          {paciente?.alergias || 'No reporta alergias.'}
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-4">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          Notas Generales del Paciente
                        </h4>
                        <div className="bg-gray-50 text-gray-800 p-4 rounded-lg text-sm whitespace-pre-wrap border border-gray-200">
                          {paciente?.historial_notas || 'No hay notas generales registradas.'}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ================= PESTAÑA: HISTORIAL Y CITAS ================= */}
                  {activeTab === 'historial' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      
                      {/* SECCIÓN DE VISITAS CLÍNICAS */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-primary" />
                            Historial Clínico
                          </h4>
                          <button
                            onClick={() => setIsVisitaModalOpen(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Nueva Visita
                          </button>
                        </div>

                        {errorVisitas ? (
                          <div className="p-4 bg-red-50 text-danger rounded-md text-sm border border-red-200">
                            Error cargando historial clínico: {errorVisitas}
                          </div>
                        ) : loadingVisitas ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : visitas.length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-gray-500 text-sm">Aún no hay visitas clínicas registradas.</p>
                          </div>
                        ) : (
                          <div className="flow-root">
                            <ul role="list" className="-mb-8">
                              {visitas.map((visita, idx) => (
                                <li key={visita.id}>
                                  <div className="relative pb-8">
                                    {idx !== visitas.length - 1 ? (
                                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex items-start space-x-3">
                                      <div className="relative">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center ring-8 ring-white border border-blue-200 z-10">
                                          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                                        </div>
                                      </div>
                                      <div className="min-w-0 flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                          <div>
                                            <p className="text-sm text-gray-500">
                                              {new Date(visita.fecha).toLocaleDateString('es-ES', { 
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                              })}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                              Dr/a. {visita.doctores?.nombre} {visita.doctores?.apellidos}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-gray-900">
                                          {visita.tratamiento}
                                        </div>
                                        {visita.observaciones && (
                                          <div className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200">
                                            {visita.observaciones}
                                          </div>
                                        )}
                                        {visita.proximos_pasos && (
                                          <div className="mt-3 flex text-sm text-gray-600 bg-blue-50/50 p-2 rounded items-start">
                                            <ArrowRight className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" />
                                            <span><strong className="text-gray-700">Pendiente: </strong>{visita.proximos_pasos}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* SECCIÓN DE CITAS PREVIAS */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                          Citas Programadas
                        </h4>
                        
                        {errorCitas ? (
                          <div className="p-4 bg-red-50 text-danger rounded-md text-sm border border-red-200">
                            Error cargando citas: {errorCitas}
                          </div>
                        ) : loadingCitas ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : citas.length === 0 ? (
                          <p className="text-gray-500 text-sm">Este paciente no tiene citas registradas.</p>
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
                                            cita?.estado === 'cancelada' ? 'bg-danger' : 'bg-gray-400'}`}>
                                          <Clock className="h-4 w-4 text-white" aria-hidden="true" />
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
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE NUEVA VISITA */}
      <VisitaFormModal 
        isOpen={isVisitaModalOpen}
        onClose={() => setIsVisitaModalOpen(false)}
        pacienteId={paciente.id}
        onSaveSuccess={fetchVisitas}
      />
    </>
  )
}
