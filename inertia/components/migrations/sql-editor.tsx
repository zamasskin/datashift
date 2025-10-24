import { useEffect, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useTheme } from '../theme-provider'

type SqlEditorProps = {
  value: string
  tables?: string[]
  columns?: string[]
  paramKeys?: string[]
  prevResults?: Record<string, string[]>
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

    // Используем переданные значения, если есть, иначе дефолт
    const tables = (props.tables && props.tables.length > 0)
      ? props.tables
      : ['users', 'orders', 'products']
    const columns = (props.columns && props.columns.length > 0)
      ? props.columns
      : ['id', 'name', 'created_at']
    const paramKeys = props.paramKeys || []
    const prevResults = props.prevResults || {}

    const provider = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.', '(', '{'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        // Подсказки для параметров: {param.name}
        const paramSuggestions = paramKeys.map((p, i) => ({
          label: `{param.${p}}`,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: `{param.${p}}`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: 'Параметр',
          sortText: `00${i}`,
          preselect: i === 0,
        }))

        // Подсказки для результатов предыдущих запросов: {sqlAlias.column}
        const prevResultSuggestions = Object.entries(prevResults).flatMap(([alias, cols]) =>
          (cols || []).map((c, i) => ({
            label: `{${alias}.${c}}`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: `{${alias}.${c}}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: `Из результата ${alias}`,
            sortText: `01${i}`,
          }))
        )

        const suggestions = [
          // Сначала специальные подсказки с фигурными скобками
          ...paramSuggestions,
          ...prevResultSuggestions,
          // Далее общий сниппет и ключевые слова
          {
            label: 'SELECT * FROM ...',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'SELECT * FROM ${1:table} WHERE ${2:condition};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Шаблон запроса',
            documentation: 'Быстрый шаблон SELECT',
            sortText: '1',
          },
          ...['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY'].map((kw, i) => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
            detail: 'Ключевое слово',
            sortText: `2${i}`,
          })),
          ...tables.map((t, i) => ({
            label: t,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: t,
            range,
            detail: 'Таблица',
            sortText: `3${i}`,
          })),
          ...columns.map((c, i) => ({
            label: c,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: c,
            range,
            detail: 'Колонка',
            sortText: `4${i}`,
          })),
        ]

        return { suggestions }
      },
    })

    return () => provider.dispose()
  }, [monaco, props.tables, props.columns, props.paramKeys, props.prevResults])

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
          wordBasedSuggestions: 'off',
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
