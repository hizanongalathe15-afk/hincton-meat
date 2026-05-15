import { useState, useEffect, useRef } from 'react'

// Slide animations and typewriter effects

export interface TypewriterOptions {
  text: string
  speed?: number
  delay?: number
  onComplete?: () => void
  cursor?: string
  showCursor?: boolean
}

export interface SlideAnimationOptions {
  direction?: 'left' | 'right' | 'up' | 'down'
  duration?: number
  delay?: number
  distance?: number
  easing?: string
}

// Typewriter Effect
export class TypewriterEffect {
  private element: HTMLElement
  private options: Required<TypewriterOptions>
  private currentIndex: number = 0
  private isTyping: boolean = false
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor(element: HTMLElement, options: TypewriterOptions) {
    this.element = element
    this.options = {
      speed: 50,
      delay: 0,
      cursor: '|',
      showCursor: true,
      onComplete: () => {},
      ...options
    }
  }

  start(): void {
    if (this.isTyping) return
    
    this.isTyping = true
    this.currentIndex = 0
    this.element.textContent = ''
    
    setTimeout(() => {
      this.type()
    }, this.options.delay)
  }

  private type(): void {
    if (this.currentIndex < this.options.text.length) {
      // const char = this.options.text[this.currentIndex]
      this.element.textContent = this.options.text.substring(0, this.currentIndex + 1)
      
      if (this.options.showCursor) {
        this.element.textContent += this.options.cursor
      }
      
      this.currentIndex++
      this.timeout = setTimeout(() => this.type(), this.options.speed)
    } else {
      this.isTyping = false
      this.options.onComplete()
    }
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    this.isTyping = false
  }

  reset(): void {
    this.stop()
    this.currentIndex = 0
    this.element.textContent = ''
  }
}

// React Hook for Typewriter
export const useTypewriter = (options: TypewriterOptions) => {
  const [text, setText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef<TypewriterOptions['onComplete']>(options.onComplete)

  useEffect(() => {
    onCompleteRef.current = options.onComplete
  }, [options.onComplete])

  useEffect(() => {
    const fullText = options.text || ''
    const speed = options.speed ?? 50
    const delay = options.delay ?? 0

    const clearTimers = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    clearTimers()

    if (!fullText) {
      setText('')
      setIsTyping(false)
      return clearTimers
    }

    setText('')
    setIsTyping(true)

    timeoutRef.current = setTimeout(() => {
      let index = 0

      intervalRef.current = setInterval(() => {
        index += 1
        setText(fullText.slice(0, index))

        if (index >= fullText.length) {
          clearTimers()
          setIsTyping(false)
          onCompleteRef.current?.()
        }
      }, speed)
    }, delay)

    return clearTimers
  }, [options.text, options.speed, options.delay])

  return { text, isTyping }
}

// Slide Animations
export const slideIn = (element: HTMLElement, options: SlideAnimationOptions = {}): Promise<void> => {
  return new Promise((resolve) => {
    const {
      direction = 'left',
      duration = 300,
      delay = 0,
      distance = 100,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
    } = options

    // Set initial position
    element.style.opacity = '0'
    element.style.transition = `all ${duration}ms ${easing}`
    
    switch (direction) {
      case 'left':
        element.style.transform = `translateX(-${distance}px)`
        break
      case 'right':
        element.style.transform = `translateX(${distance}px)`
        break
      case 'up':
        element.style.transform = `translateY(-${distance}px)`
        break
      case 'down':
        element.style.transform = `translateY(${distance}px)`
        break
    }

    // Trigger animation
    setTimeout(() => {
      element.style.opacity = '1'
      element.style.transform = 'translateX(0) translateY(0)'
      
      setTimeout(() => {
        resolve()
      }, duration)
    }, delay)
  })
}

export const slideOut = (element: HTMLElement, options: SlideAnimationOptions = {}): Promise<void> => {
  return new Promise((resolve) => {
    const {
      direction = 'left',
      duration = 300,
      delay = 0,
      distance = 100,
      easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
    } = options

    element.style.transition = `all ${duration}ms ${easing}`
    element.style.opacity = '1'

    setTimeout(() => {
      element.style.opacity = '0'
      
      switch (direction) {
        case 'left':
          element.style.transform = `translateX(-${distance}px)`
          break
        case 'right':
          element.style.transform = `translateX(${distance}px)`
          break
        case 'up':
          element.style.transform = `translateY(-${distance}px)`
          break
        case 'down':
          element.style.transform = `translateY(${distance}px)`
          break
      }
      
      setTimeout(() => {
        resolve()
      }, duration)
    }, delay)
  })
}

// React Hook for Slide Animation

export const useSlideAnimation = (ref: import('react').RefObject<HTMLElement>, options: SlideAnimationOptions) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (isVisible) {
      slideIn(element, options)
    } else {
      slideOut(element, options)
    }
  }, [isVisible, options])

  return { isVisible, setIsVisible }
}

