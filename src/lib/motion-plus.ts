"use client"

import { useEffect, useRef, useState, createElement, type CSSProperties, type ReactNode } from "react"
import { motion, useSpring, useTransform } from "motion/react"

// ── AnimateNumber ──
// Rolling number animation that spins digits up/down

interface AnimateNumberProps {
  children: number | bigint | string
  suffix?: string
  prefix?: string
  trend?: number
  transition?: Record<string, unknown>
  format?: Intl.NumberFormatOptions
  locales?: Intl.LocalesArgument
  style?: CSSProperties
  className?: string
}

export function AnimateNumber({
  children,
  suffix = "",
  prefix = "",
  style,
  className,
}: AnimateNumberProps) {
  const value = typeof children === "string" ? parseFloat(children) : Number(children)
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [rendered, setRendered] = useState(value)

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    const unsub = display.on("change", (v) => setRendered(v))
    return unsub
  }, [display])

  return createElement(
    motion.span,
    { style: { display: "inline-flex", whiteSpace: "nowrap", ...style }, className },
    `${prefix}${rendered}${suffix}`
  )
}

// ── ScrambleText ──
// Text that scrambles through random characters before settling

interface ScrambleTextProps {
  children: string
  duration?: number
  delay?: number
  interval?: number
  chars?: string
  className?: string
}

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

export function ScrambleText({
  children,
  duration = 0.8,
  delay = 0,
  interval = 0.04,
  chars = SCRAMBLE_CHARS,
  className,
}: ScrambleTextProps) {
  const [text, setText] = useState(children)
  const target = children

  useEffect(() => {
    const delayMs = delay * 1000
    const durationMs = duration * 1000
    const intervalMs = interval * 1000
    let frame: ReturnType<typeof setTimeout>

    const timeout = setTimeout(() => {
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(1, elapsed / durationMs)
        const revealed = Math.floor(progress * target.length)

        let result = ""
        for (let i = 0; i < target.length; i++) {
          if (i < revealed) {
            result += target[i]
          } else {
            result += chars[Math.floor(Math.random() * chars.length)]
          }
        }
        setText(result)

        if (progress < 1) {
          frame = setTimeout(tick, intervalMs)
        } else {
          setText(target)
        }
      }
      tick()
    }, delayMs)

    return () => {
      clearTimeout(timeout)
      clearTimeout(frame)
    }
  }, [target, duration, delay, interval, chars])

  return createElement("span", { className }, text)
}

// ── Typewriter ──
// Types text character by character with a blinking cursor

interface TypewriterProps {
  children: string
  as?: string
  className?: string
  speed?: "slow" | "normal" | "fast" | number
  variance?: "none" | "natural"
  cursorStyle?: CSSProperties
}

const SPEED_MAP: Record<string, number> = { slow: 60, normal: 35, fast: 18 }

export function Typewriter({
  children,
  as = "span",
  className,
  speed = "normal",
  variance = "none",
  cursorStyle,
}: TypewriterProps) {
  const [charIndex, setCharIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const target = children
  const baseSpeed = typeof speed === "number" ? speed : (SPEED_MAP[speed] || 35)

  useEffect(() => {
    setCharIndex(0)
  }, [target])

  useEffect(() => {
    if (charIndex >= target.length) return
    const jitter = variance === "natural" ? (Math.random() - 0.5) * baseSpeed * 0.6 : 0
    const ms = Math.max(5, baseSpeed + jitter)
    const timer = setTimeout(() => setCharIndex((i) => i + 1), ms)
    return () => clearTimeout(timer)
  }, [charIndex, target, baseSpeed, variance])

  useEffect(() => {
    const blink = setInterval(() => setShowCursor((v) => !v), 530)
    return () => clearInterval(blink)
  }, [])

  const displayed = target.slice(0, charIndex)
  const cursorEl = createElement("span", {
    style: {
      display: "inline-block",
      width: 2,
      height: "1em",
      backgroundColor: "currentColor",
      marginLeft: 1,
      opacity: showCursor ? 1 : 0,
      transition: "opacity 0.1s",
      verticalAlign: "text-bottom",
      ...cursorStyle,
    },
  })

  return createElement(as, { className }, displayed, cursorEl)
}
