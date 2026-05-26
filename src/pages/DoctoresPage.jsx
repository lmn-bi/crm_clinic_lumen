import React, { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import DoctoresTable from '../components/doctores/DoctoresTable'
import DoctorFormModal from '../components/doctores/DoctorFormModal'
import DoctorAgendaPanel from '../components/doctores/DoctorAgendaPanel'
import { useAuth } from '../context/AuthContext'

export default function DoctoresPage() {
  const [doctores, setDoctores] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [doctorToEdit, setDoctorToEdit] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAgendaOpen, setIsAgendaOpen] = useState(false)
  const [doctorForAgenda, setDoctorForAgenda] = useState(null)

  const { perfil } = useAuth()

  const fetchDoctores = async () => {
    if (!perfil?.clinica_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('doctores')
        .select('*')
        .eq('clinica_id', perfil.clinica_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDoctores(data || [])
    } catch (error) {
      console.error('Error cargando doctores:', error)
      alert(`Error al cargar doctores: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (perfil?.clinica_id) {
      fetchDoctores()
    }
  }, [perfil?.clinica_id])

  const handleOpenNew = () => {
    setDoctorToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (doctor) => {
    setDoctorToEdit(doctor)
    setIsModalOpen(true)
  }

  const handleDelete = async (doctor) => {
    if (window.confirm(`¿Estás seguro de archivar a Dr/a. ${doctor.nombre} ${doctor.apellidos}? El doctor pasará a estado inactivo pero no se borrará su historial.`)) {
      try {
        const { error } = await supabase
          .from('doctores')
          .update({ activo: false })
          .eq('id', doctor.id)
        
        if (error) throw error
        fetchDoctores()
      } catch (error) {
        console.error('Error archivando doctor:', error)
        alert('Hubo un error al archivar el doctor.')
      }
    }
  }

  const handleOpenAgenda = (doctor) => {
    setDoctorForAgenda(doctor)
    setIsAgendaOpen(true)
  }

  // Filtrado en tiempo real
  const filteredDoctores = doctores.filter((doctor) => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    const searchableString = `
      ${doctor.nombre || ''} 
      ${doctor.apellidos || ''} 
      ${doctor.especialidad || ''} 
      ${doctor.telefono || ''} 
      ${doctor.email || ''} 
      ${doctor.num_colegiado || ''}
    `.toLowerCase()

    return searchableString.includes(searchLower)
  })

  return (
    <div>
      {/* Cabecera de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Doctores</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Directorio de profesionales médicos, sus especialidades y disponibilidad.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Doctor
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad, colegiado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-800 dark:text-white transition-colors"
        />
      </div>

      {/* Contenido (Tabla o Estado de carga) */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <DoctoresTable 
          doctores={filteredDoctores} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onViewAgenda={handleOpenAgenda}
        />
      )}

      {/* Modal de Formulario */}
      <DoctorFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctorToEdit={doctorToEdit}
        onSaveSuccess={fetchDoctores}
      />

      {/* Panel de Agenda Semanal */}
      <DoctorAgendaPanel
        isOpen={isAgendaOpen}
        onClose={() => setIsAgendaOpen(false)}
        doctor={doctorForAgenda}
      />
    </div>
  )
}
