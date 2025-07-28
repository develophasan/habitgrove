'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  Users, 
  Target, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings,
  Shield,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface User {
  id: string
  name: string
  email: string
  points: number
  is_admin: boolean
  created_at: string
}

interface Statistics {
  total_users: number
  total_tasks: number
  total_groups: number
  total_completions: number
  top_users: User[]
  top_groups: any[]
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [userResponse, statsResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getStatistics()
      ])

      const userData = userResponse.data
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      setStatistics(statsResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const adminMenuItems = [
    {
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcıları görüntüle, düzenle ve yönet',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500'
    },
    {
      title: 'Görev Yönetimi',
      description: 'Görevleri oluştur, düzenle ve sil',
      icon: Target,
      href: '/admin/tasks',
      color: 'bg-green-500'
    },
    {
      title: 'Grup Yönetimi',
      description: 'Grupları ve adminlerini yönet',
      icon: Building2,
      href: '/admin/groups',
      color: 'bg-purple-500'
    },
    {
      title: 'Admin Talepleri',
      description: 'Grup admin talep formlarını incele',
      icon: FileText,
      href: '/admin/requests',
      color: 'bg-orange-500'
    },
    {
      title: 'İstatistikler',
      description: 'Detaylı analitik ve raporlar',
      icon: BarChart3,
      href: '/admin/statistics',
      color: 'bg-red-500'
    },
    {
      title: 'Sistem Ayarları',
      description: 'Sistem konfigürasyonu',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Admin paneli yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Dashboard'a Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={user.name} />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Paneli</h1>
                <p className="text-gray-600">Sistem yönetimi ve analitik</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Quick Stats */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Görev</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_tasks}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Grup</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_groups}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tamamlanan Görev</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_completions}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Menu */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Yönetim Menüsü</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminMenuItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <div
                    key={item.title}
                    onClick={() => router.push(item.href)}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${item.color}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Users */}
          {statistics?.top_users && statistics.top_users.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">En Aktif Kullanıcılar</h2>
              
              <div className="space-y-4">
                {statistics.top_users.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-900">{user.points} puan</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 