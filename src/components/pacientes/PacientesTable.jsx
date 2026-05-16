import React from 'react'
import { Edit2, Trash2, Eye } from 'lucide-react'

export default function PacientesTable({ pacientes, onEdit, onDelete, onViewFicha }) {
  if (!pacientes || pacientes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-gray-500">No se encontraron pacientes.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre Completo
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              DNI / Nacimiento
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pacientes.map((paciente) => (
            <tr key={paciente.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-primary font-bold">
                    {paciente.nombre.charAt(0)}{paciente.apellidos.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {paciente.nombre} {paciente.apellidos}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{paciente.telefono || 'Sin teléfono'}</div>
                <div className="text-sm text-gray-500">{paciente.email || 'Sin email'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <div className="text-sm text-gray-900 font-medium">
                  {paciente.doc_identidad || 'Sin DNI'}
                </div>
                <div className="text-sm text-gray-500">
                  {paciente.fecha_nacimiento 
                    ? new Date(paciente.fecha_nacimiento).toLocaleDateString() 
                    : 'Sin fecha nac.'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  onClick={() => onViewFicha(paciente)}
                  className="text-gray-500 hover:text-primary transition-colors focus:outline-none"
                  title="Ver ficha completa"
                >
                  <Eye className="h-5 w-5 inline" />
                </button>
                <button
                  onClick={() => onEdit(paciente)}
                  className="text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
                  title="Editar paciente"
                >
                  <Edit2 className="h-4 w-4 inline" />
                </button>
                <button
                  onClick={() => onDelete(paciente)}
                  className="text-gray-500 hover:text-danger transition-colors focus:outline-none"
                  title="Eliminar paciente"
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
