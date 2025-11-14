import EventLog from '#models/event'
import { BaseEvent } from '@adonisjs/core/events'

export class EventCreate extends BaseEvent {
  constructor(public event: EventLog) {
    super()
  }
}

export class EventUpdate extends BaseEvent {
  constructor(public event: EventLog) {
    super()
  }
}

export class EventsCleared extends BaseEvent {
  constructor(
    public userId: number,
    public updated: number
  ) {
    super()
  }
}