// Staggered animations for lists
export const staggeredSlideIn = (elements: HTMLElement[], options: SlideAnimationOptions = {}): Promise<void> => {
  const staggerDelay = options.delay || 50
  const promises: Promise<void>[] = []

  elements.forEach((element, index) => {
    const elementOptions = {
      ...options,
      delay: (options.delay || 0) + (index * staggerDelay)
    }
    promises.push(slideIn(element, elementOptions))
  })

  return Promise.all(promises).then(() => {})
}

// Fade animations
export const fadeIn = (element: HTMLElement, duration: number = 300, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.opacity = '0'
    element.style.transition = `opacity ${duration}ms ease-in-out`
    
    setTimeout(() => {
      element.style.opacity = '1'
      setTimeout(() => resolve(), duration)
    }, delay)
  })
}

export const fadeOut = (element: HTMLElement, duration: number = 300, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.opacity = '1'
    element.style.transition = `opacity ${duration}ms ease-in-out`
    
    setTimeout(() => {
      element.style.opacity = '0'
      setTimeout(() => resolve(), duration)
    }, delay)
  })
}

// Scale animations
export const scaleIn = (element: HTMLElement, duration: number = 300, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.transform = 'scale(0)'
    element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    
    setTimeout(() => {
      element.style.transform = 'scale(1)'
      setTimeout(() => resolve(), duration)
    }, delay)
  })
}

export const scaleOut = (element: HTMLElement, duration: number = 300, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.transform = 'scale(1)'
    element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    
    setTimeout(() => {
      element.style.transform = 'scale(0)'
      setTimeout(() => resolve(), duration)
    }, delay)
  })
}

// Bounce animation
export const bounce = (element: HTMLElement, duration: number = 600, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.animation = 'none'
    
    setTimeout(() => {
      element.style.animation = `bounce ${duration}ms ease-in-out`
      setTimeout(() => {
        element.style.animation = 'none'
        resolve()
      }, duration)
    }, delay)
  })
}

// Pulse animation
export const pulse = (element: HTMLElement, duration: number = 1000, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.animation = 'none'
    
    setTimeout(() => {
      element.style.animation = `pulse ${duration}ms ease-in-out infinite`
      setTimeout(() => {
        resolve()
      }, duration)
    }, delay)
  })
}

// Shake animation
export const shake = (element: HTMLElement, duration: number = 500, delay: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    element.style.animation = 'none'
    
    setTimeout(() => {
      element.style.animation = `shake ${duration}ms ease-in-out`
      setTimeout(() => {
        element.style.animation = 'none'
        resolve()
      }, duration)
    }, delay)
  })
}

// CSS animation keyframes
export const animationStyles = `
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(10px);
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-in-left {
  animation: slideInLeft 0.3s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}

.animate-slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

.animate-slide-in-down {
  animation: slideInDown 0.3s ease-out;
}
`

// Intersection Observer for scroll animations
export const useScrollAnimation = (ref: import('react').RefObject<HTMLElement>, animation: string, threshold: number = 0.1) => {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add(animation)
          }
        })
      },
      { threshold }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [ref, animation, threshold])
}
