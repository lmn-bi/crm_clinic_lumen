import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import useCitasRealtime from '../../hooks/useCitasRealtime'
import CitaFormModal from './CitaFormModal'
import CitaDetailModal from './CitaDetailModal'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HORAS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 a 20 (13 horas)

function getLunes(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export default function CalendarioMain() {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin'

  const [currentDate, setCurrentDate] = useState(new Date())
  
  const inicioSemana = useMemo(() => {
    const l = getLunes(currentDate)
    l.setHours(0, 0, 0, 0)
    return l
  }, [currentDate])

  const finSemana = useMemo(() => {
    const f = new Date(inicioSemana)
    f.setDate(f.getDate() + 6)
    f.setHours(23, 59, 59, 999)
    return f
  }, [inicioSemana])

  const [doctores, setDoctores] = useState([])
  const [doctoresFiltro, setDoctoresFiltro] = useState([]) // array de UUIDs
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    if (perfil) {
      if (isAdmin) {
        supabase.from('doctores').select('id, nombre, apellidos, color_calendario').eq('activo', true)
          .then(({ data }) => setDoctores(data || []))
        setDoctoresFiltro([])
      } else {
        setDoctoresFiltro([perfil.doctor_id])
      }
    }
  }, [perfil, isAdmin])

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDoctorFiltro = (doctorId) => {
    setDoctoresFiltro(prev => {
      const next = prev.includes(doctorId) ? prev.filter(id => id !== doctorId) : [...prev, doctorId]
      return next.length === 0 ? [] : next
    })
  }

  // Se extrae refetch para forzar actualización al cerrar modales
  const { citas, loading, refetch } = useCitasRealtime(inicioSemana, finSemana, doctoresFiltro)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)
  
  const [formFechaStr, setFormFechaStr] = useState('')
  const [formHoraStr, setFormHoraStr] = useState('')

  const prevWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const nextWeek = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const tituloRango = `${inicioSemana.getDate()} ${inicioSemana.toLocaleDateString('es-ES', { month: 'short' })} - ${finSemana.getDate()} ${finSemana.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`

  const diasSemana = useMemo(() => {
    return DIAS.map((nombreDia, idx) => {
      const d = new Date(inicioSemana)
      d.setDate(d.getDate() + idx)
      return {
        nombre: nombreDia,
        fechaStrLocal: d.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
        fechaStrISO: d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }),
        esHoy: d.toDateString() === new Date().toDateString(),
        fechaObj: d,
        esFinDeSemana: d.getDay() === 0 || d.getDay() === 6
      }
    })
  }, [inicioSemana])

  const handleSlotClick = (fechaStrISO, hora) => {
    setFormFechaStr(fechaStrISO)
    setFormHoraStr(`${hora.toString().padStart(2, '0')}:00`)
    setIsFormOpen(true)
  }

  // --- DRAG AND DROP ---
  const handleDragStart = (e, cita) => {
    e.dataTransfer.setData('citaId', cita.id)
    e.dataTransfer.setData('duracionMin', cita.duracion_min || 30)
  }

  const handleDragOver = (e) => {
    e.preventDefault() // Necesario para permitir soltar
  }

  const handleDrop = async (e, fechaStrISO, hora) => {
    e.preventDefault()
    const citaId = e.dataTransfer.getData('citaId')
    const duracionMin = parseInt(e.dataTransfer.getData('duracionMin'), 10)
    
    if (!citaId) return

    // Calcular la nueva fecha/hora de inicio
    const startDate = new Date(`${fechaStrISO}T${hora.toString().padStart(2, '0')}:00`)
    // Asumir que la hora es en la zona horaria de España
    const endDate = new Date(startDate.getTime() + duracionMin * 60000)

    try {
      const { error } = await supabase
        .from('citas')
        .update({
          inicio: startDate.toISOString(),
          fin: endDate.toISOString()
        })
        .eq('id', citaId)
      
      if (error) {
        if (error.code === '23P01') {
          alert('Error: Ese horario ya está ocupado para el doctor asignado.')
        } else {
          alert('Error al mover la cita: ' + error.message)
        }
      }
      refetch() // Recargar para mostrar nueva posición
    } catch (err) {
      console.error(err)
    }
  }

  const getCitaStyle = (cita) => {
    const dateInicio = new Date(cita.inicio)
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    const timeParts = formatter.formatToParts(dateInicio)
    const hour = parseInt(timeParts.find(p => p.type === 'hour').value)
    const min = parseInt(timeParts.find(p => p.type === 'minute').value)
    
    const minutesFromStartOfDay = hour * 60 + min
    const offsetBase = 8 * 60
    
    // Altura de fila 120px = SCALE 2 (1 min = 2px)
    const SCALE = 120 / 60
    const topPx = Math.max(0, (minutesFromStartOfDay - offsetBase) * SCALE)
    const heightPx = Math.max(20, (cita.duracion_min || 30) * SCALE)
    
    const color = cita.doctores?.color_calendario || '#3B82F6'

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
      backgroundColor: color,
      borderLeftColor: adjustColor(color, -30)
    }
  }

  const adjustColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  const getSemaforoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-400'
      case 'confirmada': return 'bg-blue-400' // Cambio 2: Punto azul para confirmada
      case 'completada': return 'bg-green-400'
      case 'no_show': return 'bg-gray-600'
      case 'cancelada':
      default: return null
    }
  }

  const citasPorDia = useMemo(() => {
    const grupos = {}
    diasSemana.forEach(d => grupos[d.fechaStrISO] = [])
    
    citas.forEach(cita => {
      const isoLocal = new Date(cita.inicio).toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
      if (grupos[isoLocal]) {
        grupos[isoLocal].push(cita)
      }
    })
    return grupos
  }, [citas, diasSemana])

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* CABECERA (Controles) */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50">
            Hoy
          </button>
          <div className="flex items-center space-x-1">
            <button onClick={prevWeek} className="p-1.5 rounded-full hover:bg-gray-100" title="Semana anterior">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center capitalize">
              {tituloRango}
            </span>
            <button onClick={nextWeek} className="p-1.5 rounded-full hover:bg-gray-100" title="Semana siguiente">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {loading && <span className="flex h-3 w-3"><span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
        </div>

        {/* Filtro de doctores (Solo admin) */}
        {isAdmin && (
          <div className="relative flex items-center" ref={filterRef}>
            <label className="text-sm text-gray-500 mr-2">Ver agenda de:</label>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
            >
              {doctoresFiltro.length === 0 ? 'Todos los doctores ▼' : 
               doctoresFiltro.length === 1 ? '1 doctor ▼' : 
               `${doctoresFiltro.length} doctores ▼`}
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full right-0 z-50 bg-white shadow-lg rounded-md border border-gray-200 min-w-[220px] mt-1 py-1">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-100">
                  <input type="checkbox" checked={doctoresFiltro.length === 0} onChange={() => setDoctoresFiltro([])} />
                  Todos los doctores
                </label>
                <div className="max-h-60 overflow-y-auto">
                  {doctores.map(doctor => (
                    <label key={doctor.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={doctoresFiltro.includes(doctor.id)}
                        onChange={() => toggleDoctorFiltro(doctor.id)} 
                      />
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: doctor.color_calendario || '#3B82F6' }}></span>
                      <span className="text-sm text-gray-700 truncate">Dr/a. {doctor.nombre} {doctor.apellidos}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GRID DEL CALENDARIO */}
      <div className="flex flex-1 overflow-auto">
        <div className="flex w-full min-w-[800px]">
          
          {/* Columna de Horas */}
          <div className="w-16 flex-none bg-white border-r border-gray-200 z-10 sticky left-0">
            <div className="h-12 border-b border-gray-200 bg-gray-50"></div>
            <div className="relative" style={{ height: `${HORAS.length * 120}px` }}>
              {HORAS.map((h, i) => (
                <div key={h} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2" style={{ top: `${i * 120}px` }}>
                  {h}:00
                </div>
              ))}
            </div>
          </div>

          {/* Días y Columnas */}
          <div className="flex-1 flex relative bg-gray-50">
            {diasSemana.map((dia) => (
              <div key={dia.fechaStrISO} className="flex-1 border-r border-gray-200 min-w-[100px] flex flex-col">
                <div className={`h-12 border-b border-gray-200 flex flex-col items-center justify-center sticky top-0 z-10 ${dia.esHoy ? 'bg-blue-50' : 'bg-white'}`}>
                  <span className={`text-xs uppercase font-medium ${dia.esHoy ? 'text-primary' : 'text-gray-500'}`}>{dia.nombre}</span>
                  <span className={`text-lg leading-tight ${dia.esHoy ? 'font-bold text-primary' : 'text-gray-900'}`}>{dia.fechaObj.getDate()}</span>
                </div>

                <div className={`relative flex-1 ${dia.esFinDeSemana ? 'bg-gray-100' : 'bg-white'}`} style={{ height: `${HORAS.length * 120}px` }}>
                  {/* Slots */}
                  {HORAS.map((h, i) => (
                    <div 
                      key={`slot-${dia.fechaStrISO}-${h}`} 
                      className={`absolute w-full border-b border-gray-100 cursor-pointer ${dia.esFinDeSemana ? 'hover:bg-gray-200' : 'hover:bg-gray-50'}`} 
                      style={{ top: `${i * 120}px`, height: '120px' }}
                      onClick={() => handleSlotClick(dia.fechaStrISO, h)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dia.fechaStrISO, h)}
                    />
                  ))}

                  {/* Citas */}
                  {citasPorDia[dia.fechaStrISO]?.map(cita => {
                    const style = getCitaStyle(cita)
                    const dotColor = getSemaforoColor(cita.estado)
                    
                    return (
                      <div
                        key={cita.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, cita)}
                        onClick={() => { setSelectedCita(cita); setIsDetailOpen(true); }}
                        className="absolute left-1 right-1 rounded cursor-move overflow-hidden text-white opacity-90 hover:opacity-100 transition-opacity border-l-4 shadow-sm active:opacity-75"
                        style={style}
                        title={`${cita.tipo_tratamiento} - ${cita.pacientes?.nombre} ${cita.pacientes?.apellidos}`}
                      >
                        {dotColor && (
                          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dotColor} ring-1 ring-white z-10`}></span>
                        )}
                        
                        <div className="px-1.5 py-1 text-xs leading-tight h-full overflow-hidden flex flex-col">
                          <div className="font-semibold truncate flex items-center justify-between pr-3">
                            <span className="truncate">{cita.pacientes?.nombre} {cita.pacientes?.apellidos}</span>
                            {cita.origen === 'telefono' && (
                              <div title="Cita creada por Agente de Voz">
                                <Phone className="w-3 h-3 ml-1 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] opacity-90 truncate mt-0.5">
                            {cita.tipo_tratamiento}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Línea roja hora actual adaptada a SCALE 2 */}
                  {dia.esHoy && (() => {
                    const ahora = new Date()
                    const currHour = ahora.getHours()
                    const currMin = ahora.getMinutes()
                    if (currHour >= 8 && currHour < 20) {
                      const SCALE = 120 / 60
                      const top = ((currHour - 8) * 60 + currMin) * SCALE
                      return (
                        <div className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none" style={{ top: `${top}px` }}>
                          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500"></div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CitaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        fechaInicio={formFechaStr}
        horaInicio={formHoraStr}
        onSaveSuccess={() => { setIsFormOpen(false); refetch(); }}
      />

      <CitaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        cita={selectedCita}
        onSaveSuccess={() => { refetch(); }}
      />
    </div>
  )
}
