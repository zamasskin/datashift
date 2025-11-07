import { useEffect, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useTheme } from '../theme-provider'

export type ExpressionEditorProps = {
  value: string
  columns?: string[]
  onChange: (val: string) => void
}

export function ExpressionEditor({ value, columns = [], onChange }: ExpressionEditorProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme } = useTheme()
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs-dark')

  const monaco = useMonaco()

  useEffect(() => {
    if (!monaco) return

    const provider = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.', ' ', '(', '{', '[', '"'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const line = model.getLineContent(position.lineNumber)
        const prefix = line.slice(0, Math.max(0, position.column - 1))
        const afterColumnPrefix = /(?:^|\W)column\.$/.test(prefix)
        const afterColumnBracketPrefix = /(?:^|\W)column\["?$/.test(prefix)

        const columnSuggestionsDot = (columns || []).map((c, i) => ({
          label: `column.${c}`,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `column.${c}`,
          range,
          detail: 'Колонка (точечная запись)',
          sortText: `01${i}`,
        }))

        const columnSuggestionsBracket = (columns || []).map((c, i) => ({
          label: `column["${c}"]`,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: `column["${c}"]`,
          range,
          detail: 'Колонка (скобочная запись — безопасно для ключей с точками)',
          sortText: `00${i}`,
        }))

        const baseSuggestion = {
          label: 'column.',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'column.',
          range,
          detail: 'Префикс колонок',
          sortText: '000',
        }

        const baseBracketSuggestion = {
          label: 'column["..."]',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'column[""]',
          range,
          detail: 'Скобочная запись колонок',
          sortText: '000',
        }

        const suggestions = afterColumnBracketPrefix
          ? columnSuggestionsBracket
          : afterColumnPrefix
            ? [...columnSuggestionsBracket, ...columnSuggestionsDot]
            : [
                baseSuggestion,
                baseBracketSuggestion,
                ...columnSuggestionsBracket,
                ...columnSuggestionsDot,
              ]

        return { suggestions }
      },
    })

    return () => provider.dispose()
  }, [monaco, columns])

  useEffect(() => {
    if (!mounted) return
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setEditorTheme(isDark ? 'vs-dark' : 'vs')
  }, [theme, mounted])

  return mounted ? (
    <div className="rounded-md border text-sm bg-background">
      <Editor
        height="180px"
        defaultLanguage="javascript"
        value={value}
        onChange={(val) => onChange(val || '')}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: 'off',
        }}
      />
    </div>
  ) : (
    <textarea
      className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
      placeholder="Например: column.price * 1.2"
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
    />
  )
}
