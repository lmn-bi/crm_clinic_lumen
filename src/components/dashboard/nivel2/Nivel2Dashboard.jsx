import React from 'react'
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import HeatmapCitas from './HeatmapCitas'
import GraficoCitasPorDia from './GraficoCitasPorDia'
import GraficoPacientesTipo from './GraficoPacientesTipo'
import GraficoTopTratamientos from './GraficoTopTratamientos'

/**
 * Skeleton Loader animado de altura variable para los gráficos de Nivel 2.
 */
const ChartSkeleton = ({ height = 'h-[360px]' }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-xs animate-pulse w-full ${height} flex flex-col justify-between`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
      <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
    </div>
    <div className="flex-1 bg-gray-100/75 rounded-xl w-full"></div>
  </div>
)

/**
 * Componente Orquestador de Nivel 2 del Dashboard (Análisis Avanzado).
 * Muestra el mapa de calor de citas por hora, volumen de citas por día,
 * fidelización de pacientes y el rendimiento por tipo de tratamiento.
 */
export default function Nivel2Dashboard({
  citasPeriodo = [],
  pacientesNuevos = 0,
  loading = false,
  error = null,
  onRetry
}) {
  // 1. Renderizado de carga con esqueletos dedicados para Nivel 2
  if (loading) {
    return (
      <div className="space-y-6 mt-6">
        {/* Divisor con badge animado en esqueleto */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink mx-4 px-4 py-1.5 bg-gray-55 text-gray-405 rounded-full text-xs font-bold border border-gray-100 flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
            Análisis Avanzado — Nivel 2
          </span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        {/* Fila 1: Mapa de calor (ancho completo) */}
        <ChartSkeleton height="h-[380px]" />

        {/* Fila 2: Actividad semanal y Fidelización mensual (2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height="h-[360px]" />
          <ChartSkeleton height="h-[360px]" />
        </div>

        {/* Fila 3: Top tratamientos (ancho completo) */}
        <ChartSkeleton height="h-[400px]" />
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
        <h3 className="text-md font-bold text-red-950">Error al cargar el Dashboard Nivel 2</h3>
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

  // 3. Renderizado normal del Dashboard Nivel 2
  return (
    <div className="space-y-6 mt-6">
      
      {/* Divisor decorativo premium con badge brillante */}
      <div className="relative flex py-4 items-center no-export">
        <div className="flex-grow border-t border-gray-200/60"></div>
        <span className="flex-shrink mx-4 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100 shadow-3xs flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          Análisis Avanzado — Nivel 2
        </span>
        <div className="flex-grow border-t border-gray-200/60"></div>
      </div>

      {/* Título de exportación imprimible exclusivo para PDF */}
      <div className="hidden only-export border-b border-gray-150 pb-2 mb-4" data-display="block">
        <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest flex items-center gap-2">
          ★ Análisis Avanzado — Nivel 2
        </h2>
        <p className="text-3xs text-gray-400 mt-0.5">
          Clínica Dental — Métricas y Gráficos del Nivel 2 de Gestión
        </p>
      </div>

      {/* Fila 1: Mapa de Calor de Citas por Hora y Día (Completo) */}
      <HeatmapCitas 
        citasPeriodo={citasPeriodo} 
      />

      {/* Fila 2: Distribución de Citas y Fidelización de Pacientes (2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoCitasPorDia 
          citasPeriodo={citasPeriodo} 
        />
        <GraficoPacientesTipo 
          citasPeriodo={citasPeriodo} 
        />
      </div>

      {/* Fila 3: Top Tratamientos - Demanda vs. Ingresos (Completo) */}
      <GraficoTopTratamientos 
        citasPeriodo={citasPeriodo} 
      />

    </div>
  )
}
