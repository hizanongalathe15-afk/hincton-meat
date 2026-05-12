import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BuyerDashboard = () => {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/shop', { replace: true })
  }, [navigate])

  return null
}

export default BuyerDashboard
