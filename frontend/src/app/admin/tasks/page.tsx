'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Target,
  Calendar,
  Star,
  Users,
  RefreshCw
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Task {
  id: string
  title: string
  description: string
  type: string
  category: string
  difficulty: string
  points: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

export default function AdminTasksPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [migrating, setMigrating] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    difficulty: '',
    points: 0
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

      const [userResponse, tasksResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getAllTasks()
      ])

      const userData = userResponse.data
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      setTasks(tasksResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await adminAPI.createTask(formData)
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        type: '',
        category: '',
        difficulty: '',
        points: 0
      })
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görev oluşturulurken hata oluştu')
    }
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    try {
      await adminAPI.updateTask(editingTask.id, formData)
      setEditingTask(null)
      setFormData({
        title: '',
        description: '',
        type: '',
        category: '',
        difficulty: '',
        points: 0
      })
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görev güncellenirken hata oluştu')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) return

    try {
      await adminAPI.deleteTask(taskId)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görev silinirken hata oluştu')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      setError('Lütfen sadece JSON dosyası yükleyin')
      return
    }

    setUploadedFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string)
        if (content.tasks && Array.isArray(content.tasks)) {
          setUploadPreview(content.tasks)
        } else {
          setError('JSON dosyası geçerli bir format içermiyor. "tasks" dizisi bulunamadı.')
          setUploadPreview([])
        }
      } catch (err) {
        setError('JSON dosyası okunamadı. Lütfen geçerli bir JSON dosyası yükleyin.')
        setUploadPreview([])
      }
    }
    reader.readAsText(file)
  }

  const handleBulkUpload = async () => {
    if (!uploadedFile || uploadPreview.length === 0) return

    setUploading(true)
    setError('')

    try {
      // Toplu yükleme API'sini kullan
      await adminAPI.createBulkTasks({ tasks: uploadPreview })
      
      setShowBulkUploadModal(false)
      setUploadedFile(null)
      setUploadPreview([])
      fetchData()
      setSuccess('Görevler başarıyla yüklendi!')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görevler yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const template = {
      tasks: [
        {
          title: "Günde 8 bardak su iç",
          description: "Sağlıklı kalmak için günde en az 8 bardak su içmeyi hedefle",
          type: "daily",
          category: "health",
          difficulty: "easy",
          points: 5
        },
        {
          title: "Haftalık kitap okuma",
          description: "Her hafta en az 50 sayfa kitap oku",
          type: "weekly",
          category: "education",
          difficulty: "medium",
          points: 15
        },
        {
          title: "Aylık çevre temizliği",
          description: "Her ay bir park veya sahilde çevre temizliği yap",
          type: "monthly",
          category: "environment",
          difficulty: "hard",
          points: 25
        }
      ]
    }

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gorev-sablonu.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMigration = async () => {
    if (!confirm('Eski kategori formatındaki görevleri yeni formata dönüştürmek istediğinizden emin misiniz?')) return

    setMigrating(true)
    setError('')

    try {
      const response = await adminAPI.migrateTaskCategories()
      setSuccess(response.data.message)
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Migration sırasında hata oluştu')
    } finally {
      setMigrating(false)
    }
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      category: task.category,
      difficulty: task.difficulty,
      points: task.points
    })
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || task.type === typeFilter
    const matchesCategory = !categoryFilter || task.category === categoryFilter
    return matchesSearch && matchesType && matchesCategory
  })

  const taskTypes = ['daily', 'weekly', 'monthly', 'one_time']
  const taskCategories = ['health', 'education', 'work', 'social', 'environment', 'other']
  const difficultyLevels = ['easy', 'medium', 'hard']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Görev yönetimi yükleniyor...</p>
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
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Görev Yönetimi</h1>
                  <p className="text-gray-600">Sistemdeki tüm görevleri yönetin</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yeni Görev</span>
                </button>
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Toplu Yükleme</span>
                </button>
                <button
                  onClick={handleMigration}
                  disabled={migrating}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {migrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dönüştürülüyor...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Kategorileri Dönüştür</span>
                    </>
                  )}
                </button>
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

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Görev ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  {taskTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'daily' ? 'Günlük' : 
                       type === 'weekly' ? 'Haftalık' : 
                       type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  {taskCategories.map(category => (
                    <option key={category} value={category}>
                      {category === 'health' ? 'Sağlık' :
                       category === 'education' ? 'Eğitim' :
                       category === 'work' ? 'İş' :
                       category === 'social' ? 'Sosyal' :
                       category === 'environment' ? 'Çevre' : 'Diğer'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('')
                    setCategoryFilter('')
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Görevler ({filteredTasks.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Görev
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tür
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zorluk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.type === 'daily' ? 'bg-blue-100 text-blue-800' :
                          task.type === 'weekly' ? 'bg-green-100 text-green-800' :
                          task.type === 'monthly' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.type === 'daily' ? 'Günlük' : 
                           task.type === 'weekly' ? 'Haftalık' : 
                           task.type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {task.category === 'health' ? 'Sağlık' :
                           task.category === 'education' ? 'Eğitim' :
                           task.category === 'work' ? 'İş' :
                           task.category === 'social' ? 'Sosyal' :
                           task.category === 'environment' ? 'Çevre' : 'Diğer'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          task.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {task.difficulty === 'easy' ? 'Kolay' :
                           task.difficulty === 'medium' ? 'Orta' : 'Zor'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{task.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Yeni Görev Oluştur</h2>
            <form onSubmit={handleCreateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {taskTypes.map(type => (
                        <option key={type} value={type}>
                          {type === 'daily' ? 'Günlük' : 
                           type === 'weekly' ? 'Haftalık' : 
                           type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {taskCategories.map(category => (
                        <option key={category} value={category}>
                          {category === 'health' ? 'Sağlık' :
                           category === 'education' ? 'Eğitim' :
                           category === 'work' ? 'İş' :
                           category === 'social' ? 'Sosyal' :
                           category === 'environment' ? 'Çevre' : 'Diğer'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
                    <select
                      required
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {difficultyLevels.map(level => (
                        <option key={level} value={level}>
                          {level === 'easy' ? 'Kolay' :
                           level === 'medium' ? 'Orta' : 'Zor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Görevi Düzenle</h2>
            <form onSubmit={handleUpdateTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {taskTypes.map(type => (
                        <option key={type} value={type}>
                          {type === 'daily' ? 'Günlük' : 
                           type === 'weekly' ? 'Haftalık' : 
                           type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {taskCategories.map(category => (
                        <option key={category} value={category}>
                          {category === 'health' ? 'Sağlık' :
                           category === 'education' ? 'Eğitim' :
                           category === 'work' ? 'İş' :
                           category === 'social' ? 'Sosyal' :
                           category === 'environment' ? 'Çevre' : 'Diğer'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk</label>
                    <select
                      required
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seçiniz</option>
                      {difficultyLevels.map(level => (
                        <option key={level} value={level}>
                          {level === 'easy' ? 'Kolay' :
                           level === 'medium' ? 'Orta' : 'Zor'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Toplu Görev Yükleme</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">JSON Formatı</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="mb-2">JSON dosyanız şu formatta olmalıdır:</p>
                <pre className="bg-white p-3 rounded border overflow-x-auto">
{`{
  "tasks": [
    {
      "title": "Görev başlığı",
      "description": "Görev açıklaması",
      "type": "daily|weekly|monthly|one_time",
      "category": "health|education|work|social|environment|other",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}`}
                </pre>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Dosya Yükleme</h3>
                <button
                  onClick={downloadTemplate}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Şablon İndir
                </button>
              </div>
              
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {uploadPreview.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Yüklenecek Görevler ({uploadPreview.length})
                </h3>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zorluk</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Puan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploadPreview.map((task, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">{task.title}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {task.type === 'daily' ? 'Günlük' : 
                             task.type === 'weekly' ? 'Haftalık' : 
                             task.type === 'monthly' ? 'Aylık' : 'Tek Seferlik'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {task.category === 'health' ? 'Sağlık' :
                             task.category === 'education' ? 'Eğitim' :
                             task.category === 'work' ? 'İş' :
                             task.category === 'social' ? 'Sosyal' :
                             task.category === 'environment' ? 'Çevre' : 'Diğer'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {task.difficulty === 'easy' ? 'Kolay' :
                             task.difficulty === 'medium' ? 'Orta' : 'Zor'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{task.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleBulkUpload}
                disabled={!uploadedFile || uploadPreview.length === 0 || uploading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Görevleri Yükle ({uploadPreview.length})</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowBulkUploadModal(false)
                  setUploadedFile(null)
                  setUploadPreview([])
                  setError('')
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 