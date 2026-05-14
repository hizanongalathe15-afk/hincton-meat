import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import SubscriptionBox from './SubscriptionBox'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import api from '../services/api'

const BuyerSubscription = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const response = await api.get('/subscriptions/mine')
        const data = response.data
          if (data.subscriptions && data.subscriptions.length > 0) {
            const activeSubscription = data.subscriptions.find((sub: any) => 
              sub.status === 'ACTIVE' || sub.status === 'active'
            )
            if (activeSubscription) {
              setCurrentSubscription({
                id: activeSubscription.planId,
                name: activeSubscription.subscriptionPlan?.name || activeSubscription.plan || 'Subscription Plan',
                status: activeSubscription.status,
                nextDelivery: activeSubscription.deliveries?.[0]?.scheduledDate,
                deliveries: activeSubscription.deliveries?.length || 0,
                totalSaved: 0
              })
            }
          }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSubscription()
    } else {
      navigate('/login')
    }
  }, [user, navigate])

  const handleSubscribe = async (selectedPlanId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      // Real subscription creation
      await api.post('/subscriptions', {
          planId: selectedPlanId,
          userId: user.id,
          startDate: new Date().toISOString()
      })

        toast.success('Subscription created successfully! Welcome to Premium Meat Club!')
        
        // Refresh subscription data
        const fetchSubscription = async () => {
          const subResponse = await api.get('/subscriptions/mine')
          const subData = subResponse.data
            if (subData.subscriptions && subData.subscriptions.length > 0) {
              const activeSubscription = subData.subscriptions.find((sub: any) => 
                sub.status === 'ACTIVE' || sub.status === 'active'
              )
              if (activeSubscription) {
                setCurrentSubscription({
                  id: activeSubscription.planId,
                  name: activeSubscription.subscriptionPlan?.name || activeSubscription.plan || 'Subscription Plan',
                  status: activeSubscription.status,
                  nextDelivery: activeSubscription.deliveries?.[0]?.scheduledDate,
                  deliveries: activeSubscription.deliveries?.length || 0,
                  totalSaved: 0
                })
              }
            }
        }
        await fetchSubscription()
    } catch (error) {
      console.error('Subscription failed:', error)
      toast.error((error as any)?.message || 'Failed to create subscription. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <SubscriptionBox 
      onSubscribe={handleSubscribe}
      currentPlan={currentSubscription?.id || undefined}
    />
  )
}

export default BuyerSubscription
