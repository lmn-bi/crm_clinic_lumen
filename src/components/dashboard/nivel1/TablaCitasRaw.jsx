import React, { useState } from 'react'
import { 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  Table,
  Phone,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { DASHBOARD_CONFIG } from '../../../config/dashboardConfig'

// Formateador de moneda en español
const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor || 0)
}

// Configuración visual de los estados
const ESTADOS_ESTILOS = {
  completada: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  confirmada: 'bg-blue-50 text-blue-700 border-blue-100',
  pendiente: 'bg-amber-50 text-amber-700 border-amber-100',
  no_show: 'bg-gray-50 text-gray-700 border-gray-100',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-100'
}

const ESTADOS_TRADUCCIONES = {
  completada: 'Completada',
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  no_show: 'No Presentada',
  cancelada: 'Cancelada'
}

// Configuración visual de los orígenes
const ORIGENES_ESTILOS = {
  web: 'bg-blue-50 text-blue-600 border-blue-100',
  telefono: 'bg-purple-50 text-purple-600 border-purple-100 font-bold',
  manual: 'bg-gray-55 text-gray-500 border-gray-100'
}

const ORIGENES_TRADUCCIONES = {
  web: 'Web (Staff)',
  telefono: 'Agente de Voz',
  manual: 'Manual'
}

/**
 * Tabla al final del Dashboard que renderiza el listado crudo de citas
 * del período con filtros aplicados, paginación y exportación de Excel.
 */
