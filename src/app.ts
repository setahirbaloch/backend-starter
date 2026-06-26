import { createApp } from './appFactory'
import { env } from './config/env/env.config'

/*───────────────Invoke Factory───────────────*/
const { start } = createApp()

/*───────────────Start Server───────────────*/
/* Using top-level await or wrapping in async IIFE */
;(async () => {
   try {
      await start(env.application.PORT)
   } catch (error) {
      console.error('Failed to start server:', error)
      process.exit(1)
   }
})()
