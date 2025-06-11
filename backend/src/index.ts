import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { MongoClient } from 'mongodb'

const app = new Hono()

// Enable CORS
app.use('/*', cors())

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/cms')

// Connect to MongoDB
const connectDB = async () => {
  try {
    await client.connect()
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

// Health check endpoint
app.get('/', (c) => c.json({ status: 'ok', message: 'CMS API is running' }))

// Test endpoint with sample data
app.get('/api/test', (c) => {
  const sampleData = {
    items: [
      { id: 1, name: 'Item 1', description: 'This is item 1' },
      { id: 2, name: 'Item 2', description: 'This is item 2' },
      { id: 3, name: 'Item 3', description: 'This is item 3' }
    ],
    timestamp: new Date().toISOString(),
    total: 3
  }
  return c.json(sampleData)
})

// Start the server
const port = parseInt(process.env.PORT || '3001')

// Initialize the application
const init = async () => {
  try {
    await connectDB()
    
    serve({
      fetch: app.fetch,
      port
    }, (info) => {
      console.log(`Server is running on port ${info.port}`)
      console.log(`Test the API at: http://localhost:${info.port}/api/test`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

init().catch(console.error) 