export default function TablaCitasRaw({ citasPeriodo = [] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortField, setSortField] = useState('inicio')
  const [sortDirection, setSortDirection] = useState('asc')

  const isDataEmpty = citasPeriodo.length === 0
  const totalItems = citasPeriodo.length

  // Formateador de fecha corta + hora
  const formatFechaHora = (fechaStr) => {
    if (!fechaStr) return '-'
    const d = new Date(fechaStr)
    const dia = String(d.getDate()).padStart(2, '0')
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const ano = d.getFullYear()
    const hora = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dia}/${mes}/${ano} ${hora}:${min}`
  }

  // Manejador de la ordenación
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Ordenar citas en memoria
  const sortedCitas = [...citasPeriodo].sort((a, b) => {
    let valA, valB

    switch (sortField) {
      case 'inicio':
        valA = a.inicio ? new Date(a.inicio).getTime() : 0
        valB = b.inicio ? new Date(b.inicio).getTime() : 0
        break
      case 'paciente':
        valA = `${a.pacientes?.nombre || ''} ${a.pacientes?.apellidos || ''}`.trim().toLowerCase()
        valB = `${b.pacientes?.nombre || ''} ${b.pacientes?.apellidos || ''}`.trim().toLowerCase()
        break
      case 'doctor':
        valA = `${a.doctores?.nombre || ''} ${a.doctores?.apellidos || ''}`.trim().toLowerCase()
        valB = `${b.doctores?.nombre || ''} ${b.doctores?.apellidos || ''}`.trim().toLowerCase()
        break
      case 'tratamiento':
        valA = (a.tipo_tratamiento || '').toLowerCase()
        valB = (b.tipo_tratamiento || '').toLowerCase()
        break
      case 'estado':
        valA = (ESTADOS_TRADUCCIONES[a.estado] || a.estado || '').toLowerCase()
        valB = (ESTADOS_TRADUCCIONES[b.estado] || b.estado || '').toLowerCase()
        break
      case 'origen':
        valA = (ORIGENES_TRADUCCIONES[a.origen] || a.origen || '').toLowerCase()
        valB = (ORIGENES_TRADUCCIONES[b.origen] || b.origen || '').toLowerCase()
        break
      case 'presupuesto':
        valA = parseFloat(a.presupuesto) || 0
        valB = parseFloat(b.presupuesto) || 0
        break
      case 'cobrado':
        valA = a.estado === 'completada' ? (parseFloat(a.costo_tratamiento) || parseFloat(a.costo_treatment) || 0) : 0
        valB = b.estado === 'completada' ? (parseFloat(b.costo_tratamiento) || parseFloat(b.costo_treatment) || 0) : 0
        break
      default:
        valA = a.inicio
        valB = b.inicio
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCitas = sortedCitas.slice(startIndex, startIndex + itemsPerPage)

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  // Exportar a Excel el listado de citas actual filtrado y ordenado
  const handleExportRawExcel = () => {
    try {
      const dataToExport = sortedCitas.map(cita => {
        const pacInfo = cita.pacientes || { nombre: 'Desconocido', apellidos: '', telefono: '' }
        const pacNombre = `${pacInfo.nombre || ''} ${pacInfo.apellidos || ''}`.trim()
        const docInfo = cita.doctores || { nombre: 'Sin', apellidos: 'Doctor' }
        const docNombre = `${docInfo.nombre || ''} ${docInfo.apellidos || ''}`.trim()
        
        const costo = parseFloat(cita.costo_tratamiento) || parseFloat(cita.costo_treatment) || 0
        const presupuesto = parseFloat(cita.presupuesto) || 0

        return {
          'Fecha y Hora': formatFechaHora(cita.inicio),
          'Paciente': pacNombre,
          'Teléfono Paciente': pacInfo.telefono || '-',
          'Doctor': docNombre,
          'Tratamiento': cita.tipo_tratamiento || 'Otros',
          'Estado': ESTADOS_TRADUCCIONES[cita.estado] || cita.estado,
          'Origen': ORIGENES_TRADUCCIONES[cita.origen] || 'Manual',
          'Presupuesto (€)': presupuesto,
          'Cobrado (€)': cita.estado === 'completada' ? costo : 0
        }
      })

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      
      // Autoajustar anchos de columnas para que se vea premium
      const colWidths = [
        { wch: 18 }, // Fecha y Hora
        { wch: 25 }, // Paciente
        { wch: 15 }, // Teléfono Paciente
        { wch: 25 }, // Doctor
        { wch: 20 }, // Tratamiento
        { wch: 15 }, // Estado
        { wch: 15 }, // Origen
        { wch: 15 }, // Presupuesto
        { wch: 15 }  // Cobrado
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Citas Filtradas')

      const fechaHoy = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `citas-raw-data-${fechaHoy}.xlsx`)
    } catch (err) {
      console.error('Error al exportar a Excel:', err)
      alert('Ocurrió un error al generar el reporte de Excel. Por favor reintente.')
    }
  }

  // Renderizador de encabezado de tabla ordenable
  const renderHeader = (label, field, align = 'left') => {
    const isSorted = sortField === field
    const alignmentClass = align === 'center' ? 'text-center justify-center' : align === 'right' ? 'text-right justify-end' : 'text-left justify-start'
    
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`py-3 px-4 cursor-pointer hover:bg-gray-150/50 transition-colors select-none group font-bold border-b border-gray-100`}
        title={`Ordenar por ${label}`}
      >
        <div className={`flex items-center gap-1.5 ${alignmentClass}`}>
          <span>{label}</span>
          <span className="shrink-0 transition-all">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600 stroke-[3px]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600 stroke-[3px]" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-550 opacity-40 group-hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 transition-all duration-300">
      {/* Cabecera de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
              Detalle de Citas del Período (Raw Data)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Listado completo de {totalItems} citas con los filtros maestros aplicados.
            </p>
          </div>
        </div>

        {/* Botón Excel incorporado aquí en lugar del header principal */}
        {DASHBOARD_CONFIG.exportExcel && !isDataEmpty && (
          <button
            onClick={handleExportRawExcel}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 no-export"
            title="Exportar base de citas filtradas a Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Citas a Excel</span>
          </button>
        )}
      </div>

      {isDataEmpty ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 font-semibold">No se encuentran citas para visualizar en este rango</p>
          <p className="text-3xs text-gray-400 mt-1">Modifica los filtros maestros en la cabecera para ver más resultados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider border-b border-gray-100">
                  {renderHeader('Fecha y Hora', 'inicio')}
                  {renderHeader('Paciente', 'paciente')}
                  {renderHeader('Doctor', 'doctor')}
                  {renderHeader('Tratamiento', 'tratamiento')}
                  {renderHeader('Estado', 'estado', 'center')}
                  {renderHeader('Origen', 'origen', 'center')}
                  {renderHeader('Presupuesto', 'presupuesto', 'right')}
                  {renderHeader('Cobrado', 'cobrado', 'right')}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedCitas.map((cita) => {
                  const pacInfo = cita.pacientes || { nombre: 'Desconocido', apellidos: '', telefono: '' }
                  const pacNombre = `${pacInfo.nombre || ''} ${pacInfo.apellidos || ''}`.trim()
                  const docInfo = cita.doctores || { nombre: 'Sin', apellidos: 'Doctor', color_calendario: '#9CA3AF' }
                  const docNombre = `${docInfo.nombre || ''} ${docInfo.apellidos || ''}`.trim()
                  
                  const costo = parseFloat(cita.costo_tratamiento) || parseFloat(cita.costo_treatment) || 0
                  const presupuesto = parseFloat(cita.presupuesto) || 0

                  return (
                    <tr key={cita.id} className="hover:bg-gray-50/30 transition-colors text-xs text-gray-700">
                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                        {formatFechaHora(cita.inicio)}
                      </td>
                      
                      {/* Paciente */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-800">{pacNombre}</div>
                        {pacInfo.telefono && (
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{pacInfo.telefono}</span>
                          </div>
                        )}
                      </td>

                      {/* Doctor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
                            <circle cx="4" cy="4" r="3.5" fill={docInfo.color_calendario || '#9CA3AF'} />
                          </svg>
                          <span className="font-medium">{docNombre}</span>
                        </div>
                      </td>

                      {/* Tratamiento */}
                      <td className="py-3 px-4 font-semibold text-gray-650 capitalize">
                        {cita.tipo_tratamiento || 'Otros'}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-3xs font-extrabold border shadow-3xs ${ESTADOS_ESTILOS[cita.estado] || 'bg-gray-50 text-gray-600'}`}>
                          {ESTADOS_TRADUCCIONES[cita.estado] || cita.estado}
                        </span>
                      </td>

                      {/* Origen */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-3xs border ${ORIGENES_ESTILOS[cita.origen] || ORIGENES_ESTILOS.manual}`}>
                          {cita.origen === 'telefono' && <Sparkles className="w-2.5 h-2.5 animate-pulse text-purple-500" />}
                          <span>{ORIGENES_TRADUCCIONES[cita.origen] || 'Manual'}</span>
                        </span>
                      </td>

                      {/* Presupuesto */}
                      <td className="py-3 px-4 text-right font-medium text-gray-500">
                        {formatMoneda(presupuesto)}
                      </td>

                      {/* Cobrado */}
                      <td className="py-3 px-4 text-right font-bold text-gray-850">
                        {cita.estado === 'completada' ? formatMoneda(costo) : <span className="text-gray-300 font-semibold">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Control de paginación y selector de filas por página */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-50 gap-3 no-export">
            <div className="flex items-center gap-4 flex-wrap select-none">
              <span className="text-2xs text-gray-550 font-medium">
                Mostrando <span className="font-bold text-gray-800">{totalItems > 0 ? startIndex + 1 : 0}</span> a{' '}
                <span className="font-bold text-gray-800">
                  {Math.min(startIndex + itemsPerPage, totalItems)}
                </span>{' '}
                de <span className="font-bold text-gray-800">{totalItems}</span> citas
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ver:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="text-2xs font-extrabold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-3xs transition-all"
                >
                  <option value={10}>10 citas</option>
                  <option value={25}>25 citas</option>
                  <option value={50}>50 citas</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-650 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-1 rounded-md border border-gray-150 select-none">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-650 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                  title="Página Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
