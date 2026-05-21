import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Landmark } from 'lucide-react'

// Nombres de los meses en español para etiquetado
const NOMBRES_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/**
 * Agrupa las citas por mes en el período y calcula el total presupuestado y cobrado.
 */
const agruparPorMes = (citas) => {
  const meses = {}

  citas.forEach((cita) => {
    if (!cita.inicio) return
    const date = new Date(cita.inicio)
    const year = date.getFullYear()
    const month = date.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`

    if (!meses[key]) {
      meses[key] = {
        key,
        year,
        month,
        cobrado: 0,
        presupuestado: 0
      }
    }

    const costo = parseFloat(cita.costo_treatment) || parseFloat(cita.costo_tratamiento) || 0
    const pres = parseFloat(cita.presupuesto) || 0

    if (cita.estado === 'completada') {
      meses[key].cobrado += costo
    }
    
    // El presupuesto se suma para cualquier estado excepto canceladas
    if (cita.estado !== 'cancelada') {
      meses[key].presupuestado += pres
    }
  })

  // Convertimos a array y ordenamos cronológicamente
  const dataOrdenada = Object.values(meses).sort((a, b) => a.key.localeCompare(b.key))

  return dataOrdenada.map((item) => ({
    name: `${NOMBRES_MESES[item.month]} ${String(item.year).slice(-2)}`,
    Cobrado: item.cobrado,
    Presupuestado: item.presupuestado
  }))
}

/**
 * Formateador de moneda simplificado para los ejes del gráfico.
 */
const formatEjeY = (valor) => {
  if (valor >= 1000) {
    return `${(valor / 1000).toFixed(1).replace('.', ',')}k €`
  }
  return `${valor} €`
}

/**
 * Formateador completo para el Tooltip.
 */
const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor)
}

/**
 * Tooltip personalizado con estilos premium.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-150 rounded-xl p-3.5 shadow-lg max-w-sm">
        <p className="text-2xs font-extrabold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
        <div className="flex flex-col gap-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="text-xs font-bold text-gray-900">
                {formatMoneda(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

/**
 * Gráfico de Área comparativo entre ingresos Cobrados e ingresos Presupuestados.
 */
export default function GraficoIngresosMensuales({ citasPeriodo = [] }) {
  const chartData = agruparPorMes(citasPeriodo)
  const isDataEmpty = chartData.length === 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 transition-all duration-300">
      {/* Título de la Sección */}
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Evolución Mensual: Cobrado vs Presupuestado
        </h3>
      </div>

      {isDataEmpty ? (
        <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl bg-gray-50 gap-2">
          <p className="text-xs text-gray-500 font-semibold">Sin datos de facturación para el período seleccionado</p>
          <p className="text-3xs text-gray-400">Prueba ampliando el rango de fechas de tu consulta.</p>
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                {/* Gradiente para Presupuestado (Azul) */}
                <linearGradient id="colorPresupuestado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                </linearGradient>
                {/* Gradiente para Cobrado (Verde) */}
                <linearGradient id="colorCobrado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              
              <YAxis 
                tickFormatter={formatEjeY}
                tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', paddingTop: '15px' }}
              />
              
              {/* Presupuestado: Área azul */}
              <Area
                type="monotone"
                dataKey="Presupuestado"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPresupuestado)"
                name="Presupuestado"
                activeDot={{ r: 5 }}
              />
              
              {/* Cobrado: Área verde */}
              <Area
                type="monotone"
                dataKey="Cobrado"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCobrado)"
                name="Cobrado"
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
