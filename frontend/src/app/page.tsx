'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Users, Target, TrendingUp } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const features = [
    {
      icon: Leaf,
      title: 'Track Sustainable Habits',
      description: 'Monitor your daily, weekly, and monthly environmental actions'
    },
    {
      icon: Users,
      title: 'Join Groups',
      description: 'Connect with universities, municipalities, NGOs, and companies'
    },
    {
      icon: Target,
      title: 'Earn Points',
      description: 'Gain points for completing sustainability tasks'
    },
    {
      icon: TrendingUp,
      title: 'Collective Impact',
      description: 'See the combined environmental impact of your group'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              HabitGrove
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Track your sustainable habits and join groups to make a collective impact on the environment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => router.push('/register')}
                    className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-green-600 transition-colors"
                  >
                    Register
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose HabitGrove?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of people making a difference through sustainable habits
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Your Sustainability Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join HabitGrove today and start tracking your environmental impact
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => router.push('/register')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Get Started Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
