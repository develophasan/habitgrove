'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  Shield,
  ArrowLeft,
  Mail,
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
  group_id?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    is_admin: false
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

      const [userResponse, usersResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getAllUsers()
      ])

      const userData = userResponse.data
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      setUsers(usersResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      is_admin: user.is_admin
    })
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    try {
      await adminAPI.updateUser(editingUser.id, editForm)
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u))
      setEditingUser(null)
      setEditForm({ name: '', email: '', is_admin: false })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kullanıcı güncellenirken hata oluştu')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return

    try {
      await adminAPI.deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kullanıcı silinirken hata oluştu')
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kullanıcılar yükleniyor...</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
                  <p className="text-gray-600">Tüm kullanıcıları görüntüle ve yönet</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-posta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puanlar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900">
                              {userItem.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{userItem.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="w-4 h-4 text-yellow-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{userItem.points}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userItem.is_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Kullanıcı
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {new Date(userItem.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditUser(userItem)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {userItem.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Düzenle</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_admin"
                      checked={editForm.is_admin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                      Admin yetkisi
                    </label>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 