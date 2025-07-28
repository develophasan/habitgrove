'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { tasksAPI, authAPI } from '@/lib/api'
import { ArrowLeft, Calendar, Target, Zap, CheckCircle, Users, Clock } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Task {
  id: string
  _id?: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  category: 'recycling' | 'water' | 'energy' | 'transport' | 'consumption'
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  isActive: boolean
}

interface User {
  id: string
  _id?: string
  name: string
  email: string
  points: number
  group_id?: string
}

const typeColors = {
  daily: 'bg-blue-100 text-blue-800',
  weekly: 'bg-purple-100 text-purple-800',
  monthly: 'bg-orange-100 text-orange-800',
  yearly: 'bg-red-100 text-red-800'
}

const categoryColors = {
  recycling: 'bg-green-100 text-green-800',
  water: 'bg-blue-100 text-blue-800',
  energy: 'bg-yellow-100 text-yellow-800',
  transport: 'bg-purple-100 text-purple-800',
  consumption: 'bg-pink-100 text-pink-800'
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
  yearly: 'Yıllık'
}

const categoryLabels = {
  recycling: 'Geri Dönüşüm',
  water: 'Su',
  energy: 'Enerji',
  transport: 'Ulaşım',
  consumption: 'Tüketim'
}

const difficultyLabels = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor'
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params?.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    if (taskId && taskId !== 'undefined') {
      fetchData()
    } else {
      setError('Geçersiz görev ID\'si')
      setLoading(false)
    }
  }, [router, taskId])

  const fetchData = async () => {
    if (!taskId || taskId === 'undefined') {
      setError('Görev ID\'si bulunamadı')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const [taskResponse, userResponse] = await Promise.all([
        tasksAPI.getTask(taskId),
        authAPI.getMe()
      ])
      
      setTask(taskResponse.data)
      setUser(userResponse.data)

      // Check if task is already completed by this user
      const userId = userResponse.data.id || userResponse.data._id
      if (userId) {
        try {
          const completionsResponse = await tasksAPI.getUserCompletions(userId)
          const completions = completionsResponse.data
          
          // Check if task is completed in the current time period
          const now = new Date()
          const currentTaskId = taskId || taskResponse.data._id
          
          const isTaskCompleted = completions.some((completion: any) => {
            if (completion.task_id !== currentTaskId && completion.task_id !== taskResponse.data._id) {
              return false
            }
            
            const completionDate = new Date(completion.completed_at)
            const taskType = taskResponse.data.type
            
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
            } else if (taskType === 'yearly') {
              // Check if completed this year
              const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
              const firstDayOfNextYear = new Date(now.getFullYear() + 1, 0, 1)
              return completionDate >= firstDayOfYear && completionDate < firstDayOfNextYear
            }
            
            return false
          })
          
          setIsCompleted(isTaskCompleted)
        } catch (err) {
          console.error('Error checking task completion status:', err)
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görev yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!task || !user) return

    const taskId = task.id || task._id
    const userId = user.id || user._id

    if (!taskId || !userId) {
      setError('Görev veya kullanıcı ID\'si bulunamadı')
      return
    }

    try {
      setCompleting(true)
      setError('')
      setSuccess('')

      const completionData = {
        task_id: taskId,
        user_id: userId,
        group_id: user.group_id
      }

      console.log('Sending completion data:', completionData)
      console.log('Task:', task)
      console.log('User:', user)

      await tasksAPI.completeTask(completionData)

      setSuccess(`Görev tamamlandı! ${task.points} puan kazandınız.`)
      setIsCompleted(true) // Mark task as completed
      
      // Refresh user data to get updated points
      const userResponse = await authAPI.getMe()
      setUser(userResponse.data)
      
      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(userResponse.data))
      
    } catch (err: any) {
      console.error('Error completing task:', err)
      setError(err.response?.data?.detail || 'Görev tamamlanırken hata oluştu')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Görev yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Görev bulunamadı</h3>
          <p className="text-gray-600 mb-4">Aradığınız görev mevcut değil.</p>
          <button
            onClick={() => router.push('/tasks')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Görevlere Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={user?.name} />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.push('/tasks')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Görevlere Dön</span>
              </button>
            </div>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                <p className="text-gray-600 text-lg">{task.description}</p>
              </div>
              <div className="flex items-center space-x-2 ml-6">
                <Zap className="w-6 h-6 text-yellow-500" />
                <span className="text-3xl font-bold text-yellow-600">{task.points}</span>
                <span className="text-gray-600">puan</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Görev Detayları</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Açıklama</h3>
                    <p className="text-gray-900">{task.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Tür</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${typeColors[task.type]}`}>
                        {typeLabels[task.type]}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Kategori</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${categoryColors[task.category]}`}>
                        {categoryLabels[task.category]}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Zorluk</h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${difficultyColors[task.difficulty]}`}>
                        {difficultyLabels[task.difficulty]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {task.type === 'daily' && 'Günde bir kez tamamlayın'}
                        {task.type === 'weekly' && 'Haftada bir kez tamamlayın'}
                        {task.type === 'monthly' && 'Ayda bir kez tamamlayın'}
                        {task.type === 'yearly' && 'Yılda bir kez tamamlayın'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {task.difficulty === 'easy' && 'Hızlı ve basit görev'}
                        {task.difficulty === 'medium' && 'Orta düzey çaba gerektirir'}
                        {task.difficulty === 'hard' && 'Önemli çaba gerektirir'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Görevi Tamamla</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Kazanılacak puan:</span>
                    <span className="text-lg font-bold text-green-600">{task.points}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mevcut puanınız:</span>
                    <span className="text-lg font-bold text-blue-600">{user?.points || 0}</span>
                  </div>

                  <div className="border-t pt-4">
                    {isCompleted ? (
                      <div className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                          {task.type === 'daily' && 'Bu görev bugün tamamlandı'}
                          {task.type === 'weekly' && 'Bu görev bu hafta tamamlandı'}
                          {task.type === 'monthly' && 'Bu görev bu ay tamamlandı'}
                          {task.type === 'yearly' && 'Bu görev bu yıl tamamlandı'}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={handleCompleteTask}
                        disabled={completing || !task.isActive}
                        className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                          completing || !task.isActive
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {completing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Tamamlanıyor...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Görevi Tamamla</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {!task.isActive && (
                    <div className="text-center text-sm text-gray-500">
                      Bu görev şu anda aktif değil
                    </div>
                  )}

                  <div className="text-xs text-gray-500 text-center">
                    Bu görevi tamamlayarak açıklanan eylemi gerçekleştirdiğinizi onaylıyorsunuz.
                  </div>
                </div>
              </div>

              {/* User Stats */}
              {user && (
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">İlerlemeniz</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Toplam Puan</span>
                      <span className="font-semibold text-green-600">{user.points}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tamamlanan Görevler</span>
                      <span className="font-semibold text-blue-600">0</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Mevcut Seri</span>
                      <span className="font-semibold text-orange-600">0 gün</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 