'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, adminAPI } from '@/lib/api'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Eye,
  Calendar
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface AdminRequest {
  id: string
  group_id: string
  user_id: string
  reason: string
  full_name: string
  email: string
  profession: string
  bio: string
  status: string
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  admin_notes?: string
}

interface User {
  id: string
  name: string
  email: string
  is_admin: boolean
}

export default function AdminRequestsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    status: '',
    admin_notes: ''
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

      const [userResponse, requestsResponse] = await Promise.all([
        authAPI.getMe(),
        adminAPI.getAdminRequests()
      ])

      const userData = userResponse.data
      if (!userData.is_admin) {
        router.push('/dashboard')
        return
      }

      console.log('DEBUG: requestsResponse.data:', requestsResponse.data)

      setUser(userData)
      setRequests(requestsResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    console.log('DEBUG: selectedRequest:', selectedRequest)
    console.log('DEBUG: selectedRequest.id:', selectedRequest.id)
    console.log('DEBUG: reviewData:', reviewData)

    try {
      await adminAPI.reviewAdminRequest(selectedRequest.id, reviewData)
      setShowReviewModal(false)
      setSelectedRequest(null)
      setReviewData({ status: '', admin_notes: '' })
      fetchData()
    } catch (err: any) {
      console.error('DEBUG: Error in handleReviewRequest:', err)
      setError(err.response?.data?.detail || 'Talep değerlendirilirken hata oluştu')
    }
  }

  const openReviewModal = (request: AdminRequest) => {
    console.log('DEBUG: openReviewModal called with request:', request)
    console.log('DEBUG: request.id:', request.id)
    setSelectedRequest(request)
    setReviewData({ status: '', admin_notes: '' })
    setShowReviewModal(true)
  }

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.profession.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede'
      case 'approved': return 'Onaylandı'
      case 'rejected': return 'Reddedildi'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Admin talepleri yükleniyor...</p>
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
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Talepleri</h1>
                <p className="text-gray-600">Grup admin talep formlarını inceleyin ve değerlendirin</p>
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
                  placeholder="İsim, email veya meslek ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Tümü</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('')
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin Talepleri ({filteredRequests.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Başvuran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meslek
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.full_name}</div>
                          <div className="text-sm text-gray-500">{request.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{request.profession}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusLabel(request.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {new Date(request.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openReviewModal(request)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Detayları Görüntüle"
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

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Admin Talep Detayları (ID: {selectedRequest.id || 'UNDEFINED'})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Başvuran Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Ad Soyad:</span> {selectedRequest.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedRequest.email}</p>
                  <p><span className="font-medium">Meslek:</span> {selectedRequest.profession}</p>
                  <p><span className="font-medium">Durum:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1">{getStatusLabel(selectedRequest.status)}</span>
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Talep Bilgileri</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Grup ID:</span> {selectedRequest.group_id}</p>
                  <p><span className="font-medium">Kullanıcı ID:</span> {selectedRequest.user_id}</p>
                  <p><span className="font-medium">Başvuru Tarihi:</span> {new Date(selectedRequest.created_at).toLocaleDateString('tr-TR')}</p>
                  {selectedRequest.reviewed_at && (
                    <p><span className="font-medium">Değerlendirme Tarihi:</span> {new Date(selectedRequest.reviewed_at).toLocaleDateString('tr-TR')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Talep Nedeni</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.reason}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Biyografi</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.bio}</p>
            </div>

            {selectedRequest.status === 'pending' && (
              <form onSubmit={handleReviewRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Değerlendirme
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="approved"
                        onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">Onayla</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        value="rejected"
                        onChange={(e) => setReviewData({...reviewData, status: e.target.value})}
                        className="mr-2 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm">Reddet</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notları
                  </label>
                  <textarea
                    value={reviewData.admin_notes}
                    onChange={(e) => setReviewData({...reviewData, admin_notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Değerlendirme notlarınızı buraya yazın..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!reviewData.status}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Değerlendir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewModal(false)
                      setSelectedRequest(null)
                      setReviewData({ status: '', admin_notes: '' })
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Kapat
                  </button>
                </div>
              </form>
            )}

            {selectedRequest.status !== 'pending' && (
              <div>
                {selectedRequest.admin_notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Admin Notları</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.admin_notes}</p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setSelectedRequest(null)
                  }}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 