import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Calendar, Stethoscope, FileText, Settings, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Sidebar() {
  const { perfil } = useAuth()
  const location = useLocation()

  // Definir todos los enlaces posibles
  const allLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin'] },
    { name: 'Calendario', path: '/calendario', icon: Calendar, roles: ['admin', 'doctor'] },
    { name: 'Pacientes', path: '/pacientes', icon: Users, roles: ['admin', 'doctor'] },
    { name: 'Doctores', path: '/doctores', icon: Stethoscope, roles: ['admin'] },
    { name: 'Presupuestos', path: '/presupuestos', icon: FileText, roles: ['admin'] },
    { name: 'Configuración', path: '/settings', icon: Settings, roles: ['admin'] },
  ]

  // Filtrar según el rol del usuario
  const navLinks = allLinks.filter(link => link.roles.includes(perfil?.rol))
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary text-white">
          <Stethoscope className="h-8 w-8 mr-2" />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wider leading-none">LUMEN CRM</span>
            <span className="text-[10px] text-blue-200 mt-1.5 uppercase font-extrabold tracking-widest truncate max-w-[170px]" title={perfil?.clinicas?.nombre || 'Mi Clínica'}>
              {perfil?.clinicas?.nombre || 'Mi Clínica'}
            </span>
          </div>
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
                      ? 'bg-blue-50 dark:bg-gray-700 text-primary dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
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
        
        {/* Toggle Theme Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={toggleTheme}
            className="flex-shrink-0 w-full group block focus:outline-none"
          >
            <div className="flex items-center">
              <div className="inline-block p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
