'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { tasksAPI, authAPI, usersAPI } from '@/lib/api'
import { CheckCircle, Calendar, Zap, Target, TrendingUp, Heart, HeartOff } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface TaskCompletion {
  id: string
  task_id: string
  user_id: string
  group_id?: string
  completed_at: string
  points_earned: number
  task?: {
    id: string
    title: string
    description: string
    type: string
    category: string
    difficulty: string
    points: number
  }
}

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

export default function MyTasksPage() {
  const router = useRouter()
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [favoriteTasks, setFavoriteTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'favorites' | 'completed'>('favorites')
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())

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
      // First get user data
      const userResponse = await authAPI.getMe()
      const userData = userResponse.data
      setUser(userData)

      console.log('User data:', userData)

              // Then get user's task completions only if we have user data
        if (userData && (userData.id || userData._id)) {
          const userId = userData.id || userData._id
          try {
            console.log('Fetching completions for user ID:', userId)
            const completionsData = await tasksAPI.getUserCompletions(userId)
            console.log('Completions response:', completionsData)
            const completionsArray = completionsData.data
            setCompletions(completionsArray)
            
            // Get all tasks first to check completion status
            try {
              const allTasksResponse = await tasksAPI.getTasks()
              const allTasks = allTasksResponse.data
              
              // Check which tasks are completed in current time period
              const now = new Date()
              const completedIds = new Set<string>()
              
                          completionsArray.forEach((completion: any) => {
              const completionDate = new Date(completion.completed_at)
              const taskId = completion.task_id
              
              // Find the task to get its type
              const task = allTasks.find((t: Task) => (t.id || t._id) === taskId)
              if (!task) {
                return
              }
              
              const isCompletedInCurrentPeriod = checkTaskCompletionInPeriod(task.type, completionDate, now)
              
              if (isCompletedInCurrentPeriod) {
                completedIds.add(taskId)
              }
            })
              setCompletedTaskIds(completedIds)
              
              // Get favorite tasks
              if (userData.favorite_tasks && userData.favorite_tasks.length > 0) {
                const favorites = allTasks.filter((task: Task) => 
                  userData.favorite_tasks?.includes(task.id || task._id || '')
                )
                setFavoriteTasks(favorites)
              }
            } catch (err: any) {
              console.error('Failed to fetch tasks:', err)
              setFavoriteTasks([])
            }
          } catch (err: any) {
            console.error('Failed to fetch completions:', err)
            setCompletions([])
          }
        } else {
          console.log('No user ID found:', userData)
        }
      
    } catch (err: any) {
      console.error('Error in fetchData:', err)
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
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
        setFavoriteTasks(prev => prev.filter(task => (task.id || task._id) !== taskId))
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

  const checkTaskCompletionInPeriod = (taskType: string, completionDate: Date, now: Date) => {
    if (taskType === 'daily') {
      // Check if completed today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      return completionDate >= today && completionDate < tomorrow
    } else if (taskType === 'weekly') {
      // Check if completed this week (Monday to Sunday)
      const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1
      const monday = new Date(now.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000)
      monday.setHours(0, 0, 0, 0)
      const nextMonday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000)
      return completionDate >= monday && completionDate < nextMonday
    } else if (taskType === 'monthly') {
      // Check if completed this month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      return completionDate >= firstDayOfMonth && completionDate < firstDayOfNextMonth
    } else if (taskType === 'one_time') {
      // One-time tasks are always considered completed
      return true
    }
    return false
  }

  const isTaskCompleted = (taskId: string) => {
    // Use the completedTaskIds set that was calculated during fetchData
    const isCompleted = completedTaskIds.has(taskId)
    return isCompleted
  }

  const getTotalPoints = () => {
    return completions.reduce((total, completion) => total + completion.points_earned, 0)
  }

  const getCompletionStats = () => {
    const today = new Date()
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const todayCompletions = completions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate.toDateString() === today.toDateString()
    })

    const weekCompletions = completions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate >= thisWeek
    })

    const monthCompletions = completions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate >= thisMonth
    })

    return {
      total: completions.length,
      today: todayCompletions.length,
      thisWeek: weekCompletions.length,
      thisMonth: monthCompletions.length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Görevlerim</h1>
                <p className="text-gray-600">Favori görevlerinizi ve tamamlanan görevlerinizi yönetin</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'favorites'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Favori Görevler ({favoriteTasks.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'completed'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Tamamlanan Görevler ({completions.length})</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Tamamlanan</p>
                  <p className="text-2xl font-bold text-gray-900">{getCompletionStats().total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Puan</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalPoints()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Ay</p>
                  <p className="text-2xl font-bold text-gray-900">{getCompletionStats().thisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
                  <p className="text-2xl font-bold text-gray-900">{getCompletionStats().thisWeek}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'favorites' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Favori Görevlerim</h2>
              </div>

              {favoriteTasks.length === 0 ? (
                <div className="p-12 text-center">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz favori göreviniz yok</h3>
                  <p className="text-gray-600 mb-6">Görevler sayfasından favori görevlerinizi ekleyin!</p>
                  <button
                    onClick={() => router.push('/tasks')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Görevleri Görüntüle
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {favoriteTasks.map((task) => (
                    <div key={task.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                            <span className="flex items-center space-x-1 text-yellow-600">
                              <Zap className="w-4 h-4" />
                              <span className="font-medium">{task.points}</span>
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{task.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {task.type === 'daily' ? 'Günlük' : 
                               task.type === 'weekly' ? 'Haftalık' : 
                               task.type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {task.category === 'health' ? 'Sağlık' :
                               task.category === 'education' ? 'Eğitim' :
                               task.category === 'work' ? 'İş' :
                               task.category === 'social' ? 'Sosyal' :
                               task.category === 'environment' ? 'Çevre' :
                               task.category === 'group' ? 'Grup Görevi' : 'Diğer'}
                            </span>
                            {task.is_group_task && (
                              <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                                Grup
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleFavorite(task.id || task._id || '')}
                            className="p-2 text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Heart className="w-5 h-5 fill-current" />
                          </button>
                          {isTaskCompleted(task.id || task._id || '') ? (
                            <div className="flex items-center space-x-2 py-2 px-4 rounded-lg font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                {task.type === 'daily' && 'Bu görev bugün tamamlandı'}
                                {task.type === 'weekly' && 'Bu görev bu hafta tamamlandı'}
                                {task.type === 'monthly' && 'Bu görev bu ay tamamlandı'}
                                {task.type === 'one_time' && 'Bu görev tamamlandı'}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => router.push(`/tasks/${task.id || task._id}`)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Tamamla
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Son Tamamlananlar</h2>
              </div>

              {completions.length === 0 ? (
                <div className="p-12 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz tamamlanan görev yok</h3>
                  <p className="text-gray-600 mb-6">İlk görevinizi tamamlayarak sürdürülebilirlik yolculuğunuza başlayın!</p>
                  <button
                    onClick={() => router.push('/tasks')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Görevleri Görüntüle
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {completions.map((completion) => (
                    <div key={completion.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-medium text-gray-900">
                              {completion.task?.title || 'Görev'}
                            </h3>

                            <span className="flex items-center space-x-1 text-yellow-600">
                              <Zap className="w-4 h-4" />
                              <span className="font-semibold">{completion.points_earned}</span>
                            </span>
                          </div>
                          
                          {completion.task?.description && (
                            <p className="text-gray-600 mb-3">{completion.task.description}</p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(completion.completed_at).toLocaleDateString('tr-TR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            {completion.task?.type && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {completion.task.type}
                              </span>
                            )}
                            
                            {completion.task?.category && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                {completion.task.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Summary */}
          {completions.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İlerleme Özeti</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bugünkü İlerleme</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(getCompletionStats().today * 20, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{getCompletionStats().today}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Haftalık İlerleme</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(getCompletionStats().thisWeek * 10, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{getCompletionStats().thisWeek}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Aylık İlerleme</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(getCompletionStats().thisMonth * 5, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{getCompletionStats().thisMonth}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 