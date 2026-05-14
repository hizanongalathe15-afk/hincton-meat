import dotenv from 'dotenv'
import { prisma } from '../src/config/prisma'
import { runCartReminderSweep } from '../src/services/cartReminderService'

dotenv.config()

const minutesArg = Number(process.argv[2])
const olderThanMinutes = Number.isFinite(minutesArg) ? minutesArg : 30

runCartReminderSweep({ olderThanMinutes, lowStockOnly: false })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
