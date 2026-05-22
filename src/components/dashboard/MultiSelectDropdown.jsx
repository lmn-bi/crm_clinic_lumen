import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Componente Dropdown Multi-Select Premium y Animado.
 * Ofrece soporte para selección múltiple con buscador/filtros, estados "Todos",
 * y un diseño impecable acorde con la estética premium de la clínica.
 */
export default function MultiSelectDropdown({
  label,
  options = [],
  selected = [],
  onChange,
  icon: Icon,
  placeholder = 'Seleccionar...'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggleOption = (optionId) => {
    if (optionId === 'todos') {
      if (selected.includes('todos') || selected.length === options.length) {
        onChange([])
      } else {
        onChange(['todos'])
      }
      return
    }

    let nextSelected = [...selected].filter(item => item !== 'todos')

    if (nextSelected.includes(optionId)) {
      nextSelected = nextSelected.filter(item => item !== optionId)
    } else {
      nextSelected.push(optionId)
    }

    // Si se seleccionan todas las opciones reales, se simplifica a 'todos'
    if (nextSelected.length === options.length) {
      onChange(['todos'])
    } else {
      onChange(nextSelected)
    }
  }

  const isAllSelected = selected.includes('todos') || selected.length === 0 || selected.length === options.length

  const getButtonText = () => {
    if (isAllSelected) {
      return `Todos (${options.length})`
    }
    if (selected.length === 1) {
      const match = options.find(o => String(o.id) === String(selected[0]))
      return match ? match.label : selected[0]
    }
    return `${selected.length} seleccionados`
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:border-blue-400 cursor-pointer shadow-xs transition-all duration-200"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-blue-500 shrink-0" />}
          <span className="truncate">{getButtonText()}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full bg-white border border-gray-150 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto animate-fade-in py-1">
          {/* Opción "Seleccionar Todos" */}
          <button
            type="button"
            onClick={() => handleToggleOption('todos')}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 text-left transition-colors border-b border-gray-100"
          >
            <span className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
              isAllSelected 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 bg-white'
            }`}>
              {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </span>
            <span className="truncate">Todos</span>
          </button>

          {/* Opciones individuales */}
          <div className="py-1">
            {options.map((opt) => {
              const isChecked = isAllSelected || selected.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleOption(opt.id)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 text-left transition-colors"
                >
                  <span className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${
                    isChecked 
                      ? 'bg-blue-500 border-blue-500 text-white shadow-xs' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
