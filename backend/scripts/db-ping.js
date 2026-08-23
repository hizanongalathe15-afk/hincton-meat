require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  let lastErr
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const r = await prisma.$queryRawUnsafe('SELECT 1 AS ok')
      console.log('DB awake:', JSON.stringify(r))
      return
    } catch (err) {
      lastErr = err
      console.log(`Attempt ${attempt} failed, waiting 15s...`)
      await new Promise((resolve) => setTimeout(resolve, 15000))
    }
  }
  throw lastErr
}

main()
  .catch((err) => {
    console.error('DB not reachable:', err.message.split('\n').slice(0, 3).join(' | '))
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
