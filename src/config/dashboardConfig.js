// Archivo de configuración de niveles premium del dashboard.
// Para activar/desactivar funcionalidades por cliente,
// SOLO cambiar los valores true/false en este archivo.
// No tocar ningún otro archivo para gestionar licencias.

export const DASHBOARD_CONFIG = {
  nivel1: true,    // KPIs + ingresos + estados + origen + tabla doctores
  nivel2: true,    // Heatmap + día semana + pacientes + tratamientos
  nivel3: false,   // Alertas inteligentes + retención de pacientes
  tablaDetalle: true, // controles de TablaCitasRaw independientemente
  exportPDF: true,
  exportExcel: true,
}

// Rango de fechas por defecto al cargar el dashboard
export const DASHBOARD_DEFAULTS = {
  mesesHistorico: 12,  // cuántos meses atrás mostrar en gráficos temporales
}
