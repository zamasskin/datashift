import React, { useMemo } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'

type SqlSnippetProps = {
  code?: string
  className?: string
}

// Упрощённый тип токена Prism для рендеринга без implicit any
type PrismAnyToken = {
  type: string
  content: string | PrismAnyToken | Array<string | PrismAnyToken>
  alias?: string | string[]
}

const typeClass: Record<string, string> = {
  keyword: 'text-purple-600 dark:text-purple-400 font-semibold',
  string: 'text-emerald-600 dark:text-emerald-400',
  number: 'text-orange-600 dark:text-orange-400',
  operator: 'text-slate-500 dark:text-slate-400',
  punctuation: 'text-slate-500 dark:text-slate-400',
  function: 'text-blue-600 dark:text-blue-400',
  builtin: 'text-blue-600 dark:text-blue-400',
  variable: 'text-sky-600 dark:text-sky-400',
  boolean: 'text-orange-600 dark:text-orange-400',
  comment: 'text-slate-500 dark:text-slate-400 italic',
}

function renderNode(node: string | PrismAnyToken, key: number): React.ReactNode {
  if (typeof node === 'string') {
    return (
      <span key={key} className="text-muted-foreground">
        {node}
      </span>
    )
  }
  const alias = Array.isArray(node.alias) ? node.alias[0] : node.alias
  const cls = (alias && typeClass[alias]) || typeClass[node.type] || 'text-muted-foreground'
  if (typeof node.content === 'string') {
    return (
      <span key={key} className={cls}>
        {node.content}
      </span>
    )
  }
  if (Array.isArray(node.content)) {
    return (
      <span key={key} className={cls}>
        {node.content.map((child, i) => renderNode(child as string | PrismAnyToken, i))}
      </span>
    )
  }
  return (
    <span key={key} className={cls}>
      {renderNode(node.content as string | PrismAnyToken, key)}
    </span>
  )
}

export function SqlSnippet({ code = '', className }: SqlSnippetProps) {
  const tokens = useMemo(() => {
    try {
      return Prism.tokenize(code, Prism.languages.sql) as Array<string | PrismAnyToken>
    } catch {
      return [code]
    }
  }, [code])

  const base =
    'block w-full overflow-hidden whitespace-pre-wrap break-words rounded bg-muted px-2 py-1 text-xs font-mono'
  const classes = className
    ? `${base} ${className}`
    : `${base} text-muted-foreground line-clamp-2`

  return <code className={classes}>{tokens.map((t, i) => renderNode(t, i))}</code>
}

export default SqlSnippet