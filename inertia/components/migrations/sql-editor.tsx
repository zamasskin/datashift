import { useEffect, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useTheme } from '../theme-provider'

type SqlEditorProps = {
  value: string
  tables: string[]
  columns: string[]
  onChange: (val: string) => void
}

export function SqlEditor(props: SqlEditorProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme } = useTheme()
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs-dark')

  const monaco = useMonaco()

  useEffect(() => {
    if (!monaco) return

    // Подставьте реальные таблицы/поля из вашего источника данных
    const tables = ['users', 'orders', 'products']
    const columns = ['id', 'name', 'created_at']

    const provider = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.', '('],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const suggestions = [
          {
            label: 'SELECT * FROM ...',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'SELECT * FROM ${1:table} WHERE ${2:condition};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Шаблон запроса',
            documentation: 'Быстрый шаблон SELECT',
            sortText: '0',
          },
          ...['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY'].map((kw, i) => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
            detail: 'Ключевое слово',
            sortText: `1${i}`,
          })),
          ...tables.map((t, i) => ({
            label: t,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: t,
            range,
            detail: 'Таблица',
            sortText: `2${i}`,
          })),
          ...columns.map((c, i) => ({
            label: c,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: c,
            range,
            detail: 'Колонка',
            sortText: `3${i}`,
          })),
        ]

        return { suggestions }
      },
    })

    return () => provider.dispose()
  }, [monaco])

  useEffect(() => {
    if (!mounted) return
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setEditorTheme(isDark ? 'vs-dark' : 'vs')
  }, [theme, mounted])

  return mounted ? (
    <div className="rounded-md border  text-sm bg-background my-2">
      <Editor
        height="300px"
        defaultLanguage="sql"
        value={props.value}
        onChange={(val) => props?.onChange(val || '')}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          suggestOnTriggerCharacters: true,
          wordBasedSuggestions: 'off', // ваши подсказки приоритетнее
        }}
      />
    </div>
  ) : (
    <textarea
      className="min-h-40 w-full rounded-md border px-3 py-2 text-sm"
      placeholder="SELECT * FROM table WHERE ..."
      value={props.value}
      onChange={(ev) => props?.onChange(ev.target.value)}
    />
  )
}
