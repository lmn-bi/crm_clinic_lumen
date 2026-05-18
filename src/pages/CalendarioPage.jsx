import React from 'react'
import { Calendar } from 'lucide-react'
import CalendarioMain from '../components/calendario/CalendarioMain'

export default function CalendarioPage() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-primary" />
          Agenda y Calendario
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona las citas de la clínica.
        </p>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CalendarioMain />
      </div>
    </div>
  )
}
