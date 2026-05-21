import { supabase } from '../lib/supabaseClient'

/**
 * Mapa de día de la semana (JS getDay()) a nombre en español.
 * getDay(): 0=Domingo, 1=Lunes, ..., 6=Sábado
 */
const DIA_MAP = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
}

/**
 * Verifica si una cita cae dentro del horario laboral de un doctor.
 * 
 * @param {Array} horario - Array de tramos: [{ dia: 'Lunes', inicio: '09:00', fin: '13:00' }, ...]
 * @param {Date} citaInicio - Fecha/hora de inicio de la cita
 * @param {Date} citaFin - Fecha/hora de fin de la cita
 * @returns {{ valido: boolean, mensaje: string }}
 */
export function validarHorarioDoctor(horario, citaInicio, citaFin) {
  if (!horario || horario.length === 0) {
    // Si el doctor no tiene horario definido, permitir cualquier cita
    return { valido: true, mensaje: '' }
  }

  const diaSemana = citaInicio.getDay()
  const diaNombre = DIA_MAP[diaSemana]

  // Filtrar los tramos de ese día
  const tramosDelDia = horario.filter(h => h.dia === diaNombre)

  if (tramosDelDia.length === 0) {
    return {
      valido: false,
      mensaje: `El doctor no trabaja los ${diaNombre}.`
    }
  }

  // Convertir hora de la cita a formato HH:MM para comparar con los tramos
  const citaInicioHHMM = citaInicio.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  const citaFinHHMM = citaFin.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Verificar si la cita completa (inicio y fin) cae dentro de algún tramo
  const dentroDeAlgunTramo = tramosDelDia.some(tramo => {
    return citaInicioHHMM >= tramo.inicio && citaFinHHMM <= tramo.fin
  })

  if (!dentroDeAlgunTramo) {
    const horariosStr = tramosDelDia.map(t => `${t.inicio} - ${t.fin}`).join(' y ')
    return {
      valido: false,
      mensaje: `La cita está fuera del horario del doctor (${diaNombre}: ${horariosStr}).`
    }
  }

  return { valido: true, mensaje: '' }
}

/**
 * Obtiene el horario de un doctor por su ID.
 * @param {string} doctorId - UUID del doctor
 * @returns {Promise<Array>} - Array de tramos del horario
 */
export async function fetchHorarioDoctor(doctorId) {
  const { data, error } = await supabase
    .from('doctores')
    .select('horario')
    .eq('id', doctorId)
    .single()

  if (error || !data) return []
  return data.horario || []
}

/**
 * Genera las franjas "no disponibles" para un día dado del doctor.
 * Retorna un array de { top, height } en píxeles para pintar overlays grises.
 * 
 * @param {Array} horario - Horario completo del doctor
 * @param {number} diaSemanaJS - Día de la semana (0=Dom, 6=Sáb)
 * @param {number} horaInicio - Hora de inicio del calendario (ej: 8)
 * @param {number} horaFin - Hora de fin del calendario (ej: 20)
 * @param {number} pxPorHora - Píxeles por hora en el grid (ej: 120)
 * @returns {Array<{ top: number, height: number }>}
 */
export function calcularZonasNoDisponibles(horario, diaSemanaJS, horaInicio = 8, horaFin = 20, pxPorHora = 120) {
  if (!horario || horario.length === 0) return []

  const diaNombre = DIA_MAP[diaSemanaJS]
  const tramosDelDia = horario.filter(h => h.dia === diaNombre)

  // Si el doctor no trabaja ese día, todo el día es no disponible
  if (tramosDelDia.length === 0) {
    return [{ top: 0, height: (horaFin - horaInicio) * pxPorHora }]
  }

  // Convertir tramos a minutos desde el inicio del calendario
  const tramosEnMin = tramosDelDia
    .map(t => {
      const [hi, mi] = t.inicio.split(':').map(Number)
      const [hf, mf] = t.fin.split(':').map(Number)
      return {
        inicioMin: (hi - horaInicio) * 60 + mi,
        finMin: (hf - horaInicio) * 60 + mf
      }
    })
    .sort((a, b) => a.inicioMin - b.inicioMin)

  const totalMin = (horaFin - horaInicio) * 60
  const pxPorMin = pxPorHora / 60
  const zonas = []
  let cursor = 0

  for (const tramo of tramosEnMin) {
    if (tramo.inicioMin > cursor) {
      zonas.push({
        top: cursor * pxPorMin,
        height: (tramo.inicioMin - cursor) * pxPorMin
      })
    }
    cursor = Math.max(cursor, tramo.finMin)
  }

  // Zona después del último tramo
  if (cursor < totalMin) {
    zonas.push({
      top: cursor * pxPorMin,
      height: (totalMin - cursor) * pxPorMin
    })
  }

  return zonas
}
