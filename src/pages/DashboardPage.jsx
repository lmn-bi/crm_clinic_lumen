import React, { useState, useMemo, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'

import DashboardHeader from '../components/dashboard/DashboardHeader'
import Nivel1Dashboard from '../components/dashboard/nivel1/Nivel1Dashboard'
// import Nivel2Dashboard from '../components/dashboard/nivel2/Nivel2Dashboard' // Próxima Fase
// import Nivel3Dashboard from '../components/dashboard/nivel3/Nivel3Dashboard' // Futura Fase

import { useDashboardData } from '../hooks/useDashboardData'
import { DASHBOARD_CONFIG } from '../config/dashboardConfig'

/**
 * Configuraciones de nombres e iconos de estados para exportación.
 */
const ESTADOS_CONFIG = {
  completada: { label: 'Completadas' },
  confirmada: { label: 'Confirmadas' },
  pendiente: { label: 'Pendientes' },
  no_show: { label: 'No Presentadas' },
  cancelada: { label: 'Canceladas' }
}

export default function DashboardPage() {
  // 1. ESTADO DE FILTROS DE FECHAS (Base de Datos)
  // Valores iniciales: Primer día de hace 12 meses hasta el último día del mes actual.
  const [fechaInicio, setFechaInicio] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear() - 1, d.getMonth(), 1, 0, 0, 0, 0)
  })
  
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  })

  // Estado para el preset de fechas activo (por defecto 12 meses)
  const [activePreset, setActivePreset] = useState('12meses')

  // Wrappers para limpiar el preset cuando el usuario modifica manualmente el mes
  const handleFechaInicioChange = (date) => {
    setFechaInicio(date)
    setActivePreset(null)
  }

  const handleFechaFinChange = (date) => {
    setFechaFin(date)
    setActivePreset(null)
  }

  // 2. ESTADO DE FILTROS MAESTROS (En memoria - Frontend)
  const [selectedDoctor, setSelectedDoctor] = useState('todos')
  const [selectedTreatment, setSelectedTreatment] = useState('todos')
  const [selectedOrigin, setSelectedOrigin] = useState('todos')

  // 3. CONFIGURACIÓN DEL EXPORTADOR DE PDF
  const [pdfOrientation, setPdfOrientation] = useState('landscape') // 'landscape' | 'portrait'
  const [exportingPDF, setExportingPDF] = useState(false)

  // Referencia principal al contenedor para captura de PDF
  const dashboardRef = useRef(null)

  // 4. CONSULTA CENTRALIZADA DE DATOS (Supabase)
  const {
    citasPeriodo,
    pacientesNuevos,
    totalPacientes,
    loading,
    error,
    refetch
  } = useDashboardData({ fechaInicio, fechaFin })

  const [lastUpdated, setLastUpdated] = useState(() => new Date())

  const handleRetry = () => {
    refetch().then(() => setLastUpdated(new Date()))
  }

  // 5. LISTADOS DINÁMICOS PARA FILTROS (Extraídos del pool de citas del período)
  const doctorsList = useMemo(() => {
    const list = []
    const ids = new Set()
    citasPeriodo.forEach((cita) => {
      const docId = cita.doctor_id
      if (docId && !ids.has(docId)) {
        ids.add(docId)
        const docInfo = cita.doctores
        const nombreCompleto = docInfo
          ? `${docInfo.nombre || ''} ${docInfo.apellidos || ''}`.trim()
          : `Doctor #${docId}`
        list.push({ id: docId, nombreCompleto })
      }
    })
    return list.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
  }, [citasPeriodo])

  const treatmentsList = useMemo(() => {
    const list = new Set()
    citasPeriodo.forEach((cita) => {
      if (cita.tipo_tratamiento) {
        list.add(cita.tipo_tratamiento)
      }
    })
    return Array.from(list).sort()
  }, [citasPeriodo])

  // 6. APLICACIÓN DE PRESETS DE FECHAS
  const handleApplyPreset = (preset) => {
    const d = new Date()
    let inicio, fin
    switch (preset) {
      case '12meses':
        inicio = new Date(d.getFullYear() - 1, d.getMonth(), 1, 0, 0, 0, 0)
        fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case '6meses':
        inicio = new Date(d.getFullYear(), d.getMonth() - 5, 1, 0, 0, 0, 0)
        fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'esteAno':
        inicio = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0)
        fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'esteTrimestre': {
        const quarter = Math.floor(d.getMonth() / 3)
        inicio = new Date(d.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
        fin = new Date(d.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999)
        break
      }
      case 'ultimoTrimestre': {
        const currentQuarter = Math.floor(d.getMonth() / 3)
        let year = d.getFullYear()
        let prevQuarter = currentQuarter - 1
        if (prevQuarter < 0) {
          prevQuarter = 3
          year--
        }
        inicio = new Date(year, prevQuarter * 3, 1, 0, 0, 0, 0)
        fin = new Date(year, (prevQuarter + 1) * 3, 0, 23, 59, 59, 999)
        break
      }
      default:
        return
    }
    setFechaInicio(inicio)
    setFechaFin(fin)
    setActivePreset(preset)
    // Reseteamos filtros en memoria al cambiar el período general
    setSelectedDoctor('todos')
    setSelectedTreatment('todos')
    setSelectedOrigin('todos')
    setLastUpdated(new Date())
  }

  // 7. FILTRADO MULTI-VARIABLE EN MEMORIA (Respuestas instantáneas en 0ms)
  const filteredCitas = useMemo(() => {
    return citasPeriodo.filter((cita) => {
      // Filtro de doctor
      const matchDoc = selectedDoctor === 'todos' || String(cita.doctor_id) === String(selectedDoctor)
      
      // Filtro de tratamiento
      const matchTreat = selectedTreatment === 'todos' || cita.tipo_tratamiento === selectedTreatment
      
      // Filtro de origen
      const matchOrig = selectedOrigin === 'todos' || (cita.origen || 'manual') === selectedOrigin

      return matchDoc && matchTreat && matchOrig
    })
  }, [citasPeriodo, selectedDoctor, selectedTreatment, selectedOrigin])

  // Helper para agrupar y calcular doctores para exportación Excel
  const procesarDoctores = (citas) => {
    const map = {}
    citas.forEach((cita) => {
      const docId = cita.doctor_id || 'sin_doctor'
      const docInfo = cita.doctores || { nombre: 'Sin', apellidos: 'Doctor' }
      const docNombre = `${docInfo.nombre || ''} ${docInfo.apellidos || ''}`.trim() || 'Sin Doctor'

      if (!map[docId]) {
        map[docId] = {
          nombre: docNombre,
          citasTotales: 0,
          completadas: 0,
          noShows: 0,
          canceladas: 0,
          ingresos: 0
        }
      }

      const doc = map[docId]
      doc.citasTotales++

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
    return Object.values(map).sort((a, b) => b.ingresos - a.ingresos)
  }

  // Helper de moneda para informes Excel
  const formatMoneda = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)

  // 8. EXPORTADOR A PDF (Captura Visual Completa y Limpia)
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return
    setExportingPDF(true)

    try {
      // html2canvas renderiza con factor de escala 2 para alta definición.
      // Oculta dinámicamente controles interactivos del PDF clonado con la opción onclone.
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const noExportElements = clonedDoc.querySelectorAll('.no-export')
          noExportElements.forEach((el) => {
            el.style.display = 'none'
          })
          
          // Estilo extra para asegurar que el clon ocupe el ancho correcto
          const container = clonedDoc.querySelector('.dashboard-container')
          if (container) {
            container.style.boxShadow = 'none'
            container.style.border = 'none'
            container.style.padding = '10px'
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const isLandscape = pdfOrientation === 'landscape'

      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      // Redimensionamiento proporcional de la captura
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const imgWidth = pdfWidth
      const imgHeight = (canvasHeight * pdfWidth) / canvasWidth

      let finalWidth = imgWidth
      let finalHeight = imgHeight

      // Si el alto de la imagen excede la página, la escalamos proporcionalmente para evitar recortes
      if (imgHeight > pdfHeight) {
        finalHeight = pdfHeight
        finalWidth = (canvasWidth * pdfHeight) / canvasHeight
      }

      // Centrado de la imagen en la página
      const xOffset = (pdfWidth - finalWidth) / 2
      const yOffset = (pdfHeight - finalHeight) / 2

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
      
      const fechaHoy = new Date().toISOString().split('T')[0]
      pdf.save(`dashboard-clinica-${fechaHoy}.pdf`)
    } catch (err) {
      console.error('Error al exportar PDF:', err)
      alert('Ocurrió un error al generar la copia en PDF. Por favor reintente.')
    } finally {
      setExportingPDF(false)
    }
  }

  // 9. EXPORTADOR A EXCEL (XLSX Consolidado en 3 Hojas)
  const handleExportExcel = () => {
    try {
      const totalCitasCount = filteredCitas.length
      const completadasList = filteredCitas.filter((c) => c.estado === 'completada')
      const confirmadasList = filteredCitas.filter((c) => c.estado === 'confirmada')
      const noShowsList = filteredCitas.filter((c) => c.estado === 'no_show')

      const ingresosSum = completadasList.reduce((sum, c) => sum + (parseFloat(c.costo_tratamiento) || parseFloat(c.costo_treatment) || 0), 0)
      const tasaOcup = totalCitasCount > 0 ? ((completadasList.length + confirmadasList.length) / totalCitasCount) * 100 : 0
      const tasaNS = totalCitasCount > 0 ? (noShowsList.length / totalCitasCount) * 100 : 0
      const ticketMedio = completadasList.length > 0 ? ingresosSum / completadasList.length : 0

      // 9.1 Hoja KPIs Resumen
      const kpisData = [
        { Indicador: 'Total Citas del Período', Valor: totalCitasCount, Detalle: 'Citas totales filtradas' },
        { Indicador: 'Facturación / Cobrado', Valor: formatMoneda(ingresosSum), Detalle: 'Cobros realizados de citas completadas' },
        { Indicador: 'Tasa de Ocupación', Valor: `${tasaOcup.toFixed(1).replace('.', ',')}%`, Detalle: '(Completadas + Confirmadas) / Total' },
        { Indicador: 'Tasa de No-Show', Valor: `${tasaNS.toFixed(1).replace('.', ',')}%`, Detalle: 'No presentados / Citas totales' },
        { Indicador: 'Pacientes Nuevos', Valor: pacientesNuevos, Detalle: 'Registros nuevos creados en la clínica' },
        { Indicador: 'Ticket Medio por Cita', Valor: formatMoneda(ticketMedio), Detalle: 'Ingresos totales / Citas completadas' }
      ]
      const wsKpis = XLSX.utils.json_to_sheet(kpisData)

      // 9.2 Hoja Distribución Citas
      const estadosData = Object.keys(ESTADOS_CONFIG).map((key) => {
        const count = filteredCitas.filter((c) => c.estado === key).length
        const pct = totalCitasCount > 0 ? (count / totalCitasCount) * 100 : 0
        return {
          'Métrica / Clasificación': ESTADOS_CONFIG[key].label,
          'Cantidad': count,
          'Porcentaje': `${pct.toFixed(1).replace('.', ',')}%`
        }
      })

      const origenesData = ['web', 'telefono', 'manual'].map((key) => {
        const count = filteredCitas.filter((c) => (c.origen || 'manual') === key).length
        const pct = totalCitasCount > 0 ? (count / totalCitasCount) * 100 : 0
        const label = key === 'web' ? 'Web (Staff)' : key === 'telefono' ? 'Agente de Voz' : 'Manual'
        return {
          'Métrica / Clasificación': `Origen: ${label}`,
          'Cantidad': count,
          'Porcentaje': `${pct.toFixed(1).replace('.', ',')}%`
        }
      })

      // Unimos ambas tablas en la misma pestaña
      const combinados = [...estadosData, { 'Métrica / Clasificación': '---', Cantidad: '', Porcentaje: '' }, ...origenesData]
      const wsDistribucion = XLSX.utils.json_to_sheet(combinados)

      // 9.3 Hoja Por Doctor
      const listDoctores = procesarDoctores(filteredCitas)
      const doctoresData = listDoctores.map((doc) => {
        const tk = doc.completadas > 0 ? doc.ingresos / doc.completadas : 0
        return {
          'Doctor': doc.nombre,
          'Citas Totales': doc.citasTotales,
          'Completadas': doc.completadas,
          'No-Shows': doc.noShows,
          'Canceladas': doc.canceladas,
          'Ingresos': doc.ingresos,
          'Ticket Medio': tk
        }
      })

      // Fila de totales globales de doctores
      const sumTotales = listDoctores.reduce(
        (acc, d) => {
          acc.tot += d.citasTotales
          acc.comp += d.completadas
          acc.ns += d.noShows
          acc.canc += d.canceladas
          acc.ing += d.ingresos
          return acc
        },
        { tot: 0, comp: 0, ns: 0, canc: 0, ing: 0 }
      )
      const tkGlobal = sumTotales.comp > 0 ? sumTotales.ing / sumTotales.comp : 0

      doctoresData.push({
        'Doctor': 'TOTAL GENERAL',
        'Citas Totales': sumTotales.tot,
        'Completadas': sumTotales.comp,
        'No-Shows': sumTotales.ns,
        'Canceladas': sumTotales.canc,
        'Ingresos': formatMoneda(sumTotales.ing),
        'Ticket Medio': formatMoneda(tkGlobal)
      })

      // Formatear la columna de ingresos en la fila de doctores antes del push final si no es totalizador
      doctoresData.forEach((row, i) => {
        if (i < doctoresData.length - 1) {
          row['Ingresos'] = formatMoneda(row['Ingresos'])
          row['Ticket Medio'] = formatMoneda(row['Ticket Medio'])
        }
      })

      const wsDoctores = XLSX.utils.json_to_sheet(doctoresData)

      // Crear Libro consolidado
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, wsKpis, 'Resumen KPIs')
      XLSX.utils.book_append_sheet(wb, wsDistribucion, 'Metricas Distribucion')
      XLSX.utils.book_append_sheet(wb, wsDoctores, 'Rendimiento Doctores')

      const fechaHoy = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `dashboard-datos-clinica-${fechaHoy}.xlsx`)
    } catch (err) {
      console.error('Error al exportar Excel:', err)
      alert('Error al generar el reporte de Excel. Por favor reintente.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dashboard-container" ref={dashboardRef}>
      {/* 1. Cabecera con Controles de Rango de Fechas, Filtros y Acciones */}
      <DashboardHeader
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFechaInicioChange={handleFechaInicioChange}
        onFechaFinChange={handleFechaFinChange}
        selectedDoctor={selectedDoctor}
        onDoctorChange={setSelectedDoctor}
        selectedTreatment={selectedTreatment}
        onTreatmentChange={setSelectedTreatment}
        selectedOrigin={selectedOrigin}
        onOriginChange={setSelectedOrigin}
        doctorsList={doctorsList}
        treatmentsList={treatmentsList}
        pdfOrientation={pdfOrientation}
        onPdfOrientationChange={setPdfOrientation}
        onExportPDF={handleExportPDF}
        activePreset={activePreset}
        onApplyPreset={handleApplyPreset}
        lastUpdated={lastUpdated}
      />

      {/* Spinner superpuesto elegante si se está generando el PDF */}
      {exportingPDF && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in no-export">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">Generando Reporte PDF</h4>
              <p className="text-xs text-gray-500 mt-1">Renderizando gráficos de alta definición. Un momento...</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Orquestador de Nivel 1 */}
      {DASHBOARD_CONFIG.nivel1 && (
        <Nivel1Dashboard
          citasPeriodo={filteredCitas}
          pacientesNuevos={pacientesNuevos}
          loading={loading}
          error={error}
          onRetry={handleRetry}
          onExportExcel={handleExportExcel}
        />
      )}

      {/* 3. Marcadores de Posición Tiers Premium Siguientes (Fases 2 y 3) */}
      {/*
      {DASHBOARD_CONFIG.nivel2 && (
        <Nivel2Dashboard
          citasPeriodo={filteredCitas}
          loading={loading}
          error={error}
        />
      )}
      */}

      {/*
      {DASHBOARD_CONFIG.nivel3 && (
        <Nivel3Dashboard
          citasPeriodo={filteredCitas}
          loading={loading}
          error={error}
        />
      )}
      */}
    </div>
  )
}
