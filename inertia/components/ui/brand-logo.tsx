import type { SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  size?: number
  strokeWidth?: number
}

export function BrandMark({ size = 24, strokeWidth = 2, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* Верхний «сдвиг» */}
      <path d="M4 7h8l2-3" />
      {/* Нижний «сдвиг» */}
      <path d="M20 17h-8l-2 3" />
      {/* Связующая линия */}
      <path d="M8 12h8" />
      {/* Узлы */}
      <circle cx="6" cy="7" r="1" />
      <circle cx="18" cy="17" r="1" />
    </svg>
  )
}

export function BrandLogo({
  size = 24,
  strokeWidth = 2,
  className,
  text = 'Datashift',
}: {
  size?: number
  strokeWidth?: number
  className?: string
  text?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <BrandMark size={size} strokeWidth={strokeWidth} />
      <span className="text-foreground text-xl font-semibold tracking-tight">{text}</span>
    </div>
  )
}