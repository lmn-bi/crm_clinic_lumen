import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook para obtener y mantener sincronizadas las citas en tiempo real.
 * @param {Date} inicioSemana - Inicio del rango (en UTC)
 * @param {Date} finSemana - Fin del rango (en UTC)
 * @param {Array<string>} doctoresFiltro - Array de UUIDs de doctores, vacío significa "todos"
 * @param {string} clinica_id - UUID de la clínica a filtrar
 * @returns {{ citas: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export default function useCitasRealtime(inicioSemana, finSemana, doctoresFiltro = [], clinica_id) {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCitas = async () => {
    if (!inicioSemana || !finSemana || !clinica_id) return

    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('citas')
        .select(`
          *,
          pacientes (nombre, apellidos),
          doctores (nombre, apellidos, color_calendario, horario)
        `)
        .eq('clinica_id', clinica_id)
        .gte('inicio', inicioSemana.toISOString())
        .lte('inicio', finSemana.toISOString())
        .neq('estado', 'cancelada')
      
      if (doctoresFiltro.length > 0) {
        query = query.in('doctor_id', doctoresFiltro)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setCitas(data || [])
    } catch (err) {
      console.error('Error cargando citas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCitas()

    // Configurar suscripción Realtime para la tabla citas
    const channel = supabase
      .channel('public:citas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'citas', filter: `clinica_id=eq.${clinica_id}` }, async (payload) => {
        const newCitaId = payload.new.id
        // Hacemos fetch manual de la nueva cita para traer los datos relacionados (paciente y doctor)
        const { data: newCita } = await supabase
          .from('citas')
          .select('*, pacientes (nombre, apellidos), doctores (nombre, apellidos, color_calendario, horario)')
          .eq('id', newCitaId)
          .single()

        if (newCita) {
          setCitas(prev => {
            // Verificar si entra en el rango actual y filtros
            const inicioDate = new Date(newCita.inicio)
            if (inicioDate >= inicioSemana && inicioDate <= finSemana && newCita.estado !== 'cancelada') {
              const matchesDoctor = doctoresFiltro.length === 0 || doctoresFiltro.includes(newCita.doctor_id)
              if (matchesDoctor) {
                // Evitar duplicados por race conditions
                if (!prev.find(c => c.id === newCita.id)) {
                  return [...prev, newCita]
                }
              }
            }
            return prev
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'citas', filter: `clinica_id=eq.${clinica_id}` }, async (payload) => {
        const updatedCitaId = payload.new.id
        // Fetch para relaciones
        const { data: updatedCita } = await supabase
          .from('citas')
          .select('*, pacientes (nombre, apellidos), doctores (nombre, apellidos, color_calendario, horario)')
          .eq('id', updatedCitaId)
          .single()

        if (updatedCita) {
          setCitas(prev => {
            const inicioDate = new Date(updatedCita.inicio)
            // Si la cita editada cae fuera del rango actual, o ha sido cancelada, o no cumple filtro, la quitamos
            const inRange = inicioDate >= inicioSemana && inicioDate <= finSemana
            const isCanceled = updatedCita.estado === 'cancelada'
            const matchesDoctor = doctoresFiltro.length === 0 || doctoresFiltro.includes(updatedCita.doctor_id)

            if (!inRange || isCanceled || !matchesDoctor) {
              return prev.filter(c => c.id !== updatedCita.id)
            } else {
              // Si ya existe la reemplazamos, si no la agregamos
              const exists = prev.find(c => c.id === updatedCita.id)
              if (exists) {
                return prev.map(c => c.id === updatedCita.id ? updatedCita : c)
              } else {
                return [...prev, updatedCita]
              }
            }
          })
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'citas', filter: `clinica_id=eq.${clinica_id}` }, (payload) => {
        const deletedCitaId = payload.old.id
        setCitas(prev => prev.filter(c => c.id !== deletedCitaId))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [inicioSemana, finSemana, JSON.stringify(doctoresFiltro), clinica_id])

  return { citas, loading, error, refetch: fetchCitas }
}
