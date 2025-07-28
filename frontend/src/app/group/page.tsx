'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { groupsAPI, authAPI, adminRequestsAPI, tasksAPI } from '@/lib/api'
import { 
  Users, 
  Building2, 
  Plus, 
  CheckCircle, 
  Calendar, 
  TrendingUp,
  Shield,
  Crown,
  FileText,
  UserPlus,
  AlertCircle,
  Mail
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Group {
  id: string
  name: string
  type: 'university' | 'school' | 'municipality' | 'ngo' | 'company'
  members: string[]
  admins: string[]
  total_points: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
  points: number
  group_id?: string
}

interface TaskCompletion {
  id: string
  task_id: string
  user_id: string
  group_id: string
  completed_at: string
  points_earned: number
}

interface AdminRequest {
  id: string
  group_id: string
  user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  admin_notes?: string
}

interface GroupAdmin {
  id: string
  name: string
  email: string
  points: number
  full_name: string
  profession: string
  bio: string
}

export default function GroupPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [userGroup, setUserGroup] = useState<Group | null>(null)
  const [groupCompletions, setGroupCompletions] = useState<TaskCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [showAdminRequestForm, setShowAdminRequestForm] = useState(false)
  const [adminRequestForm, setAdminRequestForm] = useState({
    reason: '',
    full_name: '',
    email: '',
    profession: '',
    bio: ''
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [myAdminRequests, setMyAdminRequests] = useState<AdminRequest[]>([])
  const [groupAdmins, setGroupAdmins] = useState<GroupAdmin[]>([])
  const [groupTasks, setGroupTasks] = useState<any[]>([])
  const [showGroupTaskForm, setShowGroupTaskForm] = useState(false)
  const [showBulkGroupTaskForm, setShowBulkGroupTaskForm] = useState(false)
  const [groupTaskForm, setGroupTaskForm] = useState({
    title: '',
    description: '',
    type: '',
    category: 'group',
    difficulty: '',
    points: 0
  })
  const [creatingGroupTask, setCreatingGroupTask] = useState(false)
  const [uploadedGroupTaskFile, setUploadedGroupTaskFile] = useState<File | null>(null)
  const [groupTaskUploadPreview, setGroupTaskUploadPreview] = useState<any[]>([])
  const [uploadingGroupTasks, setUploadingGroupTasks] = useState(false)

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

      const [userResponse, groupsResponse] = await Promise.all([
        authAPI.getMe(),
        groupsAPI.getGroups()
      ])

      const userData = userResponse.data
      setUser(userData)
      setGroups(groupsResponse.data)

      // Find user's group
      if (userData.group_id) {
        const userGroupData = groupsResponse.data.find((g: Group) => g.id === userData.group_id)
        if (userGroupData) {
          setUserGroup(userGroupData)
          
          // Fetch group completions, admins, and group tasks
          try {
            const [completionsResponse, adminsResponse, groupTasksResponse] = await Promise.all([
              groupsAPI.getGroupCompletions(userGroupData.id),
              groupsAPI.getGroupAdmins(userGroupData.id),
              tasksAPI.getGroupTasks(userGroupData.id)
            ])
            setGroupCompletions(completionsResponse.data)
            setGroupAdmins(adminsResponse.data)
            setGroupTasks(groupTasksResponse.data)
          } catch (err) {
            console.error('Failed to fetch group data:', err)
          }
        }
      }

      // Fetch user's admin requests
      try {
        const requestsResponse = await adminRequestsAPI.getMyAdminRequests()
        setMyAdminRequests(requestsResponse.data)
      } catch (err) {
        console.error('Failed to fetch admin requests:', err)
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      setJoining(true)
      setError('')
      
      await groupsAPI.joinGroup(groupId)
      
      // Refresh data
      await fetchData()
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Gruba katılırken hata oluştu')
    } finally {
      setJoining(false)
    }
  }

  const handleSubmitAdminRequest = async () => {
    if (!userGroup) return

    try {
      setSubmittingRequest(true)
      setError('')
      
      await adminRequestsAPI.createAdminRequest({
        group_id: userGroup.id!,
        reason: adminRequestForm.reason,
        full_name: adminRequestForm.full_name,
        email: adminRequestForm.email,
        profession: adminRequestForm.profession,
        bio: adminRequestForm.bio
      })
      
      setShowAdminRequestForm(false)
      setAdminRequestForm({ 
        reason: '', 
        full_name: '', 
        email: '', 
        profession: '', 
        bio: '' 
      })
      
      // Refresh admin requests
      const requestsResponse = await adminRequestsAPI.getMyAdminRequests()
      setMyAdminRequests(requestsResponse.data)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Talep gönderilirken hata oluştu')
    } finally {
      setSubmittingRequest(false)
    }
  }

  const groupStats = useMemo(() => {
    if (!userGroup) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Bugünün başlangıcı
    
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 gün önce
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1) // Bu ayın başlangıcı

    const todayCompletions = groupCompletions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate >= today
    })

    const weekCompletions = groupCompletions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate >= thisWeek
    })

    const monthCompletions = groupCompletions.filter(completion => {
      const completionDate = new Date(completion.completed_at)
      return completionDate >= thisMonth
    })

    const stats = {
      today: todayCompletions.length,
      thisWeek: weekCompletions.length,
      thisMonth: monthCompletions.length,
      total: groupCompletions.length
    }

    return stats
  }, [userGroup, groupCompletions])

  const isUserAdmin = () => {
    return userGroup?.admins?.includes(user?.id || '') || false
  }

  const hasPendingRequest = () => {
    return myAdminRequests.some(req => 
      req.group_id === userGroup?.id && req.status === 'pending'
    )
  }

  const handleCreateGroupTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userGroup) return

    try {
      setCreatingGroupTask(true)
      setError('')
      
      await tasksAPI.createGroupTask(userGroup.id, groupTaskForm)
      
      setShowGroupTaskForm(false)
      setGroupTaskForm({
        title: '',
        description: '',
        type: '',
        category: 'group',
        difficulty: '',
        points: 0
      })
      
      // Refresh group tasks
      const groupTasksResponse = await tasksAPI.getGroupTasks(userGroup.id)
      setGroupTasks(groupTasksResponse.data)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup görevi oluşturulurken hata oluştu')
    } finally {
      setCreatingGroupTask(false)
    }
  }

  const handleGroupTaskFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      setError('Lütfen sadece JSON dosyası yükleyin')
      return
    }

    setUploadedGroupTaskFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string)
        if (content.tasks && Array.isArray(content.tasks)) {
          setGroupTaskUploadPreview(content.tasks)
        } else {
          setError('JSON dosyası geçerli bir format içermiyor. "tasks" dizisi bulunamadı.')
          setGroupTaskUploadPreview([])
        }
      } catch (err) {
        setError('JSON dosyası okunamadı. Lütfen geçerli bir JSON dosyası yükleyin.')
        setGroupTaskUploadPreview([])
      }
    }
    reader.readAsText(file)
  }

  const handleBulkGroupTaskUpload = async () => {
    if (!uploadedGroupTaskFile || groupTaskUploadPreview.length === 0 || !userGroup) return

    setUploadingGroupTasks(true)
    setError('')

    try {
      await tasksAPI.createBulkGroupTasks(userGroup.id, { tasks: groupTaskUploadPreview })
      
      setShowBulkGroupTaskForm(false)
      setUploadedGroupTaskFile(null)
      setGroupTaskUploadPreview([])
      
      // Refresh group tasks
      const groupTasksResponse = await tasksAPI.getGroupTasks(userGroup.id)
      setGroupTasks(groupTasksResponse.data)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Grup görevleri yüklenirken hata oluştu')
    } finally {
      setUploadingGroupTasks(false)
    }
  }

  const downloadGroupTaskTemplate = () => {
    const template = {
      tasks: [
        {
          title: "Grup Görevi Örneği",
          description: "Bu bir grup görevi örneğidir",
          type: "daily",
          category: "group",
          difficulty: "medium",
          points: 50
        }
      ]
    }
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grup_gorevleri_sablonu.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const groupTypeLabels = {
    university: 'Üniversite',
    school: 'Okul',
    municipality: 'Belediye',
    ngo: 'STK',
    company: 'Şirket'
  }

  const groupTypeColors = {
    university: 'bg-blue-100 text-blue-800',
    school: 'bg-green-100 text-green-800',
    municipality: 'bg-purple-100 text-purple-800',
    ngo: 'bg-orange-100 text-orange-800',
    company: 'bg-gray-100 text-gray-800'
  }

  const groupTypeIcons = {
    university: Building2,
    school: Building2,
    municipality: Building2,
    ngo: Building2,
    company: Building2
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Grup verileri yükleniyor...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Gruplar</h1>
                <p className="text-gray-600">Gruplara katılın ve toplu etkiyi takip edin</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* User's Current Group */}
          {userGroup ? (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{userGroup.name}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${groupTypeColors[userGroup.type]}`}>
                          {groupTypeLabels[userGroup.type]}
                        </span>
                        <span className="text-sm text-gray-600">
                          {userGroup.members.length} üye
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Information */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                      Grup Yöneticileri
                    </h3>
                    
                    {isUserAdmin() && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowGroupTaskForm(true)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tek Görev Ekle
                        </button>
                        <button
                          onClick={() => setShowBulkGroupTaskForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Toplu Yükleme
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {groupAdmins && groupAdmins.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupAdmins.map((admin) => (
                        <div key={admin.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Crown className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {admin.full_name || admin.name}
                                </h4>
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                  {admin.points} puan
                                </span>
                              </div>
                              
                              {admin.profession && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="font-medium">Meslek:</span> {admin.profession}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <a
                                  href={`mailto:${admin.email}`}
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  {admin.email}
                                </a>
                              </div>
                              
                              {admin.bio && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Hakkında:</p>
                                  <p className="text-xs text-gray-600 line-clamp-3">
                                    {admin.bio}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz Yönetici Tanımlanmamış</h4>
                      <p className="text-gray-600 mb-4">Bu grubun henüz bir yöneticisi bulunmuyor.</p>
                      
                      {!isUserAdmin() && !hasPendingRequest() && (
                        <button
                          onClick={() => setShowAdminRequestForm(true)}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center mx-auto"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Yöneticilik Talep Et
                        </button>
                      )}
                      
                      {hasPendingRequest() && (
                        <div className="flex items-center justify-center space-x-2 text-yellow-600">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm font-medium">Yöneticilik talebiniz bekliyor</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Group Tasks */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-5 h-5 text-blue-500 mr-2" />
                    Grup Görevleri
                  </h3>
                  
                  {groupTasks && groupTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupTasks.map((task) => (
                        <div key={task.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {task.title}
                                </h4>
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                  {task.points} puan
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="capitalize">{task.type}</span>
                                <span className="capitalize">{task.difficulty}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz Grup Görevi Yok</h4>
                      <p className="text-gray-600">
                        {isUserAdmin() 
                          ? 'Grup yöneticisi olarak grup görevleri ekleyebilirsiniz.'
                          : 'Grup yöneticisi henüz görev eklememiş.'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Group Stats */}
                {groupStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Bugün</p>
                          <p className="text-lg font-semibold text-gray-900">{groupStats.today}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-green-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Bu Hafta</p>
                          <p className="text-lg font-semibold text-gray-900">{groupStats.thisWeek}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-purple-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Bu Ay</p>
                          <p className="text-lg font-semibold text-gray-900">{groupStats.thisMonth}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                        <div>
                          <p className="text-sm text-gray-600">Toplam</p>
                          <p className="text-lg font-semibold text-gray-900">{groupStats.total}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mevcut Grup
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz bir grupta değilsiniz</h3>
                  <p className="text-gray-600 mb-6">Toplu etkiyi takip etmeye başlamak için bir gruba katılın</p>
                </div>
              </div>
            </div>
          )}

          {/* Available Groups */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Mevcut Gruplar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const isUserInGroup = user?.group_id === group.id
                const IconComponent = groupTypeIcons[group.type]
                
                return (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${groupTypeColors[group.type]}`}>
                            {groupTypeLabels[group.type]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Üyeler:</span>
                        <span className="font-medium">{group.members.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Yöneticiler:</span>
                        <span className="font-medium">{group.admins?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Toplam Puan:</span>
                        <span className="font-medium text-green-600">{group.total_points}</span>
                      </div>
                    </div>

                    {isUserInGroup ? (
                      <div className="text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mevcut Grup
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joining}
                        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                          joining
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {joining ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Katılıyor...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Gruba Katıl</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {groups.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mevcut grup yok</h3>
                <p className="text-gray-600">Yeni gruplar için daha sonra tekrar kontrol edin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Request Modal */}
      {showAdminRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yöneticilik Talebi</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={adminRequestForm.full_name}
                  onChange={(e) => setAdminRequestForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Adınız ve soyadınız"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={adminRequestForm.email}
                  onChange={(e) => setAdminRequestForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="E-posta adresiniz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meslek/Görev *
                </label>
                <input
                  type="text"
                  value={adminRequestForm.profession}
                  onChange={(e) => setAdminRequestForm(prev => ({ ...prev, profession: e.target.value }))}
                  placeholder="Mesleğiniz veya göreviniz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kısa Özgeçmiş * (En az 20 karakter)
                </label>
                <textarea
                  value={adminRequestForm.bio}
                  onChange={(e) => setAdminRequestForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Buraya daha önce çalıştığınız STK'lar, sosyal sorumluluk projeleri, çevre etkinlikleri ve diğer gönüllü çalışmalarınızı yazınız. Neden yönetici olmak istediğinizi ve gruba nasıl katkı sağlayacağınızı açıklayın."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(adminRequestForm.bio || '').length}/1000 karakter (En az 20 karakter gerekli)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Talep Nedeni *
                </label>
                <textarea
                  value={adminRequestForm.reason}
                  onChange={(e) => setAdminRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Neden yönetici olmak istediğinizi kısaca açıklayın..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSubmitAdminRequest}
                disabled={submittingRequest || 
                  !adminRequestForm.reason.trim() || 
                  adminRequestForm.reason.trim().length < 10 ||
                  !adminRequestForm.full_name.trim() || 
                  adminRequestForm.full_name.trim().length < 2 ||
                  !adminRequestForm.email.trim() || 
                  !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(adminRequestForm.email.trim()) ||
                  !adminRequestForm.profession.trim() || 
                  adminRequestForm.profession.trim().length < 2 ||
                  !adminRequestForm.bio.trim() || 
                  adminRequestForm.bio.trim().length < 20}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  submittingRequest || 
                  !adminRequestForm.reason.trim() || 
                  adminRequestForm.reason.trim().length < 10 ||
                  !adminRequestForm.full_name.trim() || 
                  adminRequestForm.full_name.trim().length < 2 ||
                  !adminRequestForm.email.trim() || 
                  !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(adminRequestForm.email.trim()) ||
                  !adminRequestForm.profession.trim() || 
                  adminRequestForm.profession.trim().length < 2 ||
                  !adminRequestForm.bio.trim() || 
                  adminRequestForm.bio.trim().length < 20
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                }`}
              >
                {submittingRequest ? 'Gönderiliyor...' : 'Talebi Gönder'}
              </button>
              <button
                onClick={() => setShowAdminRequestForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Group Task Modal */}
      {showBulkGroupTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Toplu Grup Görevi Yükleme</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">JSON Formatı</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="mb-2">JSON dosyanız şu formatta olmalıdır:</p>
                <pre className="bg-white p-3 rounded border overflow-x-auto">
{`{
  "tasks": [
    {
      "title": "Grup görevi başlığı",
      "description": "Grup görevi açıklaması",
      "type": "daily|weekly|monthly|one_time",
      "category": "group",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}`}
                </pre>
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Not:</strong> Kategori otomatik olarak "group" olarak ayarlanacaktır.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Dosya Yükleme</h3>
                <button
                  onClick={downloadGroupTaskTemplate}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Şablon İndir
                </button>
              </div>
              
              <input
                type="file"
                accept=".json"
                onChange={handleGroupTaskFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {groupTaskUploadPreview.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Yüklenecek Görevler ({groupTaskUploadPreview.length})
                </h3>
                
                <div className="max-h-64 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Zorluk</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Puan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupTaskUploadPreview.map((task, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">{task.title}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 capitalize">{task.type}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 capitalize">{task.difficulty}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{task.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={handleBulkGroupTaskUpload}
                disabled={uploadingGroupTasks || groupTaskUploadPreview.length === 0}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  uploadingGroupTasks || groupTaskUploadPreview.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploadingGroupTasks ? 'Yükleniyor...' : `Görevleri Yükle (${groupTaskUploadPreview.length})`}
              </button>
              <button
                onClick={() => {
                  setShowBulkGroupTaskForm(false)
                  setUploadedGroupTaskFile(null)
                  setGroupTaskUploadPreview([])
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Task Modal */}
      {showGroupTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grup Görevi Ekle</h3>
            
            <form onSubmit={handleCreateGroupTask}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Görev Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={groupTaskForm.title}
                    onChange={(e) => setGroupTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Görev başlığı"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama *
                  </label>
                  <textarea
                    required
                    value={groupTaskForm.description}
                    onChange={(e) => setGroupTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Görev açıklaması"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tür *
                  </label>
                  <select
                    required
                    value={groupTaskForm.type}
                    onChange={(e) => setGroupTaskForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Tür seçin</option>
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="one_time">Tek Seferlik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zorluk *
                  </label>
                  <select
                    required
                    value={groupTaskForm.difficulty}
                    onChange={(e) => setGroupTaskForm(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Zorluk seçin</option>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Puan *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="2000"
                    value={groupTaskForm.points}
                    onChange={(e) => setGroupTaskForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                    placeholder="Puan"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={creatingGroupTask || !groupTaskForm.title.trim() || !groupTaskForm.description.trim() || !groupTaskForm.type || !groupTaskForm.difficulty || groupTaskForm.points <= 0}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    creatingGroupTask || !groupTaskForm.title.trim() || !groupTaskForm.description.trim() || !groupTaskForm.type || !groupTaskForm.difficulty || groupTaskForm.points <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {creatingGroupTask ? 'Oluşturuluyor...' : 'Görevi Oluştur'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGroupTaskForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 