import MigrationRun from '#models/migration_run'
import { create } from 'zustand'

type MigrationRuns = {
  runnings: MigrationRun[]
  setRunnings: (runnings: MigrationRun[]) => void
  changeRunning: (running: MigrationRun) => void
}

export const useMigrationRuns = create<MigrationRuns>((set) => ({
  runnings: [],
  setRunnings(runnings: MigrationRun[]) {
    set({ runnings })
  },

  changeRunning(running: MigrationRun) {
    set((state) => {
      if (running.status === 'running') {
        const idx = state.runnings.findIndex((r) => r.id === running.id)
        if (idx >= 0) {
          const next = [...state.runnings]
          next[idx] = running
          return { runnings: next }
        }
        return { runnings: [...state.runnings, running] }
      }
      return { runnings: state.runnings.filter((r) => r.id !== running.id) }
    })
  },
}))
