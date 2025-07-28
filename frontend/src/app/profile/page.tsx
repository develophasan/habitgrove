'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usersAPI, authAPI, tasksAPI } from '@/lib/api'
import { User, Edit, Save, X } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface UserData {
  id: string
  _id?: string
  name: string
  email: string
  points: number
  created_at: string
  group_id?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completedTasks, setCompletedTasks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchUserData()
  }, [router])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getMe()
      const userData = response.data
      setUser(userData)
      setFormData({
        name: userData.name,
        email: userData.email
      })

      // Fetch completed tasks
      if (userData && (userData.id || userData._id)) {
        const userId = userData.id || userData._id
        try {
          const completionsResponse = await tasksAPI.getUserCompletions(userId)
          setCompletedTasks(completionsResponse.data)
        } catch (err) {
          console.error('Failed to fetch completions:', err)
          setCompletedTasks([])
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Profil yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!user) {
        setError('Kullanıcı verisi mevcut değil')
        return
      }
      
      // Check if user has id or _id field
      const userId = user.id || user._id
      if (!userId) {
        setError('Kullanıcı ID\'si mevcut değil')
        return
      }
      
      await usersAPI.updateUser(userId, formData)
      setUser(prev => prev ? { ...prev, ...formData } : null)
      setIsEditing(false)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Profil güncellenirken hata oluştu')
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      })
    }
    setIsEditing(false)
    setError('')
  }

  const getCompletedTasksCount = () => {
    return completedTasks.length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Profil yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Profil yüklenemedi</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={user.name} />

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
                <p className="text-gray-600">Hesap ayarlarınızı yönetin</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Kişisel Bilgiler</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Edit className="w-4 h-4" />
                  <span>Düzenle</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                    <span>Kaydet</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                    <span>İptal</span>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kazanılan Puanlar
                </label>
                <p className="text-2xl font-bold text-green-600">{user.points}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Üyelik Tarihi
                </label>
                <p className="text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Toplam Puan</h3>
              <p className="text-3xl font-bold text-green-600">{user.points}</p>
              <p className="text-sm text-gray-600">Hayat boyu kazanılan puanlar</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tamamlanan Görevler</h3>
              <p className="text-3xl font-bold text-blue-600">{getCompletedTasksCount()}</p>
              <p className="text-sm text-gray-600">Toplam tamamlanan görev</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mevcut Seri</h3>
              <p className="text-3xl font-bold text-orange-600">0</p>
              <p className="text-sm text-gray-600">Ardışık gün</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 