import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

// Formateador de moneda en español
const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0)
}

export default function GraficoTopTratamientos({ citasPeriodo = [] }) {
  const isDataEmpty = citasPeriodo.length === 0

  // Procesamiento de datos para el gráfico
  const { chartData, topRelevante } = useMemo(() => {
    if (isDataEmpty) {
      return { chartData: [], topRelevante: null }
    }

    // 1. Agrupar citas por tipo de tratamiento
    const agrupado = {}

    citasPeriodo.forEach(cita => {
      const cleanName = (cita.tipo_tratamiento || 'Otros').trim()
      const normalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase()

      if (!agrupado[normalized]) {
        agrupado[normalized] = {
          name: normalized,
          citas: 0,
          ingresos: 0
        }
      }

      // Sumamos 1 cita al volumen total
      agrupado[normalized].citas++

      // Si la cita está completada, sumamos los ingresos facturados
      if (cita.estado === 'completada') {
        const costo = parseFloat(cita.costo_tratamiento) || parseFloat(cita.costo_treatment) || 0
        agrupado[normalized].ingresos += costo
      }
    })

    // 2. Convertir a array, ordenar por volumen de citas (citas) descendente y tomar el top 8
    const sortedArray = Object.values(agrupado)
      .sort((a, b) => b.citas - a.citas)
      .slice(0, 8)

    // Redondear ingresos para evitar floats extraños
    const roundedData = sortedArray.map(item => ({
      ...item,
      ingresos: Number(item.ingresos.toFixed(2))
    }))

    // 3. Obtener el tratamiento con mayores ingresos (el rey de facturación)
    let maxIngresosItem = null
    let maxIngresosVal = 0

    roundedData.forEach(item => {
      if (item.ingresos > maxIngresosVal) {
        maxIngresosVal = item.ingresos
        maxIngresosItem = item
      }
    })

    return {
      chartData: roundedData,
      topRelevante: maxIngresosItem
    }
  }, [citasPeriodo, isDataEmpty])

  if (isDataEmpty) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[400px] flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Rendimiento por Tipo de Tratamiento
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50 my-3">
          <p className="text-xs text-gray-500 font-semibold">Sin datos para el período seleccionado</p>
          <p className="text-3xs text-gray-400 mt-1">Asegúrate de que hay citas registradas en el período activo.</p>
        </div>
      </div>
    )
  }

  // Tooltip personalizado premium de Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 border border-gray-800 text-white rounded-xl p-3 shadow-xl text-3xs font-semibold leading-normal">
          <p className="text-blue-300 font-bold border-b border-gray-800 pb-1.5 mb-1.5 uppercase tracking-wider">{label}</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Volumen Citas:</span>
            <strong className="text-[11px] font-extrabold text-white">{data.citas}</strong>
          </p>
          <p className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Facturación:</span>
            <strong className="text-[11px] font-extrabold text-emerald-400">{formatMoneda(data.ingresos)}</strong>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[400px] flex flex-col justify-between transition-all duration-300">
      
      {/* Título de la tarjeta */}
      <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-3">
        <div className="p-2 bg-blue-55 text-blue-600 rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Rendimiento por Tipo de Tratamiento
          </h3>
          <p className="text-3xs text-gray-400 mt-0.5">
            Volumen de citas (demanda) comparado con los ingresos facturados (citas completadas).
          </p>
        </div>
      </div>
      {/* Gráfico BarChart de Recharts */}
      <div className="flex-1 w-full min-h-0 py-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 15, right: 20, left: 15, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
            
            {/* Eje de categorías (Tratamientos) */}
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }} 
              width={100}
            />

            {/* Eje 1 (Volumen - Citas) en el eje inferior */}
            <XAxis 
              type="number" 
              xAxisId="bottom"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#3B82F6', fontSize: 9, fontWeight: 'bold' }} 
            />

            {/* Eje 2 (Ingresos - €) en el eje superior */}
            <XAxis 
              type="number" 
              xAxisId="top"
              orientation="top"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#10B981', fontSize: 9, fontWeight: 'bold' }} 
              tickFormatter={(v) => `${v}€`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB', opacity: 0.7 }} />
            
            {/* Bar de volumen de citas */}
            <Bar 
              dataKey="citas" 
              fill="#3B82F6" 
              xAxisId="bottom" 
              radius={[0, 4, 4, 0]} 
              maxBarSize={12} 
              name="Volumen (Citas)" 
            />

            {/* Bar de ingresos (€) */}
            <Bar 
              dataKey="ingresos" 
              fill="#10B981" 
              xAxisId="top" 
              radius={[0, 4, 4, 0]} 
              maxBarSize={12} 
              name="Ingresos (€)" 
            />

          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda premium externa y análisis al pie */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-2.5">
        {/* Leyenda HTML */}
        <div className="flex justify-center items-center gap-6 select-none">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50/30 border border-blue-100/40">
            <span className="w-2 h-2 rounded-full inline-block bg-[#3B82F6]" />
            <span className="text-[10px] font-bold text-blue-800">Volumen (Citas)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50/30 border border-emerald-100/40">
            <span className="w-2 h-2 rounded-full inline-block bg-[#10B981]" />
            <span className="text-[10px] font-bold text-emerald-800">Ingresos (€)</span>
          </div>
        </div>

        {/* Recomendación inteligente automática en el pie */}
        {topRelevante && topRelevante.ingresos > 0 && (
          <div className="text-2xs text-gray-550 text-center leading-normal">
            El tratamiento estrella por facturación es <strong className="text-emerald-600 font-extrabold uppercase tracking-wide">{topRelevante.name}</strong>, sumando <strong className="text-gray-800 font-bold">{formatMoneda(topRelevante.ingresos)}</strong> facturados en <strong className="text-gray-800 font-bold">{topRelevante.citas} citas</strong>.
          </div>
        )}
      </div>
    </div>
  )
}
