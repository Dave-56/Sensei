import { useState, useEffect } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { PixelArtBackground } from '@/components/auth/PixelArtBackground'
import { useLocation } from 'wouter'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [, setLocation] = useLocation()

  // Check if we should show signup mode (e.g., from URL params or redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('mode') === 'signup') {
      setIsLogin(false)
    }
  }, [])

  const handleAuthSuccess = () => {
    // Redirect to dashboard after successful authentication
    setLocation('/')
  }

  const handleSwitchToSignup = () => {
    setIsLogin(false)
  }

  const handleSwitchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Pixel Art Background */}
      <PixelArtBackground />
      
      {/* Blurred overlay for depth */}
      <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm"></div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm 
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={handleSwitchToSignup}
            />
          ) : (
            <SignupForm 
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
        </div>
      </div>
      
      {/* Help Icon */}
      <div className="absolute bottom-4 right-4 z-20">
        <button className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <span className="text-white dark:text-gray-900 text-sm font-bold">?</span>
        </button>
      </div>
    </div>
  )
}
