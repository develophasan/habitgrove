'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { 
  Home, 
  Target, 
  Users, 
  User, 
  LogOut,
  Shield
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

interface NavigationProps {
  userName: string
}

export default function Navigation({ userName }: NavigationProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await authAPI.getMe()
      setUser(response.data)
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Görevler',
      href: '/tasks',
      icon: Target
    },
    {
      name: 'Görevlerim',
      href: '/my-tasks',
      icon: Target
    },
    {
      name: 'Gruplar',
      href: '/group',
      icon: Users
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: User
    }
  ]

  // Add admin panel link for admin users
  if (user?.is_admin) {
    navigationItems.push({
      name: 'Admin Paneli',
      href: '/admin',
      icon: Shield
    })
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-green-600">HabitGrove</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-green-600 transition-colors"
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {item.name}
                  </a>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Hoş geldin, <span className="font-medium">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 