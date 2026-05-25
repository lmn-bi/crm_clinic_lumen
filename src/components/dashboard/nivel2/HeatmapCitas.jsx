import React from 'react'
import { Calendar } from 'lucide-react'

// Nombres de los días de la semana ordenados desde Lunes a Domingo
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORAS = Array.from({ length: 13 }, (_, i) => i + 8) // 08:00 a 20:00 (13 horas)

/**
 * Helper para extraer día (0=Dom, 6=Sáb) y hora en la zona de Madrid de forma robusta.
 */
const getMadridDayAndHour = (dateStr) => {
  try {
    const d = new Date(dateStr)
    const madridStr = d.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
    const madridDate = new Date(madridStr)
    return {
      day: madridDate.getDay(),
      hour: madridDate.getHours()
    }
  } catch (e) {
    return { day: 1, hour: 8 }
  }
}

/**
 * Componente HeatmapCitas - Mapa de Calor interactivo en CSS Grid + Tailwind.
 */
export default function HeatmapCitas({ citasPeriodo = [] }) {
  const isDataEmpty = citasPeriodo.length === 0

  if (isDataEmpty) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
          Mapa de Calor — Densidad de Citas por Hora y Día
        </h3>
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 font-semibold">Sin datos para el período seleccionado</p>
          <p className="text-3xs text-gray-400 mt-1">Asegúrate de que hay citas registradas en el período activo.</p>
        </div>
      </div>
    )
  }

  // 1. Inicializar matriz de 7 días (Lunes-Domingo) x 13 horas (8-20)
  // Estructura: matriz[diaIdx][horaIdx]
  const matrix = Array.from({ length: 7 }, () => Array(13).fill(0))
  let maxGlobal = 0

  // 2. Poblar matriz
  citasPeriodo.forEach((cita) => {
    if (!cita.inicio) return
    const { day, hour } = getMadridDayAndHour(cita.inicio)

    // Convertir día (0=Dom, 1=Lun...) a índice Lunes=0 ... Domingo=6
    const dayIdx = day === 0 ? 6 : day - 1
    const hourIdx = hour - 8 // 8h es índice 0

    if (dayIdx >= 0 && dayIdx < 7 && hourIdx >= 0 && hourIdx < 13) {
      matrix[dayIdx][hourIdx]++
    }
  })

  // 3. Obtener el máximo global para normalizar intensidades
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 13; h++) {
      if (matrix[d][h] > maxGlobal) {
        maxGlobal = matrix[d][h]
      }
    }
  }

  // Helper para asignar clase de color e intensidad
  const getCellStyles = (count) => {
    if (count === 0) {
      return 'bg-gray-50 text-gray-300'
    }
    const ratio = maxGlobal > 0 ? count / maxGlobal : 0

    if (ratio < 0.33) {
      return 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-2xs'
    }
    if (ratio < 0.66) {
      return 'bg-blue-300 text-blue-900 hover:bg-blue-400 shadow-2xs'
    }
    return 'bg-blue-600 text-white font-extrabold hover:bg-blue-700 shadow-xs'
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full transition-all duration-300">
      
      {/* Título y Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Mapa de Calor — Densidad de Citas por Hora y Día
          </h3>
          <p className="text-3xs text-gray-400 mt-0.5">
            Concentración de citas acumuladas por franja horaria en la zona horaria local.
          </p>
        </div>
      </div>

      {/* Grid del Heatmap */}
      <div className="overflow-x-auto select-none">
        <div className="min-w-[550px] space-y-1.5 p-1">
          
          {/* Fila de Encabezados de Columna (Días) */}
          <div className="grid grid-cols-[55px_repeat(7,1fr)] gap-1.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            <div></div> {/* Esquina vacía */}
            {DIAS_CORTOS.map((d) => (
              <div key={d} className="py-1 bg-gray-50 rounded-lg border border-gray-100">{d}</div>
            ))}
          </div>

          {/* Filas de Horas */}
          {HORAS.map((h, hIdx) => (
            <div key={h} className="grid grid-cols-[55px_repeat(7,1fr)] gap-1.5 items-center">
              
              {/* Etiqueta de la hora (Eje Y) */}
              <div className="text-[10px] font-extrabold text-gray-400 text-right pr-2">
                {h.toString().padStart(2, '0')}h
              </div>

              {/* Celdas de los días para esta hora */}
              {Array.from({ length: 7 }).map((_, dIdx) => {
                const count = matrix[dIdx][hIdx]
                const cellClass = getCellStyles(count)
                const diaNombre = DIAS_NOMBRES[dIdx]

                return (
                  <div
                    key={dIdx}
                    className={`h-9 flex items-center justify-center rounded-xl text-3xs font-semibold cursor-pointer transition-all duration-150 transform hover:scale-105 border border-transparent ${cellClass} relative group`}
                  >
                    <span>{count}</span>

                    {/* Tooltip personalizado premium */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-gray-900 text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap leading-none">
                        {diaNombre} {h.toString().padStart(2, '0')}:00h • <span className="text-blue-300">{count} citas</span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.75"></div>
                    </div>

                  </div>
                )
              })}
            </div>
          ))}

        </div>
      </div>

      {/* Leyenda interactiva al pie */}
      <div className="mt-5 pt-3.5 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        <span>Menos citas</span>
        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-gray-150 border border-gray-200"></span>
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-200"></span>
            <span>Baja</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-300 border border-blue-400"></span>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-600 border border-blue-700"></span>
            <span>Alta</span>
          </div>
        </div>
        <span>Más citas</span>
      </div>

    </div>
  )
}
