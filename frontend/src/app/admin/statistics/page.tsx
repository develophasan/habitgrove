'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Building2, 
  Award,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Statistics {
  period: string
  total_users: number
  total_tasks: number
  total_groups: number
  total_completions: number
  top_users: any[]
  top_groups: any[]
}

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

export default function AdminStatisticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchData()
  }, [router, selectedPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const [userResponse, statsResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getStatistics(selectedPeriod)
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

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'all': return 'Tüm Zamanlar'
      case 'daily': return 'Bugün'
      case 'weekly': return 'Bu Hafta'
      case 'monthly': return 'Bu Ay'
      case 'yearly': return 'Bu Yıl'
      default: return period
    }
  }

  const exportData = () => {
    if (!statistics) return

    const data = {
      period: getPeriodLabel(statistics.period),
      summary: {
        total_users: statistics.total_users,
        total_tasks: statistics.total_tasks,
        total_groups: statistics.total_groups,
        total_completions: statistics.total_completions
      },
      top_users: statistics.top_users,
      top_groups: statistics.top_groups,
      export_date: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `habitsgrove-statistics-${statistics.period}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">İstatistikler yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">İstatistikler</h1>
                  <p className="text-gray-600">Detaylı analitik ve raporlar</p>
                </div>
              </div>
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Veri İndir</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Period Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Dönem:</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="daily">Bugün</option>
                <option value="weekly">Bu Hafta</option>
                <option value="monthly">Bu Ay</option>
                <option value="yearly">Bu Yıl</option>
              </select>
            </div>
          </div>

          {statistics && (
            <>
              {/* Summary Cards */}
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

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Users */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">En Aktif Kullanıcılar</h2>
                    <Award className="w-5 h-5 text-yellow-500" />
                  </div>
                  
                  <div className="space-y-4">
                    {statistics.top_users.slice(0, 10).map((user, index) => (
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

                {/* Top Groups */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">En Aktif Gruplar</h2>
                    <Building2 className="w-5 h-5 text-purple-500" />
                  </div>
                  
                  <div className="space-y-4">
                    {statistics.top_groups.slice(0, 10).map((group, index) => (
                      <div key={group.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.members.length} üye</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-gray-900">{group.total_points} puan</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Completion Rate */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tamamlanma Oranı</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statistics.total_tasks > 0 
                        ? Math.round((statistics.total_completions / statistics.total_tasks) * 100)
                        : 0}%
                    </div>
                    <p className="text-sm text-gray-600">
                      {statistics.total_completions} / {statistics.total_tasks} görev tamamlandı
                    </p>
                  </div>
                </div>

                {/* Average Points per User */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Başına Ortalama Puan</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statistics.total_users > 0 
                        ? Math.round(statistics.top_users.reduce((sum, user) => sum + user.points, 0) / statistics.total_users)
                        : 0}
                    </div>
                    <p className="text-sm text-gray-600">ortalama puan</p>
                  </div>
                </div>

                {/* Period Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dönem Bilgisi</h3>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {getPeriodLabel(statistics.period)}
                    </div>
                    <p className="text-sm text-gray-600">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {new Date().toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
} 