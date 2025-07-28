'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tasksAPI, authAPI, usersAPI } from '@/lib/api'
import { Calendar, Target, Zap, TrendingUp, CheckCircle, Heart, HeartOff } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Task {
  id: string
  _id?: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'one_time'
  category: 'health' | 'education' | 'work' | 'social' | 'environment' | 'other' | 'group'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  isActive: boolean
  is_group_task?: boolean
  group_id?: string
}

interface User {
  id: string
  _id?: string
  name: string
  email: string
  points: number
  group_id?: string
  favorite_tasks?: string[]
}

const typeColors = {
  daily: 'bg-blue-100 text-blue-800',
  weekly: 'bg-purple-100 text-purple-800',
  monthly: 'bg-orange-100 text-orange-800',
  one_time: 'bg-red-100 text-red-800'
}

const categoryColors = {
  health: 'bg-green-100 text-green-800',
  education: 'bg-blue-100 text-blue-800',
  work: 'bg-yellow-100 text-yellow-800',
  social: 'bg-purple-100 text-purple-800',
  environment: 'bg-emerald-100 text-emerald-800',
  other: 'bg-gray-100 text-gray-800',
  group: 'bg-indigo-100 text-indigo-800'
}

const typeLabels = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  one_time: 'Tek Seferlik'
}

const categoryLabels = {
  health: 'Sağlık',
  education: 'Eğitim',
  work: 'İş',
  social: 'Sosyal',
  environment: 'Çevre',
  other: 'Diğer',
  group: 'Grup Görevi'
}

export default function DashboardPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [completedTasks, setCompletedTasks] = useState<any[]>([])

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

      const [tasksResponse, userResponse] = await Promise.all([
        tasksAPI.getTasks(),
        authAPI.getMe()
      ])

      setTasks(tasksResponse.data)
      setUser(userResponse.data)

      // Fetch completed tasks
      if (userResponse.data && (userResponse.data.id || userResponse.data._id)) {
        const userId = userResponse.data.id || userResponse.data._id
        try {
          const completionsResponse = await tasksAPI.getUserCompletions(userId)
          setCompletedTasks(completionsResponse.data)
        } catch (err) {
          console.error('Failed to fetch completions:', err)
          setCompletedTasks([])
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTasks = () => {
    let filteredTasks = tasks

    // Apply type filter
    if (selectedFilter === 'daily') {
      filteredTasks = filteredTasks.filter(task => task.type === 'daily')
    } else if (selectedFilter === 'weekly') {
      filteredTasks = filteredTasks.filter(task => task.type === 'weekly')
    } else if (selectedFilter === 'monthly') {
      filteredTasks = filteredTasks.filter(task => task.type === 'monthly')
    } else if (selectedFilter === 'one_time') {
      filteredTasks = filteredTasks.filter(task => task.type === 'one_time')
    } else if (selectedFilter === 'group') {
      filteredTasks = filteredTasks.filter(task => task.is_group_task === true)
    } else if (selectedFilter === 'favorites') {
      if (!user?.favorite_tasks || user.favorite_tasks.length === 0) {
        return []
      }
      
      filteredTasks = filteredTasks.filter(task => {
        const taskId = task.id || task._id
        return user.favorite_tasks?.includes(taskId || '')
      })
    }

    return filteredTasks.slice(0, 6)
  }

  const toggleFavorite = async (taskId: string) => {
    if (!user) return

    const userId = user.id || user._id
    if (!userId) return

    try {
      const isFavorite = user.favorite_tasks?.includes(taskId)
      
      if (isFavorite) {
        await usersAPI.removeFavoriteTask(userId, taskId)
        setUser(prev => prev ? {
          ...prev,
          favorite_tasks: prev.favorite_tasks?.filter(id => id !== taskId) || []
        } : null)
      } else {
        await usersAPI.addFavoriteTask(userId, taskId)
        setUser(prev => prev ? {
          ...prev,
          favorite_tasks: [...(prev.favorite_tasks || []), taskId]
        } : null)
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err)
    }
  }

  const isFavorite = (taskId: string) => {
    return user?.favorite_tasks?.includes(taskId) || false
  }

  const getCompletedTasksCount = () => {
    return completedTasks.length
  }

  const getTaskStats = () => {
    const daily = tasks.filter(task => task.type === 'daily').length
    const weekly = tasks.filter(task => task.type === 'weekly').length
    const monthly = tasks.filter(task => task.type === 'monthly').length
    const one_time = tasks.filter(task => task.type === 'one_time').length
    
    return { daily, weekly, monthly, one_time }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ana sayfa yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={user?.name} />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Ana Sayfa</h1>
            <p className="text-gray-600">Sürdürülebilirlik ilerlemenizi takip edin</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Puan</p>
                  <p className="text-2xl font-bold text-gray-900">{user?.points || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Mevcut Görevler</p>
                  <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{getCompletedTasksCount()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Seri</p>
                  <p className="text-2xl font-bold text-gray-900">0 gün</p>
                </div>
              </div>
            </div>
          </div>

          {/* Task Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Hızlı İşlemler</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Tüm Görevler</option>
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                  <option value="one_time">Tek Seferlik</option>
                  <option value="group">Grup Görevleri</option>
                  <option value="favorites">Favoriler</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredTasks().map((task) => (
                                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 text-sm">{task.title}</h3>
                          {task.is_group_task && (
                            <span className="px-1 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                              Grup
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleFavorite(task.id || task._id || '')}
                          className={`p-1 rounded-full transition-colors ${
                            isFavorite(task.id || task._id || '') 
                              ? 'text-red-500 hover:text-red-600' 
                              : 'text-gray-400 hover:text-red-500'
                          }`}
                        >
                          {isFavorite(task.id || task._id || '') ? (
                            <Heart className="w-3 h-3 fill-current" />
                          ) : (
                            <Heart className="w-3 h-3" />
                          )}
                        </button>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-semibold text-yellow-600">{task.points}</span>
                        </div>
                      </div>
                    </div>
                  
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[task.type]}`}>
                      {typeLabels[task.type]}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[task.category]}`}>
                      {categoryLabels[task.category]}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/tasks/${task.id || task._id}`)}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    Görevi Tamamla
                  </button>
                </div>
              ))}
            </div>

            {getFilteredTasks().length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push('/tasks')}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Tüm Görevleri Görüntüle
                </button>
              </div>
            )}
          </div>

          {/* Task Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Görev Dağılımı</h3>
              <div className="space-y-4">
                {Object.entries(getTaskStats()).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{typeLabels[type as keyof typeof typeLabels]}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            type === 'daily' ? 'bg-blue-600' :
                            type === 'weekly' ? 'bg-purple-600' :
                            type === 'monthly' ? 'bg-orange-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${(count / tasks.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Bağlantılar</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/tasks')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Tüm Görevleri Görüntüle</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
                
                <button
                  onClick={() => router.push('/my-tasks')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Tamamlanan Görevleri Görüntüle</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
                
                <button
                  onClick={() => router.push('/group')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Gruplara Katıl</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
                
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Profili Düzenle</span>
                  </div>
                  <span className="text-sm text-gray-500">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 