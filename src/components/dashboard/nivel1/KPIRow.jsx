import React from 'react'
import { 
  Calendar, 
  Euro, 
  TrendingUp, 
  UserX, 
  UserPlus, 
  Receipt 
} from 'lucide-react'
import KPICard from './KPICard'

/**
 * Fila de 6 KPI Cards. Calcula internamente los KPIs a partir de citasPeriodo
 * y pacientesNuevos, y renderiza tarjetas individuales con diseño responsivo.
 */
export default function KPIRow({ citasPeriodo = [], pacientesNuevos = 0 }) {
  const total = citasPeriodo.length

  // 1. Filtrar por estados
  const completadas = citasPeriodo.filter(c => c.estado === 'completada')
  const confirmadas = citasPeriodo.filter(c => c.estado === 'confirmada')
  const noShows = citasPeriodo.filter(c => c.estado === 'no_show')

  // 2. Cálculos principales del período completo
  const totalCitasValor = total
  
  const ingresosValor = completadas.reduce((sum, c) => {
    const val = parseFloat(c.costo_tratamiento)
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  const tasaOcupacionValor = total > 0 
    ? ((completadas.length + confirmadas.length) / total) * 100 
    : 0

  const tasaNoShowValor = total > 0 
    ? (noShows.length / total) * 100 
    : 0

  const pacientesNuevosValor = pacientesNuevos

  const ticketMedioValor = completadas.length > 0 
    ? ingresosValor / completadas.length 
    : 0

  // 3. CÁLCULO DE TENDENCIAS EN MEMORIA (Dividiendo el período en dos mitades cronológicas)
  // De esta forma, proporcionamos un análisis de tendencia extremadamente profesional sin llamadas adicionales.
  let tendenciaCitas = null
  let tendenciaIngresos = null
  let tendenciaOcupacion = null
  let tendenciaNoShow = null
  let tendenciaTicket = null

  if (total >= 4) {
    // Ordenamos las citas cronológicamente
    const citasOrdenadas = [...citasPeriodo].sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
    const midIdx = Math.floor(citasOrdenadas.length / 2)
    
    const primeraMitad = citasOrdenadas.slice(0, midIdx)
    const segundaMitad = citasOrdenadas.slice(midIdx)

    const calcMitad = (mitad) => {
      const tot = mitad.length
      const comp = mitad.filter(c => c.estado === 'completada')
      const conf = mitad.filter(c => c.estado === 'confirmada')
      const ns = mitad.filter(c => c.estado === 'no_show')
      
      const ing = comp.reduce((sum, c) => sum + (parseFloat(c.costo_tratamiento) || 0), 0)
      const ocup = tot > 0 ? ((comp.length + conf.length) / tot) * 100 : 0
      const noshow = tot > 0 ? (ns.length / tot) * 100 : 0
      const ticket = comp.length > 0 ? ing / comp.length : 0

      return { tot, ing, ocup, noshow, ticket }
    }

    const m1 = calcMitad(primeraMitad)
    const m2 = calcMitad(segundaMitad)

    // Helper para calcular el cambio porcentual
    const getChangePercent = (v1, v2) => {
      if (v1 === 0) return v2 > 0 ? 100 : 0
      return ((v2 - v1) / v1) * 100
    }

    // Tendencia Citas
    const citasDiff = getChangePercent(m1.tot, m2.tot)
    tendenciaCitas = { valor: citasDiff, positivo: citasDiff >= 0, etiqueta: 'vs primera mitad del período' }

    // Tendencia Ingresos
    const ingDiff = getChangePercent(m1.ing, m2.ing)
    tendenciaIngresos = { valor: ingDiff, positivo: ingDiff >= 0, etiqueta: 'vs primera mitad del período' }

    // Tendencia Ocupación
    const ocupDiff = m2.ocup - m1.ocup // Diferencia directa en puntos porcentuales
    tendenciaOcupacion = { valor: ocupDiff, positivo: ocupDiff >= 0, etiqueta: 'vs primera mitad del período' }

    // Tendencia No-Show (¡Positivo si disminuye!)
    const nsDiff = m2.noshow - m1.noshow // Diferencia directa en puntos porcentuales
    tendenciaNoShow = { valor: nsDiff, positivo: nsDiff <= 0, etiqueta: 'vs primera mitad del período' }

    // Tendencia Ticket Medio
    const ticketDiff = getChangePercent(m1.ticket, m2.ticket)
    tendenciaTicket = { valor: ticketDiff, positivo: ticketDiff >= 0, etiqueta: 'vs primera mitad del período' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Total Citas */}
      <KPICard
        titulo="Total Citas"
        valor={totalCitasValor}
        subtitulo="Citas registradas"
        icono={Calendar}
        colorIcono="blue"
        formato="numero"
        tendencia={tendenciaCitas}
      />

      {/* 2. Ingresos Totales */}
      <KPICard
        titulo="Ingresos"
        valor={ingresosValor}
        subtitulo="Total cobrado (Completadas)"
        icono={Euro}
        colorIcono="green"
        formato="moneda"
        tendencia={tendenciaIngresos}
      />

      {/* 3. Tasa de Ocupación */}
      <KPICard
        titulo="Tasa Ocupación"
        valor={tasaOcupacionValor}
        subtitulo="Completadas + Confirmadas"
        icono={TrendingUp}
        colorIcono="blue"
        formato="porcentaje"
        tendencia={tendenciaOcupacion}
      />

      {/* 4. Tasa de No-Show */}
      <KPICard
        titulo="Tasa No-Show"
        valor={tasaNoShowValor}
        subtitulo="Citas no presentadas"
        icono={UserX}
        colorIcono="red"
        formato="porcentaje"
        tendencia={tendenciaNoShow}
      />

      {/* 5. Pacientes Nuevos */}
      <KPICard
        titulo="Pacientes Nuevos"
        valor={pacientesNuevosValor}
        subtitulo="Registros en el período"
        icono={UserPlus}
        colorIcono="green"
        formato="numero"
      />

      {/* 6. Ticket Medio */}
      <KPICard
        titulo="Ticket Medio"
        valor={ticketMedioValor}
        subtitulo="Promedio por cita cobrada"
        icono={Receipt}
        colorIcono="amber"
        formato="moneda"
        tendencia={tendenciaTicket}
      />
    </div>
  )
}
