import React, { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import PacientesTable from '../components/pacientes/PacientesTable'
import PacienteFormModal from '../components/pacientes/PacienteFormModal'
import PacienteFichaPanel from '../components/pacientes/PacienteFichaPanel'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pacienteToEdit, setPacienteToEdit] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado para la ficha del paciente
  const [isFichaOpen, setIsFichaOpen] = useState(false)
  const [pacienteForFicha, setPacienteForFicha] = useState(null)

  const fetchPacientes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPacientes(data || [])
    } catch (error) {
      console.error('Error cargando pacientes:', error)
      alert(`Error al cargar pacientes: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPacientes()
  }, [])

  const handleOpenNew = () => {
    setPacienteToEdit(null)
    setIsModalOpen(true)
  }

  const handleEdit = (paciente) => {
    setPacienteToEdit(paciente)
    setIsModalOpen(true)
  }

  const handleViewFicha = (paciente) => {
    setPacienteForFicha(paciente)
    setIsFichaOpen(true)
  }

  const handleDelete = async (paciente) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${paciente.nombre} ${paciente.apellidos}?`)) {
      try {
        const { error } = await supabase
          .from('pacientes')
          .delete()
          .eq('id', paciente.id)
        
        if (error) throw error
        fetchPacientes()
      } catch (error) {
        console.error('Error eliminando paciente:', error)
        alert('Hubo un error al eliminar el paciente.')
      }
    }
  }

  // Lógica de filtrado en tiempo real
  const filteredPacientes = pacientes.filter((paciente) => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    const searchableString = `
      ${paciente.nombre || ''} 
      ${paciente.apellidos || ''} 
      ${paciente.telefono || ''} 
      ${paciente.email || ''} 
      ${paciente.doc_identidad || ''}
    `.toLowerCase()

    return searchableString.includes(searchLower)
  })

  return (
    <div>
      {/* Cabecera de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lista completa de los pacientes registrados en la clínica.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Paciente
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
          placeholder="Buscar por nombre, apellido, DNI, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      {/* Contenido (Tabla o Estado de carga) */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <PacientesTable 
          pacientes={filteredPacientes} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onViewFicha={handleViewFicha}
        />
      )}

      {/* Modal de Formulario */}
      <PacienteFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pacienteToEdit={pacienteToEdit}
        onSaveSuccess={fetchPacientes}
      />

      {/* Panel Deslizante de Ficha Personal */}
      <PacienteFichaPanel
        isOpen={isFichaOpen}
        onClose={() => setIsFichaOpen(false)}
        paciente={pacienteForFicha}
      />
    </div>
  )
}
