'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  Building2, 
  Users, 
  Crown,
  Search,
  Edit,
  Eye
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Group {
  id: string
  name: string
  type: string
  members: string[]
  admins: string[]
  total_points: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

export default function AdminGroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([])

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

      const [userResponse, groupsResponse, usersResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getAllGroups(),
        adminAPI.getAllUsers()
      ])

      const userData = userResponse.data
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      setUser(userData)
      setGroups(groupsResponse.data)
      setAllUsers(usersResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateGroupAdmins = async () => {
    if (!selectedGroup) return

    try {
      await adminAPI.updateGroupAdmins(selectedGroup.id, selectedAdmins)
      setShowAdminModal(false)
      setSelectedGroup(null)
      setSelectedAdmins([])
      fetchData()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup adminleri güncellenirken hata oluştu')
    }
  }

  const openAdminModal = (group: Group) => {
    setSelectedGroup(group)
    setSelectedAdmins(group.admins)
    setShowAdminModal(true)
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || group.type === typeFilter
    return matchesSearch && matchesType
  })

  const groupTypes = ['university', 'school', 'municipality', 'ngo', 'company']

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case 'university': return 'Üniversite'
      case 'school': return 'Okul'
      case 'municipality': return 'Belediye'
      case 'ngo': return 'STK'
      case 'company': return 'Şirket'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Grup yönetimi yükleniyor...</p>
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
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Grup Yönetimi</h1>
                <p className="text-gray-600">Sistemdeki tüm grupları ve adminlerini yönetin</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
                <input
                  type="text"
                  placeholder="Grup ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  {groupTypes.map(type => (
                    <option key={type} value={type}>
                      {getGroupTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setTypeFilter('')
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </div>

          {/* Groups List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Gruplar ({filteredGroups.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tür
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Üyeler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adminler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Toplam Puan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGroups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{group.name}</div>
                          <div className="text-sm text-gray-500">
                            Oluşturulma: {new Date(group.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          group.type === 'university' ? 'bg-blue-100 text-blue-800' :
                          group.type === 'school' ? 'bg-green-100 text-green-800' :
                          group.type === 'municipality' ? 'bg-purple-100 text-purple-800' :
                          group.type === 'ngo' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getGroupTypeLabel(group.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{group.members.length}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Crown className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm text-gray-900">{group.admins.length}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{group.total_points}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openAdminModal(group)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Adminleri Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/group/${group.id}`)}
                            className="text-green-600 hover:text-green-900"
                            title="Grubu Görüntüle"
                          >
                            <Eye className="w-4 h-4" />
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

      {/* Admin Management Modal */}
      {showAdminModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedGroup.name} - Admin Yönetimi
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grup Adminleri
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {allUsers.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedAdmins.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAdmins([...selectedAdmins, user.id])
                        } else {
                          setSelectedAdmins(selectedAdmins.filter(id => id !== user.id))
                        }
                      }}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-500">({user.email})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpdateGroupAdmins}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                Güncelle
              </button>
              <button
                onClick={() => {
                  setShowAdminModal(false)
                  setSelectedGroup(null)
                  setSelectedAdmins([])
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