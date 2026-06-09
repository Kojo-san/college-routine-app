'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// ── Types ──────────────────────────────────────────────────────────────────

interface Particle {
  angle: number
  radius: number
  speed: number
  size: number
  opacity: number
  hue: number
  saturation: number
}

interface SpiralAnimationProps {
  className?: string
}

// ── Animation Controller ───────────────────────────────────────────────────

class AnimationController {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  particles: Particle[]
  time: number
  size: number
  bearImage: HTMLImageElement
  private tween: gsap.core.Tween | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.time = 0
    this.size = Math.min(canvas.width, canvas.height)

    // Preload bear image
    this.bearImage = new Image()
    this.bearImage.src = '/assets/bear_flying.png'

    this.particles = this.createParticles(5000)
  }

  private createParticles(count: number): Particle[] {
    const particles: Particle[] = []
    const ARMS = 3
    // Arm hues: violet, magenta, orange — matching the app colour palette
    const ARM_HUES = [268, 328, 18]

    for (let i = 0; i < count; i++) {
      const arm = i % ARMS
      const t = i / count
      const maxR = this.size * 0.52

      // Logarithmic spiral: tighter at center, looser at edges
      const angle =
        t * Math.PI * 2 * 5 +
        (arm * Math.PI * 2) / ARMS +
        (Math.random() - 0.5) * 0.4

      const radius = Math.max(2, t * maxR + (Math.random() - 0.5) * maxR * 0.1)

      // Inner particles denser/faster for galaxy-like differential rotation
      const radiusFactor = 1 - (radius / maxR) * 0.4
      const speed = radiusFactor * (0.5 + Math.random() * 0.8)

      particles.push({
        angle,
        radius,
        speed,
        size: 0.5 + Math.random() * 2.2,
        opacity: 0.15 + Math.random() * 0.85,
        hue: ARM_HUES[arm] + (Math.random() - 0.5) * 28,
        saturation: 65 + Math.random() * 35,
      })
    }

    return particles
  }

  render() {
    const { ctx, canvas } = this
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2

    // Dark trail — lower alpha = longer streaks
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(cx, cy)

    // Global rotation: 2 full turns per cycle
    const globalRot = this.time * Math.PI * 4

    for (const p of this.particles) {
      const angle = p.angle + globalRot * p.speed
      const x = Math.cos(angle) * p.radius
      const y = Math.sin(angle) * p.radius

      // Soft pulse
      const pulse = 0.55 + 0.45 * Math.sin(this.time * Math.PI * 8 + p.angle * 2.5)
      const alpha = p.opacity * pulse

      ctx.beginPath()
      ctx.arc(x, y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${p.hue.toFixed(0)}, ${p.saturation.toFixed(0)}%, 72%, ${alpha.toFixed(3)})`
      ctx.fill()
    }

    this.drawBear(ctx)

    ctx.restore()
  }

  private drawBear(ctx: CanvasRenderingContext2D) {
    const t = this.time

    if (t <= 0.28 || t > 0.85) return
    if (!this.bearImage.complete || this.bearImage.naturalWidth === 0) return

    const baseSize = this.size * 0.35
    let bearScale = 0
    let bearOpacity = 0
    let bearRotation = 0
    let whiteFlash = 0

    if (t >= 0.28 && t < 0.40) {
      // Phase 1 — Apparition
      const p = (t - 0.28) / (0.40 - 0.28)
      const ease = 1 - Math.pow(1 - p, 3) // cubic ease-out
      bearScale = ease * 0.6
      bearOpacity = p
      ctx.shadowBlur = 40 * p
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    } else if (t >= 0.40 && t < 0.72) {
      // Phase 2 — Flight
      const p = (t - 0.40) / (0.72 - 0.40)
      const ease = p * p * (3 - 2 * p) // smooth-step
      bearScale = 0.6 + ease * (2.5 - 0.6)
      bearOpacity = 1
      bearRotation = -(ease * 15 * Math.PI) / 180
      ctx.shadowBlur = 40 + ease * 40
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    } else if (t >= 0.72 && t <= 0.85) {
      // Phase 3 — Disappearance
      const p = (t - 0.72) / (0.85 - 0.72)
      const ease = p * p // quad ease-in
      bearScale = 2.5 + ease * (5.0 - 2.5)
      bearOpacity = 1 - p
      ctx.shadowBlur = 80
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
      whiteFlash = ease * 0.9
    }

    const bearSize = baseSize * bearScale

    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, bearOpacity))
    ctx.rotate(bearRotation)
    ctx.drawImage(this.bearImage, -bearSize / 2, -bearSize / 2, bearSize, bearSize)
    ctx.restore()

    // White flash overlay for Phase 3
    if (whiteFlash > 0) {
      const s = this.size * 3
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, whiteFlash))
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-s / 2, -s / 2, s, s)
      ctx.restore()
    }
  }

  start() {
    const proxy = { t: 0 }
    this.tween = gsap.to(proxy, {
      t: 1,
      duration: 5,
      ease: 'none',
      repeat: -1,
      onUpdate: () => {
        this.time = proxy.t
        this.render()
      },
    })
  }

  stop() {
    if (this.tween) {
      this.tween.kill()
      this.tween = null
    }
  }
}

// ── React Component ────────────────────────────────────────────────────────

export function SpiralAnimation({ className }: SpiralAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctrlRef = useRef<AnimationController | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const init = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      if (ctrlRef.current) ctrlRef.current.stop()

      const ctrl = new AnimationController(canvas)
      ctrlRef.current = ctrl
      ctrl.start()
    }

    init()

    const ro = new ResizeObserver(init)
    ro.observe(canvas)

    return () => {
      ctrlRef.current?.stop()
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
