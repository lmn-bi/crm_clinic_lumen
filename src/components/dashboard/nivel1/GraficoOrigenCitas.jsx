import React from 'react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Compass, Sparkles } from 'lucide-react'

// Configuración de canales de entrada
const CANALES_CONFIG = {
  web: { name: 'Web (Staff)', color: '#3B82F6' },
  telefono: { name: 'Agente de Voz', color: '#8B5CF6' },
  manual: { name: 'Manual', color: '#6B7280' }
}

/**
 * Agrupa y calcula los contadores de origen de citas.
 */
const procesarOrigen = (citas) => {
  const conteos = {
    web: 0,
    telefono: 0,
    manual: 0
  }

  citas.forEach((c) => {
    const origenKey = c.origen || 'manual'
    if (conteos[origenKey] !== undefined) {
      conteos[origenKey]++
    } else {
      conteos.manual++
    }
  })

  const total = citas.length

  return Object.keys(conteos).map((key) => {
    const count = conteos[key]
    const percent = total > 0 ? (count / total) * 100 : 0
    return {
      key,
      name: CANALES_CONFIG[key].name,
      value: count,
      percent: percent,
      color: CANALES_CONFIG[key].color
    }
  })
}

/**
 * Tooltip personalizado para el gráfico de barras horizontales.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-150 rounded-xl p-2.5 shadow-lg">
        <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-gray-700">
          <span 
            className="w-2.5 h-2.5 rounded-full inline-block" 
            style={{ backgroundColor: data.color }}
          />
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
 * Gráfico de barras horizontales mostrando el origen (impacto del Agente de Voz).
 */
export default function GraficoOrigenCitas({ citasPeriodo = [] }) {
  const chartData = procesarOrigen(citasPeriodo)
  const total = citasPeriodo.length

  // Obtener estadísticas del agente de voz (origen = telefono)
  const telData = chartData.find(item => item.key === 'telefono')
  const telCount = telData ? telData.value : 0
  const telPercent = telData ? telData.percent : 0

  const isDataEmpty = total === 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm transition-all duration-300 h-full flex flex-col justify-between">
      {/* Título de la Sección */}
      <div className="flex items-center gap-2 mb-3">
        <Compass className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Origen de las Citas
        </h3>
      </div>

      {isDataEmpty ? (
        <div className="h-[170px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50 gap-1.5">
          <p className="text-xs text-gray-500 font-semibold">Sin citas registradas</p>
          <p className="text-3xs text-gray-400">No hay datos de procedencia disponibles.</p>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between gap-4">
          {/* Gráfico de barras horizontales */}
          <div className="h-[110px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 30, bottom: 5 }}
                barSize={12}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Badge de Impacto del Agente de Voz */}
          {telCount > 0 ? (
            <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3 flex items-center gap-3 animate-pulse">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs text-purple-950 font-bold leading-tight">
                El Agente de Voz gestionó el{' '}
                <span className="text-purple-700 font-extrabold text-sm underline decoration-wavy decoration-purple-300">
                  {telPercent.toFixed(1).replace('.', ',')}%
                </span>{' '}
                de las citas del período ({telCount} de {total}).
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-2xs text-gray-500 font-semibold leading-tight">
                El Agente de Voz no ha gestionado citas en el período actual.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
