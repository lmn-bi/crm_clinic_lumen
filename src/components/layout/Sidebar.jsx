import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Stethoscope, FileText } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { perfil } = useAuth()
  const location = useLocation()

  // Definir todos los enlaces posibles
  const allLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Calendario', path: '/calendario', icon: Calendar, roles: ['admin', 'doctor'] },
    { name: 'Pacientes', path: '/pacientes', icon: Users, roles: ['admin'] },
    { name: 'Doctores', path: '/doctores', icon: Stethoscope, roles: ['admin'] },
    { name: 'Presupuestos', path: '/presupuestos', icon: FileText, roles: ['admin'] },
  ]

  // Filtrar según el rol del usuario
  const navLinks = allLinks.filter(link => link.roles.includes(perfil?.rol))

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary text-white">
          <Stethoscope className="h-8 w-8 mr-2" />
          <span className="font-bold text-xl tracking-wider">LUMEN CRM</span>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-primary' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5
                      ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
