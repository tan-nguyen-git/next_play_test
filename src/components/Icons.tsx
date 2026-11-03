import type { ReactNode } from 'react'

// Small inline icons. Decorative only: the surrounding text always carries the
// meaning, so every icon is hidden from assistive technology.
interface IconProps {
  size?: number
}

function Svg({ size = 14, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function LogoMark({ size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f6bed" />
          <stop offset="1" stopColor="#7c8ff3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
      <rect x="7" y="8" width="4.5" height="16" rx="1.5" fill="#fff" />
      <rect x="13.75" y="8" width="4.5" height="11" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="20.5" y="8" width="4.5" height="7" rx="1.5" fill="#fff" opacity=".7" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </Svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" />
    </Svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </Svg>
  )
}

// Signal bars: one, two, or three filled bars for low, normal, and high.
export function PriorityIcon({ level, size = 14 }: IconProps & { level: 'low' | 'normal' | 'high' }) {
  const filled = level === 'high' ? 3 : level === 'normal' ? 2 : 1
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={2.5 + bar * 4}
          y={10 - bar * 3}
          width="3"
          height={4 + bar * 3}
          rx="1"
          fill="currentColor"
          opacity={bar < filled ? 1 : 0.25}
        />
      ))}
    </svg>
  )
}

// One ring per workflow stage: empty and dashed, half, three-quarters, then done with a check.
export function StatusIcon({ status, size = 14 }: IconProps & { status: 'todo' | 'in_progress' | 'in_review' | 'done' }) {
  return (
    <svg className="icon status-icon" width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {status === 'todo' && (
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.4 1.9" />
      )}
      {(status === 'in_progress' || status === 'in_review') && (
        <>
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d={status === 'in_progress' ? 'M8 4a4 4 0 0 1 0 8z' : 'M8 4a4 4 0 1 1-4 4h4z'}
            fill="currentColor"
          />
        </>
      )}
      {status === 'done' && (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M5 8.2 7 10.2 11 6" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3v10M3 8h10" />
    </Svg>
  )
}

export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 9.5 4 3.5h8l1.5 6v3a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />
      <path d="M2.5 9.5h3l1 1.5h3l1-1.5h3" />
    </Svg>
  )
}
