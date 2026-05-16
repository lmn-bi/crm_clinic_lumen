import React from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, perfil, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error al cerrar sesión', error)
    }
  }

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-end px-4 sm:px-6 lg:px-8 border-b border-gray-200">
      <div className="flex items-center space-x-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-medium text-gray-900">
            {perfil?.nombre || user?.email}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {perfil?.rol || 'Usuario'}
          </span>
        </div>
        
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
          <User className="h-5 w-5" />
        </div>

        <button
          onClick={handleLogout}
          className="ml-4 p-2 text-gray-400 hover:text-danger rounded-full hover:bg-red-50 transition-colors focus:outline-none"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
