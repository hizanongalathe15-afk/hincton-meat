import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import SubscriptionBox from './SubscriptionBox'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const BuyerSubscription = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current subscription
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscriptions/mine', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
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
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          userId: user.id,
          startDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        await response.json()
        toast.success('Subscription created successfully! Welcome to Premium Meat Club!')
        
        // Refresh subscription data
        const fetchSubscription = async () => {
          const subResponse = await fetch('/api/subscriptions/mine', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          
          if (subResponse.ok) {
            const subData = await subResponse.json()
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
        }
        await fetchSubscription()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Subscription failed:', error)
      toast.error('Failed to create subscription. Please try again.')
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
