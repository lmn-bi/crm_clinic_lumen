import React, { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { Calendar } from 'lucide-react'

// Mapeo JS getDay() a nombres y orden Lunes-Domingo
const DIAS_MAPPING = {
  1: { key: 'Lun', nombre: 'Lunes', order: 0 },
  2: { key: 'Mar', nombre: 'Martes', order: 1 },
  3: { key: 'Mié', nombre: 'Miércoles', order: 2 },
  4: { key: 'Jue', nombre: 'Jueves', order: 3 },
  5: { key: 'Vie', nombre: 'Viernes', order: 4 },
  6: { key: 'Sáb', nombre: 'Sábado', order: 5 },
  0: { key: 'Dom', nombre: 'Domingo', order: 6 }
}

export default function GraficoCitasPorDia({ citasPeriodo = [] }) {
  const isDataEmpty = citasPeriodo.length === 0

  const chartData = useMemo(() => {
    if (isDataEmpty) return []

    // 1. Inicializar estructura agrupada por día de la semana
    const counts = {
      0: { total: 0, key: 'Dom', nombre: 'Domingo', order: 6 },
      1: { total: 0, key: 'Lun', nombre: 'Lunes', order: 0 },
      2: { total: 0, key: 'Mar', nombre: 'Martes', order: 1 },
      3: { total: 0, key: 'Mié', nombre: 'Miércoles', order: 2 },
      4: { total: 0, key: 'Jue', nombre: 'Jueves', order: 3 },
      5: { total: 0, key: 'Vie', nombre: 'Viernes', order: 4 },
      6: { total: 0, key: 'Sáb', nombre: 'Sábado', order: 5 }
    }

    // 2. Extraer fechas de inicio en la zona horaria 'Europe/Madrid'
    const timestamps = []
    citasPeriodo.forEach(cita => {
      if (!cita.inicio) return
      try {
        const d = new Date(cita.inicio)
        const madridStr = d.toLocaleString('en-US', { timeZone: 'Europe/Madrid' })
        const madridDate = new Date(madridStr)
        const day = madridDate.getDay() // 0=Dom, 1=Lun...
        counts[day].total++
        timestamps.push(madridDate.getTime())
      } catch (e) {
        // Ignorar citas inválidas
      }
    })

    // 3. Calcular cantidad de semanas que cubre el período
    let semanas = 1
    if (timestamps.length > 0) {
      const minTime = Math.min(...timestamps)
      const maxTime = Math.max(...timestamps)
      const diffDays = Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) || 1
      semanas = Math.max(1, diffDays / 7)
    }

    // 4. Convertir a array ordenado (Lunes a Domingo) y calcular promedios
    const formattedData = Object.values(counts)
      .map(d => ({
        ...d,
        promedio: Number((d.total / semanas).toFixed(1))
      }))
      .sort((a, b) => a.order - b.order)

    // 5. Encontrar el día con el máximo volumen de citas
    let maxVal = 0
    formattedData.forEach(d => {
      if (d.total > maxVal) maxVal = d.total
    })

    // 6. Marcar el máximo valor en los datos
    return formattedData.map(d => ({
      ...d,
      isMax: d.total > 0 && d.total === maxVal
    }))
  }, [citasPeriodo, isDataEmpty])

  // Día de mayor actividad
  const mejorDia = useMemo(() => {
    if (chartData.length === 0) return null
    return chartData.find(d => d.isMax)
  }, [chartData])

  if (isDataEmpty) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[360px] flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Actividad por Día de la Semana
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 my-3">
          <p className="text-xs text-gray-500 font-semibold">Sin datos para el período seleccionado</p>
          <p className="text-3xs text-gray-400 mt-1">Asegúrate de que hay citas registradas en el período activo.</p>
        </div>
      </div>
    )
  }

  // Renderizador de etiqueta premium sobre la columna más alta
  const renderCustomLabel = (props) => {
    const { x, y, width, index } = props
    const entry = chartData[index]
    if (entry && entry.isMax) {
      return (
        <text 
          x={x + width / 2} 
          y={y - 12} 
          fill="#1A56DB" 
          textAnchor="middle" 
          className="text-[9px] font-extrabold uppercase tracking-widest bg-white"
        >
          ★ Mejor día
        </text>
      )
    }
    return null
  }

  // Tooltip personalizado premium para el volumen diario
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-800 text-white rounded-xl p-3 shadow-xl text-3xs font-semibold leading-normal">
          <p className="text-blue-300 font-bold border-b border-gray-800 pb-1.5 mb-1.5 uppercase tracking-wider">{data.nombre}</p>
          <p className="text-white font-extrabold text-[11px]">{data.total} citas totales</p>
          <p className="text-gray-400 mt-0.5">Promedio: {data.promedio} por semana</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[360px] flex flex-col justify-between transition-all duration-300">
      
      {/* Título de la tarjeta */}
      <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Actividad por Día de la Semana
          </h3>
          <p className="text-3xs text-gray-400 mt-0.5">
            Volumen acumulativo y promedio semanal de citas distribuidas por día.
          </p>
        </div>
      </div>

      {/* Gráfico BarChart de Recharts */}
      <div className="flex-1 w-full min-h-0 py-2">
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} margin={{ top: 25, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="key" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }} 
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6', opacity: 0.5 }} />
            
            <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isMax ? '#1A56DB' : '#93C5FD'} />
              ))}
              <LabelList dataKey="total" content={renderCustomLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recomendación automática al pie */}
      {mejorDia && mejorDia.total > 0 && (
        <div className="mt-2 pt-3 border-t border-gray-50 text-2xs text-gray-500 text-center leading-normal">
          El día con más actividad es el <strong className="text-blue-600 font-extrabold uppercase tracking-wide">{mejorDia.nombre}</strong> con <strong className="text-gray-800 font-bold">{mejorDia.total} citas</strong> en el período.
        </div>
      )}

    </div>
  )
}
