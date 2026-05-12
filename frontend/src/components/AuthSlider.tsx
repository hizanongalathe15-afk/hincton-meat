import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

type AuthPage = 0 | 1 | 2 | 3 // 0: login, 1: signup, 2: forgot, 3: reset

const AuthSlider: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState<AuthPage>(0)

  // Map paths to page indices
  const pathToPage: Record<string, AuthPage> = {
    '/login': 0,
    '/register': 1,
    '/forgot-password': 2,
    '/reset-password': 3,
  }

  useEffect(() => {
    const page = pathToPage[location.pathname] ?? 0
    setCurrentPage(page)
  }, [location.pathname])

  const handleNavigate = (page: AuthPage) => {
    setCurrentPage(page)
    // Update URL without full navigation
    const pageToPath = ['/login', '/register', '/forgot-password', '/reset-password']
    navigate(pageToPath[page], { replace: true })
  }

  return (
    <div className="auth-slider-container overflow-hidden w-full h-full">
      <div
        className="auth-slider flex w-full h-full"
        style={{
          transform: `translateX(-${currentPage * 100}%)`,
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <div className="auth-page flex-shrink-0 w-full h-full">
          <LoginPage onNavigate={handleNavigate} />
        </div>
        <div className="auth-page flex-shrink-0 w-full h-full">
          <RegisterPage onNavigate={handleNavigate} />
        </div>
        <div className="auth-page flex-shrink-0 w-full h-full">
          <ForgotPasswordPage onNavigate={handleNavigate} />
        </div>
        <div className="auth-page flex-shrink-0 w-full h-full">
          <ResetPasswordPage onNavigate={handleNavigate} />
        </div>
      </div>
    </div>
  )
}

export default AuthSlider