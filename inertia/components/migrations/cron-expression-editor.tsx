'use client'

import { useEffect, useState } from 'react'
import { Field, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'

export type CronExpressionEditorProps = {
  config?: CronConfig
  onChange?: (config: CronConfig | null) => void
}

export function CronExpressionEditor({ config, onChange }: CronExpressionEditorProps) {
  const [type, setType] = useState(config?.type || 'none')

  useEffect(() => {
    setType(config?.type || 'none')
  }, [config?.type])

  const handleSelectType = (type: CronConfig['type'] | 'none') => {
    setType(type)
    if (onChange) {
      switch (type) {
        case 'none':
          onChange(null)
          break
        case 'interval':
          onChange({ type, count: 1, units: 's' })
          break
        case 'interval-time':
          onChange({
            type,
            timeUnits: 1,
            timeStart: '00:00',
            timeEnd: '01:00',
            days: Object.keys(cronDays) as CronDays[],
          })
          break
        case 'time':
          onChange({ type, time: '12:00', days: Object.keys(cronDays) as CronDays[] })
          break
      }
    }
  }

  const handleChange = (config: CronConfig | null) => {
    if (onChange) {
      onChange(config)
    }
  }

  return (
    <div className="space-y-6">
      <Field>
        <FieldLabel>Повторять</FieldLabel>
        <Select onValueChange={handleSelectType} value={type}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Нет</SelectItem>
            <SelectItem value="interval">с интервалом</SelectItem>
            <SelectItem value="interval-time">с интервалом в промежутке</SelectItem>
            <SelectItem value="time">в определенное время</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {config?.type == 'interval' && (
        <IntervalEditor config={config} onChange={(config) => handleChange(config)} />
      )}
      {type == 'interval-time' && <div className="space-y-4">interval-time</div>}
      {type == 'time' && <div className="space-y-4">time</div>}
    </div>
  )
}

export type IntervalEditorProps = {
  config?: CronInterval
  onChange?: (config: CronInterval) => void
}

export function IntervalEditor({ config, onChange }: IntervalEditorProps) {
  const [count, setCount] = useState(config?.count || 1)
  const [units, setUnits] = useState(config?.units || 's')

  const handleChangeCount = (newCount: number) => {
    setCount(newCount)
    if (onChange) {
      onChange({ type: 'interval', count: newCount, units })
    }
  }

  const handleChangeUnits = (newUnits: CronInterval['units']) => {
    setUnits(newUnits)
    if (onChange) {
      onChange({ type: 'interval', units: newUnits, count })
    }
  }

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Каждые</FieldLabel>
        <Input
          type="number"
          value={count}
          onChange={(ev) => handleChangeCount(Number(ev.target.value))}
        />
        <Select
          value={units}
          onValueChange={(value: CronInterval['units']) => handleChangeUnits(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="s">Секунд</SelectItem>
            <SelectItem value="m">Минут</SelectItem>
            <SelectItem value="h">Часов</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

const cronDays = {
  mo: 'пн',
  tu: 'вт',
  we: 'ср',
  th: 'чт',
  fr: 'пт',
  sa: 'сб',
  su: 'вс',
}

type CronDays = keyof typeof cronDays

interface CronInterval {
  type: 'interval'
  count: number
  units: 's' | 'm' | 'h'
}

interface CronIntervalTime {
  type: 'interval-time'
  timeUnits: number
  timeStart: string
  timeEnd: string
  days: CronDays[]
}

interface CronTime {
  type: 'time'
  time: string
  days: CronDays[]
}

export type CronConfig = CronInterval | CronIntervalTime | CronTime
