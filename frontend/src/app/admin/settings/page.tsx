'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { 
  Settings, 
  Shield, 
  Database, 
  Bell,
  Save,
  RefreshCw
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    systemName: 'HabitGrove',
    maxUsersPerGroup: 100,
    maxTasksPerUser: 50,
    pointsPerTask: 10,
    enableNotifications: true,
    enableEmailNotifications: true,
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 6
  })

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

      const userResponse = await authAPI.getMe()
      const userData = userResponse.data
      
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      
      // In a real application, you would fetch settings from the backend
      // For now, we'll use default values
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // In a real application, you would send settings to the backend
      // await adminAPI.updateSettings(settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Ayarlar başarıyla kaydedildi!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ayarlar kaydedilirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      setSettings({
        systemName: 'HabitGrove',
        maxUsersPerGroup: 100,
        maxTasksPerUser: 50,
        pointsPerTask: 10,
        enableNotifications: true,
        enableEmailNotifications: true,
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: false,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        passwordMinLength: 6
      })
      setSuccess('Ayarlar varsayılan değerlere sıfırlandı!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Sistem ayarları yükleniyor...</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
                <p className="text-gray-600">Sistem konfigürasyonu ve genel ayarlar</p>
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

          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* General Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-500" />
                Genel Ayarlar
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sistem Adı
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görev Başına Puan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.pointsPerTask}
                    onChange={(e) => setSettings({...settings, pointsPerTask: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grup Başına Maksimum Kullanıcı
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.maxUsersPerGroup}
                    onChange={(e) => setSettings({...settings, maxUsersPerGroup: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kullanıcı Başına Maksimum Görev
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.maxTasksPerUser}
                    onChange={(e) => setSettings({...settings, maxTasksPerUser: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-500" />
                Güvenlik Ayarları
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Oturum Zaman Aşımı (Saat)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maksimum Giriş Denemesi
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Şifre Uzunluğu
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="requireEmailVerification" className="ml-2 text-sm text-gray-700">
                    Email Doğrulaması Gerekli
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                Bildirim Ayarları
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={(e) => setSettings({...settings, enableNotifications: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="enableNotifications" className="ml-2 text-sm text-gray-700">
                    Sistem Bildirimlerini Etkinleştir
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableEmailNotifications"
                    checked={settings.enableEmailNotifications}
                    onChange={(e) => setSettings({...settings, enableEmailNotifications: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="enableEmailNotifications" className="ml-2 text-sm text-gray-700">
                    Email Bildirimlerini Etkinleştir
                  </label>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Database className="w-5 h-5 mr-2 text-purple-500" />
                Sistem Ayarları
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
                    Bakım Modu (Sadece adminler erişebilir)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowNewRegistrations"
                    checked={settings.allowNewRegistrations}
                    onChange={(e) => setSettings({...settings, allowNewRegistrations: e.target.checked})}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="allowNewRegistrations" className="ml-2 text-sm text-gray-700">
                    Yeni Kayıtlara İzin Ver
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Ayarları Kaydet</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  Varsayılanlara Sıfırla
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 