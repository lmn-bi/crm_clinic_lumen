import React from 'react'
import { Edit2, Trash2, Calendar } from 'lucide-react'

export default function DoctoresTable({ doctores, onEdit, onDelete, onViewAgenda }) {
  if (!doctores || doctores.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500">No se encontraron doctores registrados.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Doctor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Especialidad
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Estado / Color
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {doctores.map((doctor) => (
            <tr key={doctor.id} className={`hover:bg-gray-50 transition-colors ${!doctor.activo ? 'opacity-60' : ''}`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div 
                    className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: doctor.color_calendario || '#3B82F6' }}
                  >
                    {doctor.nombre?.charAt(0)}{doctor.apellidos?.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      Dr/a. {doctor.nombre} {doctor.apellidos}
                    </div>
                    <div className="text-xs text-gray-500">
                      Col: {doctor.num_colegiado || 'N/A'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{doctor.especialidad || 'General'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{doctor.telefono || 'Sin teléfono'}</div>
                <div className="text-sm text-gray-500">{doctor.email || 'Sin email'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  doctor.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.activo ? 'Activo' : 'Inactivo'}
                </span>
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {doctor.horario && doctor.horario.length > 0 ? `${new Set(doctor.horario.map(h => h.dia)).size} días` : 'Sin horario'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => onViewAgenda(doctor)}
                  className="text-gray-500 hover:text-green-600 transition-colors focus:outline-none"
                  title="Ver Agenda Semanal"
                >
                  <Calendar className="h-4 w-4 inline" />
                </button>
                <button
                  onClick={() => onEdit(doctor)}
                  className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                  title="Editar doctor"
                >
                  <Edit2 className="h-4 w-4 inline" />
                </button>
                <button
                  onClick={() => onDelete(doctor)}
                  className="text-gray-500 hover:text-danger transition-colors focus:outline-none"
                  title="Eliminar doctor"
                >
                  <Trash2 className="h-4 w-4 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
