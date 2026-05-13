import serverless from 'serverless-http'
import app from '../backend/src/server'

export default serverless(app as any)
