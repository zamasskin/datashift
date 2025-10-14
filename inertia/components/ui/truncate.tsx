import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '~/lib/utils'

export type TruncateProps = {
  children: React.ReactNode
  /**
   * Кол-во строк для обрезки:
   * 1 = однострочный ellipsis (Tailwind truncate)
   * >1 = мультистрочное, через -webkit-line-clamp
   */
  lines?: number
  /**
   * Передать дочерний элемент как контейнер (например, Link)
   */
  asChild?: boolean
  className?: string
  /**
   * Текст для подсказки (title). По умолчанию берётся из children, если это строка.
   */
  title?: string
}

export function Truncate({ children, lines = 1, asChild, className, title }: TruncateProps) {
  const Comp = asChild ? Slot : 'span'
  const isSingleLine = lines <= 1

  const style: React.CSSProperties | undefined = isSingleLine
    ? undefined
    : {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }

  const computedTitle = title ?? (typeof children === 'string' ? children : undefined)

  return (
    <Comp
      className={cn('block max-w-full', isSingleLine ? 'truncate' : 'break-words', className)}
      style={style}
      title={computedTitle}
    >
      {children}
    </Comp>
  )
}
