'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { tasksAPI } from '@/lib/api'
import { ArrowLeft, Save, Target } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default function CreateTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    category: 'recycling',
    difficulty: 'easy',
    points: 10,
    isActive: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await tasksAPI.createTask(formData)
      
      setSuccess('Görev başarıyla oluşturuldu!')
      setTimeout(() => {
        router.push('/tasks')
      }, 1500)
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Görev oluşturulurken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
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
            
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Yeni Görev Oluştur</h1>
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

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Görev Başlığı *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Örn: Su tasarrufu yap"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Görevin detaylı açıklaması..."
                />
              </div>

              {/* Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Tip *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="yearly">Yıllık</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="recycling">Geri Dönüşüm</option>
                    <option value="water">Su</option>
                    <option value="energy">Enerji</option>
                    <option value="transport">Ulaşım</option>
                    <option value="consumption">Tüketim</option>
                  </select>
                </div>
              </div>

              {/* Difficulty and Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                    Zorluk *
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
                    Puan *
                  </label>
                  <input
                    type="number"
                    id="points"
                    name="points"
                    value={formData.points}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Görev aktif olsun
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/tasks')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Oluşturuluyor...' : 'Görev Oluştur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 