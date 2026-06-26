import type { Application } from 'express'

interface AppBootstrap {
   app: Application
   start: (port?: number) => Promise<void>
}

export type { AppBootstrap }
