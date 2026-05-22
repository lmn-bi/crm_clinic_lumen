import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle2 } from 'lucide-react'

// Nombres legibles en español y colores asociados para cada estado
const ESTADOS_CONFIG = {
  completada: { label: 'Completadas', color: '#10B981' },
  confirmada: { label: 'Confirmadas', color: '#3B82F6' },
  pendiente: { label: 'Pendientes', color: '#F59E0B' },
  no_show: { label: 'No Presentadas', color: '#6B7280' },
  cancelada: { label: 'Canceladas', color: '#EF4444' }
}

/**
 * Agrupa y procesa la distribución de citas por su estado.
 */
const procesarEstados = (citas) => {
  const conteos = {
    completada: 0,
    confirmada: 0,
    pendiente: 0,
    no_show: 0,
    cancelada: 0
  }

  citas.forEach((c) => {
    if (conteos[c.estado] !== undefined) {
      conteos[c.estado]++
    }
  })

  const total = citas.length

  return Object.keys(conteos).map((key) => {
    const count = conteos[key]
    const percent = total > 0 ? (count / total) * 100 : 0
    return {
      name: ESTADOS_CONFIG[key].label,
      value: count,
      percent: percent,
      color: ESTADOS_CONFIG[key].color
    }
  })
}

/**
 * Tooltip personalizado para el gráfico circular.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div 
        className="bg-white border border-gray-150 rounded-xl p-2.5 shadow-lg select-none"
        style={{ backgroundColor: '#ffffff', opacity: 1 }}
      >
        <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-gray-700">
          <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
            <circle cx="5" cy="5" r="4.5" fill={data.color} />
          </svg>
          {data.name}
        </div>
        <p className="text-xs font-bold text-gray-900">
          Citas: <span className="text-blue-600 font-extrabold">{data.value}</span> ({data.percent.toFixed(1).replace('.', ',')}%)
        </p>
      </div>
    )
  }
  return null
}

/**
 * Gráfico Circular interactivo de distribución del estado de citas.
 */
export default function GraficoEstadoCitas({ citasPeriodo = [] }) {
  const rawData = procesarEstados(citasPeriodo)
  
  // Filtramos para el gráfico circular los estados que tengan al menos 1 cita
  const chartData = rawData.filter(item => item.value > 0)
  const isDataEmpty = citasPeriodo.length === 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-300 h-full flex flex-col justify-between">
      {/* Título de la Sección */}
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Estado de las Citas
        </h3>
      </div>

      {isDataEmpty ? (
        <div className="h-[230px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50 gap-1.5">
          <p className="text-xs text-gray-500 font-semibold">Sin citas registradas</p>
          <p className="text-3xs text-gray-400">No hay citas en este rango de fechas.</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full">
          {/* Gráfico circular */}
          <div className="h-[180px] w-full sm:w-1/2 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />} 
                  wrapperStyle={{ zIndex: 1000, outline: 'none' }}
                  cursor={false}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto en el centro de la rosquilla (Donut Chart) */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-850">{citasPeriodo.length}</span>
              <span className="text-[10px] text-gray-450 uppercase font-bold tracking-wider">Citas</span>
            </div>
          </div>

          {/* Leyenda personalizada a la derecha */}
          <div className="flex flex-col gap-2 w-full sm:w-1/2 justify-center">
            {rawData.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                  item.value > 0 ? 'bg-gray-50/50 hover:bg-gray-50' : 'opacity-40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
                    <circle cx="6" cy="6" r="5" fill={item.color} stroke="#ffffff" strokeWidth="1" />
                  </svg>
                  <span className="text-xs font-semibold text-gray-700 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-xs font-bold text-gray-850">{item.value}</span>
                  <span className="text-3xs text-gray-450 font-bold">
                    ({item.percent.toFixed(1).replace('.', ',')}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
