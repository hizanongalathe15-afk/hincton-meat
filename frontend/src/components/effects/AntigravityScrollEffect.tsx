import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useVelocity, useSpring, useReducedMotion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  opacity: number
  color: string
}

export const AntigravityScrollEffect: React.FC = () => {
  const reduceMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showQuickReturn, setShowQuickReturn] = useState(false)
  const { scrollY, scrollYProgress } = useScroll()
  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, { damping: 40, stiffness: 200 })

  // Glowing scroll progress bar spring
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  })

  // Show floating quick return button after scrolling down
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setShowQuickReturn(latest > 350)
    })
    return () => unsubscribe()
  }, [scrollY])

  // Canvas-based Antigravity floating particles (embers, cold steam flakes, herbs)
  useEffect(() => {
    if (reduceMotion) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const particleColors = [
      'rgba(239, 68, 68, 0.35)',   // Crimson red
      'rgba(245, 158, 11, 0.3)',   // Warm amber
      'rgba(255, 255, 255, 0.25)', // Cold mist white
      'rgba(220, 38, 38, 0.2)',    // Deep ruby
    ]

    const particles: Particle[] = Array.from({ length: 28 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedY: -(Math.random() * 0.6 + 0.2), // Default upward anti-gravity drift
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }))

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Calculate current scroll boost
      const currentVelocity = smoothVelocity.get()
      const antiGravityBoost = currentVelocity * -0.002

      particles.forEach((p) => {
        p.y += p.speedY + antiGravityBoost
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.2

        // Wrap around screen bounds
        if (p.y < -10) {
          p.y = height + 10
          p.x = Math.random() * width
        } else if (p.y > height + 10) {
          p.y = -10
          p.x = Math.random() * width
        }
        if (p.x < -10) p.x = width + 10
        else if (p.x > width + 10) p.x = -10

        // Draw particle with soft glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [reduceMotion, smoothVelocity])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* 1. Top Antigravity Scroll Progress Line */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] origin-left bg-gradient-to-r from-red-600 via-amber-500 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
        style={{ scaleX }}
      />

      {/* 2. Weightless Floating Micro-Embers / Mist Canvas */}
      {!reduceMotion && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-40 h-full w-full opacity-60"
          aria-hidden="true"
        />
      )}

      {/* 3. Floating Antigravity Quick-Return Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={
          showQuickReturn
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.6, y: 20 }
        }
        transition={{ duration: 0.25 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-stone-900/85 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-red-500/50 hover:bg-stone-900 hover:shadow-red-600/30"
          aria-label="Scroll back to top"
          title="Anti-Gravity Ascend"
        >
          {/* Subtle pulse glow */}
          <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 opacity-0 blur transition duration-300 group-hover:opacity-60" />
          
          <span className="relative flex items-center justify-center">
            <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1 text-red-400 group-hover:text-white" />
          </span>
        </button>
      </motion.div>
    </>
  )
}

export default AntigravityScrollEffect
