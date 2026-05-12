import { prisma } from '../database'

export const connectDB = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

export const disconnectDB = async (): Promise<void> => {
  try {
    await prisma.$disconnect()
    console.log('Database disconnected')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}
