import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Users } from 'lucide-react'

export default function GraficoPacientesTipo({ citasPeriodo = [] }) {
  const isDataEmpty = citasPeriodo.length === 0

  // Procesamiento de datos para el gráfico
  const { chartData, tasaFidelizacion, nuevosTotal, recurrentesTotal } = useMemo(() => {
    if (isDataEmpty) {
      return { chartData: [], tasaFidelizacion: 0, nuevosTotal: 0, recurrentesTotal: 0 }
    }

    // 1. Ordenar citas cronológicamente por inicio
    const sortedCitas = [...citasPeriodo].sort((a, b) => {
      const timeA = a.inicio ? new Date(a.inicio).getTime() : 0
      const timeB = b.inicio ? new Date(b.inicio).getTime() : 0
      return timeA - timeB
    })

    // 2. Rastrear la primera aparición de cada paciente
    const primeraAparicion = {} // { pacienteId: mesStr }
    const mesesObj = {} // { mesStr: { nuevos: Set, recurrentes: Set, sortKey, label } }

    sortedCitas.forEach(cita => {
      if (!cita.inicio || !cita.paciente_id) return
      
      const d = new Date(cita.inicio)
      // Usar Madrid para la conversión de mes y año
      const labelMes = d.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', month: 'short' })
      const labelAno = d.getFullYear()
      const mesStr = `${labelMes.replace('.', '')} ${String(labelAno).slice(-2)}`

      const sortKey = d.getFullYear() * 12 + d.getMonth()

      if (!mesesObj[mesStr]) {
        mesesObj[mesStr] = {
          nuevos: new Set(),
          recurrentes: new Set(),
          sortKey,
          label: labelMes.charAt(0).toUpperCase() + labelMes.slice(1).replace('.', '') + ` ${String(labelAno).slice(-2)}`
        }
      }

      const pId = cita.paciente_id

      if (primeraAparicion[pId] === undefined) {
        // Primera aparición del paciente en todo el período filtrado
        primeraAparicion[pId] = mesStr
        mesesObj[mesStr].nuevos.add(pId)
      } else {
        // Aparición subsecuente
        const primerMes = primeraAparicion[pId]
        if (primerMes !== mesStr) {
          // Si aparece en un mes posterior, es recurrente en este mes
          mesesObj[mesStr].recurrentes.add(pId)
        }
      }
    })

    // 3. Convertir a array ordenado por fecha
    const sortedData = Object.values(mesesObj)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(item => ({
        name: item.label,
        nuevos: item.nuevos.size,
        recurrentes: item.recurrentes.size
      }))

    // 4. Calcular los totales acumulados del período para fidelización
    let totalNuevos = 0
    let totalRecurrentes = 0

    sortedData.forEach(item => {
      totalNuevos += item.nuevos
      totalRecurrentes += item.recurrentes
    })

    const totalPacientes = totalNuevos + totalRecurrentes
    const tasa = totalPacientes > 0 ? (totalRecurrentes / totalPacientes) * 100 : 0

    return {
      chartData: sortedData,
      tasaFidelizacion: Number(tasa.toFixed(1)),
      nuevosTotal: totalNuevos,
      recurrentesTotal: totalRecurrentes
    }
  }, [citasPeriodo, isDataEmpty])

  // Colores del semáforo de fidelización
  const getFidelityColorClass = (tasa) => {
    if (tasa > 60) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    if (tasa >= 40) return 'bg-amber-50 text-amber-700 border-amber-100'
    return 'bg-rose-50 text-rose-700 border-rose-100'
  }

  if (isDataEmpty) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[360px] flex flex-col justify-between">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Pacientes Nuevos vs Recurrentes por Mes
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
      return (
        <div className="bg-gray-900 border border-gray-800 text-white rounded-xl p-3 shadow-xl text-3xs font-semibold leading-normal">
          <p className="text-blue-300 font-bold border-b border-gray-800 pb-1.5 mb-1.5 uppercase tracking-wider">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}:</span>
              <strong className="text-[11px] font-extrabold text-white">{entry.value}</strong>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm w-full h-[360px] flex flex-col justify-between transition-all duration-300">
      
      {/* Título de la tarjeta */}
      <div className="flex items-center gap-2 mb-3 border-b border-gray-50 pb-3">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Pacientes Nuevos vs Recurrentes por Mes
          </h3>
          <p className="text-3xs text-gray-400 mt-0.5">
            Evolución mensual de pacientes de primera visita vs. pacientes fidelizados.
          </p>
        </div>
      </div>

      {/* Gráfico LineChart de Recharts */}
      <div className="flex-1 w-full min-h-0 py-1 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={165}>
          <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="name" 
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
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="monotone" 
              dataKey="nuevos" 
              stroke="#10B981" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 1 }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
              name="Nuevos" 
            />
            <Line 
              type="monotone" 
              dataKey="recurrentes" 
              stroke="#3B82F6" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 1 }} 
              activeDot={{ r: 6, strokeWidth: 0 }} 
              name="Recurrentes" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda premium externa y Resumen de fidelización sin solapamientos */}
      <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-2.5">
        {/* Leyenda HTML */}
        <div className="flex justify-center items-center gap-6 select-none">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50/30 border border-emerald-100/40">
            <span className="w-2 h-2 rounded-full inline-block bg-[#10B981]" />
            <span className="text-[10px] font-bold text-emerald-800">Nuevos</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50/30 border border-blue-100/40">
            <span className="w-2 h-2 rounded-full inline-block bg-[#3B82F6]" />
            <span className="text-[10px] font-bold text-blue-800">Recurrentes</span>
          </div>
        </div>

        {/* Resumen e Indicador de fidelización semaforizado */}
        <div className="flex items-center justify-between text-2xs font-semibold text-gray-550 flex-wrap gap-2">
          <span>Resumen: {nuevosTotal} nuevos / {recurrentesTotal} recurrentes</span>
          <span className={`px-2.5 py-1 rounded-full text-3xs font-extrabold border shadow-3xs uppercase tracking-wide transition-all ${getFidelityColorClass(tasaFidelizacion)}`}>
            Tasa de fidelización: {tasaFidelizacion}%
          </span>
        </div>
      </div>

    </div>
  )
}
