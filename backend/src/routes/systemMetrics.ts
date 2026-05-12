import express from 'express'
import { systemMetricsService } from '../services/systemMetricsService'
import { prisma } from '../config/prisma'

const router = express.Router()

// Middleware to check admin permissions
const requireAdmin = (req: any, res: any, next: any) => {
  const user = req.user
  if (!user || !user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// Apply admin middleware to all routes
router.use(requireAdmin)

// Get current system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await systemMetricsService.getSystemMetrics()
    
    // Store metrics in database for historical tracking
    await prisma.systemMetric.create({
      data: {
        cpuUsage: metrics.cpu.usage,
        memoryUsage: metrics.memory.usage,
        storageUsage: metrics.storage.usage,
        networkDownload: metrics.network.download,
        networkUpload: metrics.network.upload,
        networkLatency: metrics.network.latency,
        uptime: metrics.uptime,
        loadAverage: metrics.loadAverage,
        timestamp: new Date()
      }
    }).catch(() => {
      // Ignore if table doesn't exist yet
    })

    res.json({
      success: true,
      metrics,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('System metrics error:', error)
    res.status(500).json({ error: 'Failed to get system metrics' })
  }
})

// Get system wake time and uptime information
router.get('/wake-time', async (req, res) => {
  try {
    const wakeTime = systemMetricsService.getSystemWakeTime()
    
    res.json({
      success: true,
      wakeTime,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Wake time error:', error)
    res.status(500).json({ error: 'Failed to get system wake time' })
  }
})

// Get historical metrics data
router.get('/metrics/history', async (req, res) => {
  try {
    const { period = '24' } = req.query
    const hours = Math.max(1, parseInt(String(period), 10) || 24)
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Try to get from database, fallback to empty array if table doesn't exist
    let metrics = []
    try {
      metrics = await prisma.systemMetric.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' },
        take: 100 // Limit to prevent too much data
      })
    } catch (error) {
      // Table might not exist, return empty array
      console.log('System metrics table not found, returning empty history')
    }

    res.json({
      success: true,
      metrics,
      period: `${hours}h`,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Metrics history error:', error)
    res.status(500).json({ error: 'Failed to get metrics history' })
  }
})

// Get system health status
router.get('/health', async (req, res) => {
  try {
    const metrics = await systemMetricsService.getSystemMetrics()
    
    // Determine health status
    const health = {
      status: 'healthy',
      issues: [] as string[],
      score: 100
    }

    // Check CPU usage
    if (metrics.cpu.usage > 80) {
      health.status = 'warning'
      health.issues.push(`High CPU usage: ${metrics.cpu.usage}%`)
      health.score -= 20
    }

    // Check memory usage
    if (metrics.memory.usage > 85) {
      health.status = health.status === 'warning' ? 'critical' : 'warning'
      health.issues.push(`High memory usage: ${metrics.memory.usage}%`)
      health.score -= 25
    }

    // Check storage usage
    if (metrics.storage.usage > 90) {
      health.status = 'critical'
      health.issues.push(`High storage usage: ${metrics.storage.usage}%`)
      health.score -= 30
    }

    // Check network latency
    if (metrics.network.latency > 200) {
      health.status = health.status === 'healthy' ? 'warning' : health.status
      health.issues.push(`High network latency: ${metrics.network.latency}ms`)
      health.score -= 15
    }

    // Check load average
    if (metrics.loadAverage[0] > metrics.cpu.cores * 2) {
      health.status = 'critical'
      health.issues.push(`High load average: ${metrics.loadAverage[0].toFixed(2)}`)
      health.score -= 25
    }

    res.json({
      success: true,
      health,
      metrics: {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.usage,
        storage: metrics.storage.usage,
        latency: metrics.network.latency,
        loadAverage: metrics.loadAverage[0]
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('System health error:', error)
    res.status(500).json({ error: 'Failed to get system health' })
  }
})

// Get performance benchmarks
router.get('/performance', async (req, res) => {
  try {
    const startTime = Date.now()
    
    // Test database response time
    const dbStart = Date.now()
    await prisma.user.count()
    const dbTime = Date.now() - dbStart
    
    // Test memory allocation
    const memStart = Date.now()
    const largeArray = new Array(1000000).fill(0)
    largeArray.sort()
    const memTime = Date.now() - memStart
    
    // Test CPU computation
    const cpuStart = Date.now()
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i)
    }
    const cpuTime = Date.now() - cpuStart
    
    const totalTime = Date.now() - startTime

    res.json({
      success: true,
      performance: {
        database: `${dbTime}ms`,
        memory: `${memTime}ms`,
        cpu: `${cpuTime}ms`,
        total: `${totalTime}ms`,
        score: Math.max(0, 100 - (totalTime / 10)) // Score based on total time
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Performance test error:', error)
    res.status(500).json({ error: 'Failed to run performance test' })
  }
})

export default router
