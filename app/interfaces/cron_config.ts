type CronDays = 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa' | 'su'
type CronInterval = { type: 'interval'; count: number; units: 's' | 'm' | 'h' }
type CronIntervalTime = {
  type: 'interval-time'
  timeUnits: number
  timeStart: string
  timeEnd: string
  days: CronDays[]
}
type CronTime = { type: 'time'; time: string; days: CronDays[] }
export type CronConfig = CronInterval | CronIntervalTime | CronTime
