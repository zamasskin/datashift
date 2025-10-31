'use client'

import { useEffect, useState } from 'react'
import { Field, FieldLabel } from '../ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Input } from '../ui/input'
import { Item } from '../ui/item'
import { Checkbox } from '../ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'

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
      {config?.type == 'interval' && <IntervalEditor config={config} onChange={handleChange} />}
      {config?.type == 'interval-time' && (
        <IntervalTimeEditor config={config} onChange={handleChange} />
      )}
      {config?.type == 'time' && <TimeEditor config={config} onChange={handleChange} />}
    </div>
  )
}

export type IntervalEditorProps = {
  config?: CronInterval
  onChange?: (config: CronInterval) => void
}

export function IntervalEditor({ config, onChange }: IntervalEditorProps) {
  const [count, setCount] = useState(config?.count || 1)
  const [countText, setCountText] = useState(String(config?.count || 1))
  const [units, setUnits] = useState(config?.units || 's')

  useEffect(() => {
    const next = config?.count || 1
    setCount(next)
    setCountText(String(next))
  }, [config?.count])

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
          value={countText}
          min={1}
          step={1}
          inputMode="numeric"
          onChange={(ev) => {
            const raw = ev.target.value
            setCountText(raw)
            const parsed = parseInt(raw, 10)
            if (!Number.isNaN(parsed) && parsed > 0) {
              setCount(parsed)
              if (onChange) {
                onChange({ type: 'interval', count: parsed, units })
              }
            }
          }}
          onBlur={(ev) => {
            const parsed = parseInt(ev.target.value, 10)
            const next = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed
            setCount(next)
            setCountText(String(next))
            if (onChange) {
              onChange({ type: 'interval', count: next, units })
            }
          }}
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

export type IntervalTimeEditorProps = {
  config?: CronIntervalTime
  onChange?: (config: CronIntervalTime) => void
}

export function IntervalTimeEditor({ config, onChange }: IntervalTimeEditorProps) {
  const [timeUnits, setTimeUnits] = useState(config?.timeUnits || 1)
  const [timeUnitsText, setTimeUnitsText] = useState(String(config?.timeUnits || 1))
  const [timeStart, setTimeStart] = useState(config?.timeStart || '00:00')
  const [timeEnd, setTimeEnd] = useState(config?.timeEnd || '01:00')
  const [days, setDays] = useState<CronDays[]>(
    config?.days || (Object.keys(cronDays) as CronDays[])
  )

  useEffect(() => {
    const next = config?.timeUnits || 1
    setTimeUnits(next)
    setTimeUnitsText(String(next))
  }, [config?.timeUnits])

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Каждые</FieldLabel>
        <InputGroup>
          <InputGroupInput
            type="number"
            value={timeUnitsText}
            min={1}
            step={1}
            inputMode="numeric"
            onChange={(ev) => {
              const raw = ev.target.value
              setTimeUnitsText(raw)
              const parsed = parseInt(raw, 10)
              if (!Number.isNaN(parsed) && parsed > 0) {
                setTimeUnits(parsed)
                if (onChange) {
                  onChange({
                    type: 'interval-time',
                    timeUnits: parsed,
                    timeStart,
                    timeEnd,
                    days,
                  })
                }
              }
            }}
            onBlur={(ev) => {
              const parsed = parseInt(ev.target.value, 10)
              const next = Number.isNaN(parsed) || parsed <= 0 ? 1 : parsed
              setTimeUnits(next)
              setTimeUnitsText(String(next))
              if (onChange) {
                onChange({ type: 'interval-time', timeUnits: next, timeStart, timeEnd, days })
              }
            }}
          />
          <InputGroupAddon align="inline-end">мин</InputGroupAddon>
        </InputGroup>
      </Field>

      <Field>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">между</span>
          <InputGroup>
            <InputGroupInput
              type="time"
              value={timeStart}
              onChange={(ev) => {
                const val = ev.target.value
                setTimeStart(val)
                if (onChange) {
                  onChange({ type: 'interval-time', timeUnits, timeStart: val, timeEnd, days })
                }
              }}
            />
          </InputGroup>
          <span className="text-sm text-muted-foreground">и</span>
          <InputGroup>
            <InputGroupInput
              type="time"
              value={timeEnd}
              onChange={(ev) => {
                const val = ev.target.value
                setTimeEnd(val)
                if (onChange) {
                  onChange({ type: 'interval-time', timeUnits, timeStart, timeEnd: val, days })
                }
              }}
            />
          </InputGroup>
        </div>
      </Field>

      <Field>
        <FieldLabel>Дни недели</FieldLabel>
        <div className="flex flex-wrap gap-3" data-slot="checkbox-group">
          {(Object.keys(cronDays) as CronDays[]).map((d) => (
            <label key={d} className="inline-flex items-center gap-2">
              <Checkbox
                checked={days.includes(d)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? Array.from(new Set([...days, d]))
                    : days.filter((x) => x !== d)
                  setDays(next)
                  if (onChange) {
                    onChange({ type: 'interval-time', timeUnits, timeStart, timeEnd, days: next })
                  }
                }}
              />
              <span className="text-sm">{cronDays[d]}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  )
}

export type TimeEditorProps = {
  config?: CronTime
  onChange?: (config: CronTime) => void
}

export function TimeEditor({ config, onChange }: TimeEditorProps) {
  const [time, setTime] = useState(config?.time || '12:00')
  const [days, setDays] = useState<CronDays[]>(
    config?.days || (Object.keys(cronDays) as CronDays[])
  )

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Время</FieldLabel>
        <Input
          type="time"
          value={time}
          onChange={(ev) => {
            const val = ev.target.value
            setTime(val)
            if (onChange) {
              onChange({ type: 'time', time: val, days })
            }
          }}
        />
      </Field>

      <Field>
        <FieldLabel>Дни недели</FieldLabel>
        <div className="flex flex-wrap gap-3" data-slot="checkbox-group">
          {(Object.keys(cronDays) as CronDays[]).map((d) => (
            <label key={d} className="inline-flex items-center gap-2">
              <Checkbox
                checked={days.includes(d)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? Array.from(new Set([...days, d]))
                    : days.filter((x) => x !== d)
                  setDays(next)
                  if (onChange) {
                    onChange({ type: 'time', time, days: next })
                  }
                }}
              />
              <span className="text-sm">{cronDays[d]}</span>
            </label>
          ))}
        </div>
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
