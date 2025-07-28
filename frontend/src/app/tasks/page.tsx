'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tasksAPI, authAPI, usersAPI } from '@/lib/api'
import { Filter, Search, Calendar, Target, Zap, Heart, HeartOff } from 'lucide-react'
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

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
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

const difficultyLabels = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor'
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    difficulty: '',
    search: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchTasks()
  }, [router])

  useEffect(() => {
    filterTasks()
  }, [tasks, filters])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const [tasksResponse, userResponse] = await Promise.all([
        tasksAPI.getTasks(),
        authAPI.getMe()
      ])
      setTasks(tasksResponse.data)
      setUser(userResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görevler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filterTasks = () => {
    let filtered = tasks

    if (filters.type) {
      filtered = filtered.filter(task => task.type === filters.type)
    }

    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category)
    }

    if (filters.difficulty) {
      filtered = filtered.filter(task => task.difficulty === filters.difficulty)
    }

    if (filters.search) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    setFilteredTasks(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      difficulty: '',
      search: ''
    })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Görevler yükleniyor...</p>
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Görevler</h1>
                <p className="text-gray-600">Puan kazanmak için sürdürülebilirlik görevlerini tamamlayın</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredTasks.length} / {tasks.length} görev
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filtreler</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Tümünü temizle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Görev ara..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tüm Türler</option>
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="one_time">Tek Seferlik</option>
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="health">Sağlık</option>
                <option value="education">Eğitim</option>
                <option value="work">İş</option>
                <option value="social">Sosyal</option>
                <option value="environment">Çevre</option>
                <option value="other">Diğer</option>
                <option value="group">Grup Görevleri</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Tüm Zorluklar</option>
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      {task.is_group_task && (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          Grup
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{task.description}</p>
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
                        <Heart className="w-5 h-5 fill-current" />
                      ) : (
                        <Heart className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-bold text-yellow-600">{task.points}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[task.type]}`}>
                    {typeLabels[task.type]}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${categoryColors[task.category]}`}>
                    {categoryLabels[task.category]}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[task.difficulty]}`}>
                    {difficultyLabels[task.difficulty]}
                  </span>
                </div>

                <button
                  onClick={() => router.push(`/tasks/${task.id || task._id}`)}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Detayları Görüntüle
                </button>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && !loading && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Görev bulunamadı</h3>
              <p className="text-gray-600">Filtrelerinizi veya arama terimlerinizi ayarlamayı deneyin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 