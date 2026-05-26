import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />
      
      {/* Contenido principal, margin izquierdo para hacer espacio al sidebar */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header superior */}
        <Header />
        
        {/* Contenido dinámico de las rutas */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
