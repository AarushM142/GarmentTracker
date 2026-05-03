'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'fade'
}

export function Reveal({ children, className = '', delay = 0, direction = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const initial: Record<string, string> = {
      opacity: '0',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }
    if (direction === 'up')    initial.transform = 'translateY(40px)'
    if (direction === 'left')  initial.transform = 'translateX(-40px)'
    if (direction === 'right') initial.transform = 'translateX(40px)'

    Object.assign(el.style, initial)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, direction])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

export function StaggerReveal({ children, className = '', stagger = 100 }: { children: ReactNode[]; className?: string; stagger?: number }) {
  return (
    <div className={className}>
      {(children as ReactNode[]).map((child, i) => (
        <Reveal key={i} delay={i * stagger}>
          {child}
        </Reveal>
      ))}
    </div>
  )
}
