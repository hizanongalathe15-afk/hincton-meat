import express from 'express'
import { meatShopMessages, resolveMessage } from '../messages/meatShopMessages'

const router = express.Router()

router.get('/', (_req, res) => {
  res.json({
    messages: meatShopMessages,
  })
})

router.get('/:category/:key', (req, res) => {
  const { category, key } = req.params
  const categoryMessages = (meatShopMessages as any)[category]
  const message = categoryMessages?.[key]

  if (!message) {
    return res.status(404).json({ error: 'Message not found' })
  }

  res.json(resolveMessage(message, req.query as Record<string, string>))
})

export default router
