import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { useRoutes } from '@/src/routes/useRoutes.js'
import { connectMongoose } from './config/mongoose.config.js'
import { errorHandler } from '@/lib/errorHandler.js'

const app = new Hono()

app.use('*', cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true
}))

// Add logger middleware
app.use('*', logger())

app.onError(errorHandler);

useRoutes(app);

const port = parseInt(process.env.PORT || '3001')

const init = async () => {
  try {
    await connectMongoose()
    
    serve({
      fetch: app.fetch,
      port
    }, (info) => {
      console.log(`Server is running on port ${info.port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

init().catch(console.error) 