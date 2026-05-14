import { useState } from 'react'
import DashboardStats from './DashboardStats'
import SalesChart from './SalesChart'
import AnalyticsCards from './AnalyticsCards'
import RealtimeVisitsPanel from './RealtimeVisitsPanel'

interface AnalyticsPageProps {
  timeRange?: 'week' | 'month' | 'quarter' | 'year'
  onTimeRangeChange?: (range: 'week' | 'month' | 'quarter' | 'year') => void
}

const AnalyticsPage = ({ 
  timeRange = 'month', 
  onTimeRangeChange 
}: AnalyticsPageProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  const handleTimeRangeChange = (range: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedTimeRange(range)
    onTimeRangeChange?.(range)
  }

  return (
    <div className="space-y-6">
      <RealtimeVisitsPanel />

      {/* Dashboard Stats */}
      <DashboardStats loading={false} />

      {/* Analytics Cards */}
      <AnalyticsCards 
        timeRange={selectedTimeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      {/* Sales Chart */}
      <SalesChart 
        timeRange={selectedTimeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
    </div>
  )
}

export default AnalyticsPage
