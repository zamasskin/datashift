import { useEffect, useState } from 'react'
import Editor, { useMonaco } from '@monaco-editor/react'
import { useTheme } from '../theme-provider'
import _ from 'lodash'
import { usePage } from '@inertiajs/react'

type SqlEditorProps = {
  value: string
  tables?: string[]
  suggestions?: Record<string, string[]>
  onChange: (val: string) => void
}

export function SqlEditor(props: SqlEditorProps) {
  const page = usePage<{ layoutMessages: { components: { sqlEditor: Record<string, string> } } }>()
  const messages = page.props.layoutMessages.components.sqlEditor

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { theme } = useTheme()
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs-dark')

  const monaco = useMonaco()

  useEffect(() => {
    if (!monaco) return

    const tables = props.tables || []

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

        const params = props?.suggestions?.params || []
        const fields = _.omit(props?.suggestions, ['params'])

        console.log('suggestions', props?.suggestions)

        const prevResultSuggestions = Object.entries(fields).flatMap(([alias, cols]) =>
          (cols || []).map((c, i) => ({
            label: `{${alias}.${c}}`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: `${alias}.${c}`,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: `${messages.fromResult || 'Из результата'} ${alias}`,
            sortText: `0001${i}`,
          }))
        )

        const paramSuggestions = params.map((param, i) => ({
          label: `{params.${param}}`,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: `params.${param}`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          detail: messages.param || 'Параметр',
          sortText: `0002${i}`,
          preselect: i === 0,
        }))

        const suggestions = [
          ...paramSuggestions,
          ...prevResultSuggestions,
          {
            label: 'SELECT * FROM ...',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'SELECT * FROM ${1:table} WHERE ${2:condition};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: messages.templateQuery || 'Шаблон запроса',
            documentation: messages.templateQuickSelect || 'Быстрый шаблон SELECT',
            sortText: '1',
          },
          ...['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY'].map((kw, i) => ({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range,
            detail: messages.keyword || 'Ключевое слово',
            sortText: `2${i}`,
          })),
          ...tables.map((t, i) => ({
            label: t,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: t,
            range,
            detail: messages.table || 'Таблица',
            sortText: `3${i}`,
          })),
        ]

        return { suggestions }
      },
    })

    return () => provider.dispose()
  }, [monaco, props.suggestions, props.tables])

  useEffect(() => {
    if (!mounted) return
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setEditorTheme(isDark ? 'vs-dark' : 'vs')
  }, [theme, mounted])

  return mounted ? (
    <div className="rounded-md border  text-sm bg-background">
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
