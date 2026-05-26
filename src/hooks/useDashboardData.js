import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook personalizado que centraliza las consultas necesarias para el dashboard.
 * Ejecuta múltiples consultas en paralelo usando Promise.all para optimizar la latencia.
 * 
 * @param {Object} params
 * @param {Date} params.fechaInicio - Objeto Date que marca el inicio del período
 * @param {Date} params.fechaFin - Objeto Date que marca el final del período
 * @param {string} params.clinica_id - UUID de la clínica a filtrar
 */
export function useDashboardData({ fechaInicio, fechaFin, clinica_id }) {
  const [citasPeriodo, setCitasPeriodo] = useState([])
  const [pacientesNuevos, setPacientesNuevos] = useState(0)
  const [totalPacientes, setTotalPacientes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!fechaInicio || !fechaFin || !clinica_id) return

    setLoading(true)
    setError(null)

    try {
      const inicioISO = fechaInicio.toISOString()
      const finISO = fechaFin.toISOString()

      // Ejecución paralela de las consultas requeridas
      const [citasRes, pacientesNuevosRes, totalPacientesRes] = await Promise.all([
        // 1. Citas del período con información del doctor asociado
        supabase
          .from('citas')
          .select(`
            id,
            inicio,
            estado,
            origen,
            presupuesto,
            costo_tratamiento,
            doctor_id,
            paciente_id,
            tipo_tratamiento,
            pacientes (
              id,
              nombre,
              apellidos,
              telefono
            ),
            doctores (
              nombre,
              apellidos,
              color_calendario
            )
          `)
          .eq('clinica_id', clinica_id)
          .gte('inicio', inicioISO)
          .lte('inicio', finISO),

        // 2. Conteo de pacientes nuevos en el período
        supabase
          .from('pacientes')
          .select('id', { count: 'exact', head: true })
          .eq('clinica_id', clinica_id)
          .gte('created_at', inicioISO)
          .lte('created_at', finISO),

        // 3. Conteo total de pacientes en la clínica
        supabase
          .from('pacientes')
          .select('id', { count: 'exact', head: true })
          .eq('clinica_id', clinica_id)
      ])

      // Validación de errores
      if (citasRes.error) throw citasRes.error
      if (pacientesNuevosRes.error) throw pacientesNuevosRes.error
      if (totalPacientesRes.error) throw totalPacientesRes.error

      setCitasPeriodo(citasRes.data || [])
      setPacientesNuevos(pacientesNuevosRes.count || 0)
      setTotalPacientes(totalPacientesRes.count || 0)
    } catch (err) {
      console.error('Error al consultar datos del dashboard:', err)
      setError(err.message || 'Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin, clinica_id])

  // Recargar los datos cuando cambian las fechas
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    citasPeriodo,
    pacientesNuevos,
    totalPacientes,
    loading,
    error,
    refetch: fetchData
  }
}
