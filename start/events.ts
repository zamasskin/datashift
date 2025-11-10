import { EventEmitter } from 'node:events'

export const progressBus = new EventEmitter()

// По желанию увеличьте лимит слушателей, если будет много одновременных стримов
progressBus.setMaxListeners(100)
