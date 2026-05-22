import React from 'react'
import { Users } from 'lucide-react'

/**
 * Formateador de moneda en español.
 */
const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor)
}

/**
 * Agrupa y procesa la productividad de los doctores a partir de las citas del período.
 */
const procesarDoctores = (citas) => {
  const doctoresMap = {}

  citas.forEach((cita) => {
    const docId = cita.doctor_id || 'sin_doctor'
    const docInfo = cita.doctores || { nombre: 'Sin', apellidos: 'Doctor', color_calendario: '#9CA3AF' }
    const docNombre = `${docInfo.nombre || ''} ${docInfo.apellidos || ''}`.trim() || 'Sin Doctor'

    if (!doctoresMap[docId]) {
      doctoresMap[docId] = {
        id: docId,
        nombre: docNombre,
        color: docInfo.color_calendario || '#9CA3AF',
        citasTotales: 0,
        completadas: 0,
        noShows: 0,
        canceladas: 0,
        ingresos: 0
      }
    }

    const doc = doctoresMap[docId]
    doc.citasTotales++

    // En JS y Supabase se usa costo_tratamiento
    const costo = parseFloat(cita.costo_tratamiento) || parseFloat(cita.costo_treatment) || 0

    if (cita.estado === 'completada') {
      doc.completadas++
      doc.ingresos += costo
    } else if (cita.estado === 'no_show') {
      doc.noShows++
    } else if (cita.estado === 'cancelada') {
      doc.canceladas++
    }
  })

  // Convertimos a array y ordenamos por ingresos de mayor a menor
  return Object.values(doctoresMap).sort((a, b) => b.ingresos - a.ingresos)
}

/**
 * Tabla de rendimiento de doctores del período seleccionado.
 */
export default function TablaDoctores({ citasPeriodo = [] }) {
  const doctores = procesarDoctores(citasPeriodo)
  const isDataEmpty = citasPeriodo.length === 0

  // 1. Calcular totales globales para la última fila
  const totales = doctores.reduce(
    (acc, doc) => {
      acc.citasTotales += doc.citasTotales
      acc.completadas += doc.completadas
      acc.noShows += doc.noShows
      acc.canceladas += doc.canceladas
      acc.ingresos += doc.ingresos
      return acc
    },
    { citasTotales: 0, completadas: 0, noShows: 0, canceladas: 0, ingresos: 0 }
  )

  const ticketMedioGlobal = totales.completadas > 0 
    ? totales.ingresos / totales.completadas 
    : 0

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 transition-all duration-300">
      {/* Título de la Sección */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          Rendimiento por Doctor
        </h3>
      </div>

      {isDataEmpty ? (
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 font-semibold">No se registran datos de doctores para este período</p>
          <p className="text-3xs text-gray-400 mt-1">Las citas cargadas aparecerán aquí consolidadas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4 text-center">Citas Totales</th>
                <th className="py-3 px-4 text-center">Completadas</th>
                <th className="py-3 px-4 text-center">No-Shows</th>
                <th className="py-3 px-4 text-center">Canceladas</th>
                <th className="py-3 px-4 text-right">Ingresos</th>
                <th className="py-3 px-4 text-right">Ticket Medio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doctores.map((doc) => {
                const ticketMedio = doc.completadas > 0 ? doc.ingresos / doc.completadas : 0
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors text-xs font-medium text-gray-700">
                    {/* Doctor Info */}
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                        <circle cx="5" cy="5" r="4" fill={doc.color} stroke="#ffffff" strokeWidth="1" />
                      </svg>
                      <span className="font-semibold text-gray-800">{doc.nombre}</span>
                    </td>
                    {/* Citas Totales */}
                    <td className="py-3.5 px-4 text-center text-gray-600 font-semibold">{doc.citasTotales}</td>
                    {/* Completadas */}
                    <td className="py-3.5 px-4 text-center text-emerald-650 font-bold">{doc.completadas}</td>
                    {/* No-Shows con badge */}
                    <td className="py-3.5 px-4 text-center">
                      {doc.noShows > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold text-red-750 bg-red-50 border border-red-100 shadow-3xs">
                          {doc.noShows}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-semibold">0</span>
                      )}
                    </td>
                    {/* Canceladas */}
                    <td className="py-3.5 px-4 text-center text-gray-500">{doc.canceladas}</td>
                    {/* Ingresos */}
                    <td className="py-3.5 px-4 text-right font-bold text-gray-850">{formatMoneda(doc.ingresos)}</td>
                    {/* Ticket Medio */}
                    <td className="py-3.5 px-4 text-right font-semibold text-gray-600">{formatMoneda(ticketMedio)}</td>
                  </tr>
                )
              })}

              {/* Fila de Totales final */}
              <tr className="bg-gray-50/80 text-xs font-bold text-gray-800 border-t border-gray-100">
                <td className="py-4 px-4 uppercase tracking-wider text-gray-500 text-2xs font-extrabold">Total General</td>
                <td className="py-4 px-4 text-center">{totales.citasTotales}</td>
                <td className="py-4 px-4 text-center text-emerald-600">{totales.completadas}</td>
                <td className="py-4 px-4 text-center">
                  {totales.noShows > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold text-red-800 bg-red-100 border border-red-200">
                      {totales.noShows}
                    </span>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="py-4 px-4 text-center text-gray-500">{totales.canceladas}</td>
                <td className="py-4 px-4 text-right text-gray-900 font-extrabold">{formatMoneda(totales.ingresos)}</td>
                <td className="py-4 px-4 text-right text-gray-800">{formatMoneda(ticketMedioGlobal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
