import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Phone, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import useCitasRealtime from '../../hooks/useCitasRealtime'
import CitaFormModal from './CitaFormModal'
import CitaDetailModal from './CitaDetailModal'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HORAS = Array.from({ length: 13 }, (_, i) => i + 8) // 8 a 20 (13 horas)

// Helper para obtener el Lunes de una fecha
function getLunes(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Ajuste si es Domingo (0)
  return new Date(date.setDate(diff))
}

export default function CalendarioMain() {
  const { perfil } = useAuth()
  const isAdmin = perfil?.rol === 'admin'

  // Estados de tiempo
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Derivar inicio y fin de la semana visible en base a currentDate (Lunes a Domingo)
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

  // Filtros
  const [doctores, setDoctores] = useState([])
  const [doctorIdFiltro, setDoctorIdFiltro] = useState('')

  // Efecto para inicializar el filtro de doctor según rol
  useEffect(() => {
    if (perfil) {
      if (isAdmin) {
        // Cargar lista de doctores para el admin
        supabase.from('doctores').select('id, nombre, apellidos').eq('activo', true)
          .then(({ data }) => setDoctores(data || []))
        setDoctorIdFiltro('') // "Todos"
      } else {
        // El doctor solo se ve a sí mismo
        setDoctorIdFiltro(perfil.doctor_id)
      }
    }
  }, [perfil, isAdmin])

  // Hook de citas
  const { citas, loading } = useCitasRealtime(inicioSemana, finSemana, doctorIdFiltro || null)

  // Estados para Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [selectedCita, setSelectedCita] = useState(null)
  
  // Pre-seleccionados para el Form
  const [formFechaStr, setFormFechaStr] = useState('')
  const [formHoraStr, setFormHoraStr] = useState('')

  // Manejadores de navegación
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

  // Renderizado del título
  const tituloRango = `${inicioSemana.getDate()} ${inicioSemana.toLocaleDateString('es-ES', { month: 'short' })} - ${finSemana.getDate()} ${finSemana.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`

  // Calcular días de la semana
  const diasSemana = useMemo(() => {
    return DIAS.map((nombreDia, idx) => {
      const d = new Date(inicioSemana)
      d.setDate(d.getDate() + idx)
      return {
        nombre: nombreDia,
        fechaStrLocal: d.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }),
        fechaStrISO: d.toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }), // YYYY-MM-DD
        esHoy: d.toDateString() === new Date().toDateString(),
        fechaObj: d
      }
    })
  }, [inicioSemana])

  // Manejar clic en un hueco vacío
  const handleSlotClick = (fechaStrISO, hora) => {
    setFormFechaStr(fechaStrISO)
    setFormHoraStr(`${hora.toString().padStart(2, '0')}:00`)
    setIsFormOpen(true)
  }

  // Calcular posición y altura (1 min = 1px, 1 hora = 60px)
  // Inicio a las 08:00 (offset = 8 * 60 = 480px)
  const getCitaStyle = (cita) => {
    // Usamos la hora de España para posicionar visualmente correctamente
    const dateInicio = new Date(cita.inicio)
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    const timeParts = formatter.formatToParts(dateInicio)
    const hour = parseInt(timeParts.find(p => p.type === 'hour').value)
    const min = parseInt(timeParts.find(p => p.type === 'minute').value)
    
    const minutesFromStartOfDay = hour * 60 + min
    const offsetBase = 8 * 60 // El grid empieza a las 08:00
    
    // Si la cita empieza antes de las 8, o termina después de las 20, requeriría lógica extra, 
    // pero limitaremos visualmente (clipping).
    const topPx = Math.max(0, minutesFromStartOfDay - offsetBase)
    const heightPx = cita.duracion_min || 30 // Fallback
    
    const color = cita.doctores?.color_calendario || '#3B82F6'

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
      backgroundColor: color,
      borderLeftColor: adjustColor(color, -30) // Borde izquierdo un poco más oscuro
    }
  }

  // Utilidad para oscurecer el color hex para el borde
  const adjustColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
  }

  // Agrupar citas por día (usando YYYY-MM-DD en hora local)
  const citasPorDia = useMemo(() => {
    const grupos = {}
    diasSemana.forEach(d => grupos[d.fechaStrISO] = [])
    
    citas.forEach(cita => {
      // Formateamos la fecha en zona horaria local para saber a qué columna pertenece
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
          <div className="flex items-center">
            <label className="text-sm text-gray-500 mr-2">Ver agenda de:</label>
            <select
              value={doctorIdFiltro}
              onChange={(e) => setDoctorIdFiltro(e.target.value)}
              className="border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary py-1.5 pl-3 pr-8"
            >
              <option value="">Todos los doctores</option>
              {doctores.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.nombre} {d.apellidos}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* GRID DEL CALENDARIO */}
      <div className="flex flex-1 overflow-auto">
        <div className="flex w-full min-w-[800px]"> {/* Aseguramos scroll en móvil */}
          
          {/* Columna de Horas */}
          <div className="w-16 flex-none bg-white border-r border-gray-200 z-10 sticky left-0">
            <div className="h-12 border-b border-gray-200 bg-gray-50"></div> {/* Espacio vacío arriba izquierda */}
            <div className="relative" style={{ height: `${HORAS.length * 60}px` }}>
              {HORAS.map((h, i) => (
                <div key={h} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2" style={{ top: `${i * 60}px` }}>
                  {h}:00
                </div>
              ))}
            </div>
          </div>

          {/* Días y Columnas */}
          <div className="flex-1 flex bg-gray-50 relative">
            {diasSemana.map((dia, index) => (
              <div key={dia.fechaStrISO} className="flex-1 border-r border-gray-200 min-w-[100px] flex flex-col">
                {/* Cabecera del día */}
                <div className={`h-12 border-b border-gray-200 flex flex-col items-center justify-center sticky top-0 z-10 ${dia.esHoy ? 'bg-blue-50' : 'bg-white'}`}>
                  <span className={`text-xs uppercase font-medium ${dia.esHoy ? 'text-primary' : 'text-gray-500'}`}>{dia.nombre}</span>
                  <span className={`text-lg leading-tight ${dia.esHoy ? 'font-bold text-primary' : 'text-gray-900'}`}>{dia.fechaObj.getDate()}</span>
                </div>

                {/* Slots y Citas */}
                <div className="relative flex-1 bg-white" style={{ height: `${HORAS.length * 60}px` }}>
                  {/* Líneas divisorias de horas */}
                  {HORAS.map((h, i) => (
                    <div 
                      key={`slot-${dia.fechaStrISO}-${h}`} 
                      className="absolute w-full border-b border-gray-100 hover:bg-gray-50 cursor-pointer" 
                      style={{ top: `${i * 60}px`, height: '60px' }}
                      onClick={() => handleSlotClick(dia.fechaStrISO, h)}
                    />
                  ))}

                  {/* Renderizado de citas */}
                  {citasPorDia[dia.fechaStrISO]?.map(cita => {
                    const style = getCitaStyle(cita)
                    
                    return (
                      <div
                        key={cita.id}
                        onClick={() => { setSelectedCita(cita); setIsDetailOpen(true); }}
                        className="absolute left-1 right-1 rounded cursor-pointer overflow-hidden text-white opacity-90 hover:opacity-100 transition-opacity border-l-4 shadow-sm"
                        style={style}
                        title={`${cita.tipo_tratamiento} - ${cita.pacientes?.nombre} ${cita.pacientes?.apellidos}`}
                      >
                        <div className="px-1.5 py-0.5 text-xs leading-tight h-full overflow-hidden flex flex-col">
                          <div className="font-semibold truncate flex items-center justify-between">
                            <span className="truncate">{cita.pacientes?.nombre}</span>
                            {cita.origen === 'telefono' && <Phone className="w-3 h-3 ml-1 flex-shrink-0" />}
                          </div>
                          <div className="text-[10px] opacity-90 truncate mt-0.5">
                            {cita.tipo_tratamiento}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Línea roja de hora actual (solo si esHoy) */}
                  {dia.esHoy && (() => {
                    const ahora = new Date()
                    const currHour = ahora.getHours()
                    const currMin = ahora.getMinutes()
                    if (currHour >= 8 && currHour < 20) {
                      const top = (currHour - 8) * 60 + currMin
                      return (
                        <div 
                          className="absolute w-full border-t-2 border-red-500 z-20 pointer-events-none" 
                          style={{ top: `${top}px` }}
                        >
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

      {/* MODALES */}
      <CitaFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        fechaInicio={formFechaStr}
        horaInicio={formHoraStr}
        onSaveSuccess={() => { /* Realtime lo actualiza solo */ setIsFormOpen(false) }}
      />

      <CitaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        cita={selectedCita}
        onSaveSuccess={() => { /* Realtime lo actualiza solo */ }}
      />
    </div>
  )
}
