import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  FileDown, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  User,
  Activity,
  Compass,
  FileText
} from 'lucide-react'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'
import MultiSelectDropdown from './MultiSelectDropdown'

/**
 * Convierte un objeto Date a formato "YYYY-MM" para inputs tipo month.
 */
const toMonthString = (date) => {
  if (!date) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${yyyy}-${mm}`
}

const formatMesAno = (date) => {
  if (!date) return ''
  const capitalizar = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  return capitalizar(date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }))
}

const formatPeriodoLabel = (inicio, fin) => {
  if (!inicio || !fin) return '-'
  return `${formatMesAno(inicio)} a ${formatMesAno(fin)}`
}

/**
 * Componente que representa la cabecera del Dashboard.
 * Rediseñado con un control segmentado estético, botones unificados, y filtro avanzado alineado a la derecha.
 */
export default function DashboardHeader({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  selectedDoctors = [],
  onDoctorsChange,
  selectedTreatments = [],
  onTreatmentsChange,
  selectedOrigins = [],
  onOriginsChange,
  doctorsList = [],
  treatmentsList = [],
  pdfOrientation,
  onPdfOrientationChange,
  onExportPDF,
  activePreset, // Prop para saber qué preset está activo y pintarlo
  onApplyPreset,
  lastUpdated
}) {
  const [showFilters, setShowFilters] = useState(false)

  const handleMonthInicioChange = (e) => {
    const val = e.target.value
    if (!val) return
    const [year, month] = val.split('-').map(Number)
    onFechaInicioChange(new Date(year, month - 1, 1, 0, 0, 0, 0))
  }

  const handleMonthFinChange = (e) => {
    const val = e.target.value
    if (!val) return
    const [year, month] = val.split('-').map(Number)
    onFechaFinChange(new Date(year, month, 0, 23, 59, 59, 999))
  }

  // Mapear claves a nombres para la visualización
  const getOrigenLabel = (key) => {
    switch (key) {
      case 'web': return 'Web (Staff)'
      case 'telefono': return 'Agente de Voz'
      case 'manual': return 'Manual'
      default: return key
    }
  }

  const doctorOptions = doctorsList.map(doc => ({ id: String(doc.id), label: doc.nombreCompleto }))
  const treatmentOptions = treatmentsList.map(treat => ({ id: treat, label: treat }))
  const originOptions = [
    { id: 'web', label: 'Web (Staff)' },
    { id: 'telefono', label: 'Agente de Voz' },
    { id: 'manual', label: 'Manual' }
  ]

  const isDocAll = selectedDoctors.includes('todos') || selectedDoctors.length === 0 || selectedDoctors.length === doctorsList.length
  const isTreatAll = selectedTreatments.includes('todos') || selectedTreatments.length === 0 || selectedTreatments.length === treatmentsList.length
  const isOrigAll = selectedOrigins.includes('todos') || selectedOrigins.length === 0 || selectedOrigins.length === 3

  const doctorSelectedList = isDocAll 
    ? ['Todos los doctores'] 
    : selectedDoctors.map(id => {
        const doc = doctorsList.find((d) => String(d.id) === String(id))
        return doc ? doc.nombreCompleto : `Doctor #${id}`
      })

  const treatmentSelectedList = isTreatAll 
    ? ['Todos los tratamientos'] 
    : selectedTreatments

  const originSelectedList = isOrigAll 
    ? ['Todos los orígenes'] 
    : selectedOrigins.map(getOrigenLabel)

  // Renderizador genérico premium de filtros para el cuadro gris de exportación (se estira hacia abajo de forma dinámica)
  const renderExportFilterBox = (titulo, items = [], isAll = false) => {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-1">{titulo}</span>
        {isAll ? (
          <span className="text-gray-800 font-extrabold text-xs">{items[0]}</span>
        ) : (
          <div className="flex flex-col gap-1 mt-0.5 pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span className="text-gray-800 font-extrabold text-xs leading-normal break-words">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6 transition-all duration-300">
      
      {/* FILA 1: TÍTULO Y EXPORTACIONES */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Título Principal */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-55 text-blue-600 rounded-2xl shadow-xs">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-850">Dashboard de Rendimiento</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Análisis financiero, citas y productividad de la clínica.
              {lastUpdated && (
                <span className="ml-2 text-gray-400 font-normal">
                  Sincronizado: {lastUpdated.toLocaleTimeString('es-ES')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Acciones de PDF en el lado derecho */}
        <div className="flex items-center gap-3 no-export">
          {DASHBOARD_CONFIG.exportPDF && (
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 gap-1.5 shadow-2xs">
              <FileText className="w-4 h-4 text-gray-500" />
              <select
                value={pdfOrientation}
                onChange={(e) => onPdfOrientationChange(e.target.value)}
                className="text-xs text-gray-700 bg-transparent font-semibold focus:outline-none cursor-pointer"
                title="Orientación del PDF"
              >
                <option value="landscape">Horizontal (A4)</option>
                <option value="portrait">Vertical (A4)</option>
              </select>
            </div>
          )}

          {DASHBOARD_CONFIG.exportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-xl shadow-xs transition-all cursor-pointer"
              title="Generar PDF del Dashboard"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Divisor */}
      <div className="h-px bg-gray-100 my-4"></div>

      {/* RESUMEN DE PARÁMETROS PARA EXPORTACIÓN (Visible solo en el PDF del Dashboard - Se estira verticalmente con listas de múltiples filtros) */}
      <div className="hidden only-export mt-1 mb-3 bg-gray-50 border border-gray-150 rounded-2xl p-4.5" data-display="block">
        <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-3">
          Parámetros y Filtros del Reporte
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start text-xs font-semibold text-gray-700">
          <div>
            <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider mb-1">Período</span>
            <span className="text-gray-800 font-extrabold text-xs">{formatPeriodoLabel(fechaInicio, fechaFin)}</span>
          </div>
          {renderExportFilterBox('Doctor(es)', doctorSelectedList, isDocAll)}
          {renderExportFilterBox('Tratamiento(s)', treatmentSelectedList, isTreatAll)}
          {renderExportFilterBox('Procedencia(s)', originSelectedList, isOrigAll)}
        </div>
      </div>

      {/* FILA 2: CONTROLES DE FILTROS (DATES, SEGMENTED PRESETS, ADVANCED TOGGLE) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        
        {/* Lado Izquierdo: Rango de Fechas */}
        <div className="flex items-center gap-2 shrink-0 no-export">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Período:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={toMonthString(fechaInicio)}
              onChange={handleMonthInicioChange}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            />
            <span className="text-gray-400 text-xs font-medium">a</span>
            <input
              type="month"
              value={toMonthString(fechaFin)}
              onChange={handleMonthFinChange}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
            />
          </div>
        </div>

        {/* Centro: Accesos Rápidos Estilo Control Segmentado (Alineados e Idéntico Tamaño) */}
        <div className="flex-1 max-w-lg no-export">
          <div className="grid grid-cols-5 p-0.5 bg-gray-100/80 border border-gray-150 rounded-xl w-full select-none shadow-3xs">
            {[
              { id: '12meses', label: '12 Meses' },
              { id: '6meses', label: '6 Meses' },
              { id: 'esteAno', label: 'Año Act.' },
              { id: 'esteTrimestre', label: 'Trim. Act.' },
              { id: 'ultimoTrimestre', label: 'Trim. Ant.' }
            ].map((preset) => {
              const isActive = activePreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                  className={`py-1.5 px-1 text-[10px] font-bold rounded-lg transition-all text-center truncate cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-3xs font-extrabold scale-102 border border-gray-100'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 border border-transparent'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lado Derecho: Botón de Filtros Avanzados (No desaparece, cambia de color al activarse) */}
        <div className="no-export shrink-0 self-end lg:self-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-xl border shadow-xs transition-all cursor-pointer ${
              showFilters
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-100'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros Avanzados</span>
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* PANEL DE FILTROS AVANZADOS (Se desliza suavemente - Rediseñado con dropdowns Multi-Select premium) */}
      {showFilters && (
        <div className="mt-5 p-4 bg-gray-50 border border-gray-100 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in no-export">
          
          {/* Filtro Doctor */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-2xs font-bold text-gray-500 uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-blue-550" />
              <span>Doctor</span>
            </label>
            <MultiSelectDropdown
              label="Doctor"
              options={doctorOptions}
              selected={selectedDoctors}
              onChange={onDoctorsChange}
              placeholder="Todos los doctores"
              icon={User}
            />
          </div>

          {/* Filtro Tratamiento */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-2xs font-bold text-gray-500 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-blue-550" />
              <span>Tratamiento</span>
            </label>
            <MultiSelectDropdown
              label="Tratamiento"
              options={treatmentOptions}
              selected={selectedTreatments}
              onChange={onTreatmentsChange}
              placeholder="Todos los tratamientos"
              icon={Activity}
            />
          </div>

          {/* Filtro Origen */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-2xs font-bold text-gray-500 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-blue-550" />
              <span>Procedencia</span>
            </label>
            <MultiSelectDropdown
              label="Procedencia"
              options={originOptions}
              selected={selectedOrigins}
              onChange={onOriginsChange}
              placeholder="Todos los orígenes"
              icon={Compass}
            />
          </div>

        </div>
      )}
    </div>
  )
}
