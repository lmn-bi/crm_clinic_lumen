import React, { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function DoctorAgendaPanel({ isOpen, onClose, doctor }) {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && doctor) {
      fetchCitas()
    }
  }, [isOpen, doctor])

  const fetchCitas = async () => {
    setLoading(true)
    try {
      // Obtener citas de hoy en adelante (límite simple a 7 días para la vista semanal básica)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      
      const proximaSemana = new Date(hoy)
      proximaSemana.setDate(proximaSemana.getDate() + 7)

      const { data, error } = await supabase
        .from('citas')
        .select(`
          id,
          inicio,
          fin,
          estado,
          tipo_tratamiento,
          pacientes (
            nombre,
            apellidos
          )
        `)
        .eq('doctor_id', doctor.id)
        .gte('inicio', hoy.toISOString())
        .lte('inicio', proximaSemana.toISOString())
        .order('inicio', { ascending: true })

      if (error) throw error
      setCitas(data || [])
    } catch (error) {
      console.error('Error cargando citas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Agrupar citas por día
  const citasPorDia = citas.reduce((acc, cita) => {
    const fecha = new Date(cita.inicio).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(cita)
    return acc
  }, {})

  return (
    <>
      {/* Fondo oscuro */}
      <div 
        className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-50 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col bg-white">
          {/* Cabecera */}
          <div className="px-6 py-4 bg-primary text-white flex justify-between items-center shadow-md">
            <div>
              <h2 className="text-lg font-semibold">Agenda Semanal</h2>
              <p className="text-sm text-blue-100">Dr/a. {doctor?.nombre} {doctor?.apellidos}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-blue-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Contenido desplazable */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : Object.keys(citasPorDia).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No hay citas programadas para los próximos 7 días.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(citasPorDia).map(([fecha, citasDelDia]) => (
                  <div key={fecha} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 font-medium text-gray-700 capitalize flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
                      {fecha}
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {citasDelDia.map(cita => {
                        const inicio = new Date(cita.inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        const fin = new Date(cita.fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                        const pacienteNombre = cita.pacientes ? `${cita.pacientes.nombre} ${cita.pacientes.apellidos}` : 'Paciente Eliminado'
                        
                        let estadoColor = 'bg-yellow-100 text-yellow-800'
                        if (cita.estado === 'confirmada') estadoColor = 'bg-blue-100 text-blue-800'
                        if (cita.estado === 'completada') estadoColor = 'bg-green-100 text-green-800'
                        if (cita.estado === 'cancelada') estadoColor = 'bg-red-100 text-red-800'

                        return (
                          <li key={cita.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <div className="flex items-center text-sm font-semibold text-gray-900">
                                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                  {inicio} - {fin}
                                </div>
                                <div className="mt-1 text-sm text-gray-700">
                                  {pacienteNombre}
                                </div>
                                {cita.tipo_tratamiento && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {cita.tipo_tratamiento}
                                  </div>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${estadoColor}`}>
                                {cita.estado}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
