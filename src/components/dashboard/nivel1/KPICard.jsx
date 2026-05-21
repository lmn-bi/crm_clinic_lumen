import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

/**
 * Formatea un valor según el tipo solicitado.
 */
const formatValue = (valor, formato) => {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return formato === 'moneda' ? '0,00 €' : formato === 'porcentaje' ? '0,0%' : '0'
  }

  if (formato === 'moneda') {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valor)
  }

  if (formato === 'porcentaje') {
    return `${valor.toFixed(1).replace('.', ',')}%`
  }

  return new Intl.NumberFormat('es-ES').format(valor)
}

/**
 * Tarjeta individual de KPI optimizada con textos más grandes, amplio espaciado
 * y diseño premium de máxima legibilidad.
 */
export default function KPICard({
  titulo,
  valor,
  subtitulo,
  icono: IconoComponent,
  colorIcono = 'blue',
  tendencia,
  formato = 'numero'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  }

  const colorStyle = colorMap[colorIcono] || colorMap.blue

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between h-full min-h-[160px]">
      <div className="flex items-start justify-between gap-3">
        {/* Lado izquierdo: Textos en gran formato */}
        <div className="flex-1 min-w-0">
          <p className="text-2xs font-extrabold text-gray-400 uppercase tracking-widest truncate mb-1">
            {titulo}
          </p>
          <h3 className="text-3xl lg:text-3.5xl font-black text-gray-900 tracking-tight leading-none truncate">
            {formatValue(valor, formato)}
          </h3>
        </div>

        {/* Lado derecho: Icono en gran formato con bordes súper redondeados */}
        {IconoComponent && (
          <div className={`p-3 rounded-2xl border ${colorStyle} shrink-0 shadow-2xs`}>
            <IconoComponent className="w-6.5 h-6.5" />
          </div>
        )}
      </div>

      {/* Separador e información complementaria ampliada */}
      <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-gray-50 gap-2 flex-wrap">
        <p className="text-xs text-gray-500 font-bold tracking-tight truncate max-w-full">
          {subtitulo}
        </p>

        {tendencia && (
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-2xs font-black ${
              tendencia.positivo
                ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                : 'text-rose-700 bg-rose-50 border border-rose-100'
            }`}
            title={tendencia.etiqueta}
          >
            {tendencia.valor >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3px]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[3px]" />
            )}
            <span>
              {Math.abs(tendencia.valor).toFixed(1).replace('.', ',')}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
