import React from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import KPIRow from './KPIRow'
import GraficoIngresosMensuales from './GraficoIngresosMensuales'
import GraficoEstadoCitas from './GraficoEstadoCitas'
import GraficoOrigenCitas from './GraficoOrigenCitas'
import TablaDoctores from './TablaDoctores'

/**
 * Skeleton Loader animado para la fila de KPIs.
 */
const KPISkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[...Array(6)].map((_, idx) => (
      <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-md w-2/3 mb-2.5"></div>
            <div className="h-7 bg-gray-200 rounded-md w-3/4"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        </div>
        <div className="h-3 bg-gray-150 rounded-md w-1/2 mt-4 pt-1"></div>
      </div>
    ))}
  </div>
)

/**
 * Skeleton Loader animado para los gráficos.
 */
const ChartSkeleton = ({ height = 'h-[300px]' }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-xs animate-pulse w-full ${height} flex flex-col justify-between`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
    </div>
    <div className="flex-1 bg-gray-100/75 rounded-xl w-full"></div>
  </div>
)

/**
 * Skeleton Loader animado para la tabla de doctores.
 */
const TableSkeleton = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs animate-pulse">
    <div className="flex items-center gap-2 mb-5">
      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
    </div>
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="h-10 bg-gray-50 border-b border-gray-100"></div>
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="h-12 border-b border-gray-100 flex items-center px-4 gap-4">
          <div className="w-6 h-6 rounded-full bg-gray-200"></div>
          <div className="h-3 bg-gray-200 rounded-md flex-1"></div>
          <div className="w-16 h-3 bg-gray-200 rounded-md"></div>
          <div className="w-16 h-3 bg-gray-200 rounded-md"></div>
          <div className="w-16 h-3 bg-gray-200 rounded-md"></div>
        </div>
      ))}
    </div>
  </div>
)

/**
 * Componente Orquestador de Nivel 1 del Dashboard.
 * Gestiona estados de carga (skeletons), estados de error y posiciona
 * los KPI, gráficos y tablas correspondientes.
 */
export default function Nivel1Dashboard({
  citasPeriodo = [],
  pacientesNuevos = 0,
  loading = false,
  error = null,
  onRetry
}) {
  // 1. Renderizado de carga con esqueletos elegantes (sin spinners molestos)
  if (loading) {
    return (
      <div className="space-y-6">
        <KPISkeleton />
        <ChartSkeleton height="h-[360px]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-[300px]" />
          <ChartSkeleton height="h-[300px]" />
        </div>
        <TableSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  // 2. Renderizado de error con botón de reintento
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 my-6 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center gap-3">
        <div className="p-3 bg-red-100 text-red-650 rounded-full">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-md font-bold text-red-950">Error al cargar el Dashboard</h3>
        <p className="text-xs text-red-750 font-semibold">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-red-650 hover:bg-red-750 active:bg-red-800 rounded-xl transition-all shadow-md cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar carga</span>
        </button>
      </div>
    )
  }

  // 3. Renderizado normal del Dashboard Nivel 1
  return (
    <div className="space-y-6">
      {/* Fila 1: KPIs Principales */}
      <KPIRow 
        citasPeriodo={citasPeriodo} 
        pacientesNuevos={pacientesNuevos} 
      />

      {/* Fila 2: Gráfico de Evolución de Ingresos */}
      <GraficoIngresosMensuales 
        citasPeriodo={citasPeriodo} 
      />

      {/* Fila 3: Estados de las Citas y Impacto del Agente de Voz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <GraficoEstadoCitas 
            citasPeriodo={citasPeriodo} 
          />
        </div>
        <div>
          <GraficoOrigenCitas 
            citasPeriodo={citasPeriodo} 
          />
        </div>
      </div>

      {/* Fila 4: Rendimiento e Ingresos por Doctor */}
      <TablaDoctores 
        citasPeriodo={citasPeriodo} 
      />
    </div>
  )
}
