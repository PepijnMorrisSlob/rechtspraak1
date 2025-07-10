import express from 'express'
import { ChatService } from '../services/ChatService.js'

const router = express.Router()
const chatService = new ChatService()

/**
 * POST /api/chat
 * Process a chat message and return AI response
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required'
      })
    }

    console.log('Processing chat message:', message)

    // TODO: Implement RAG processing
    const result = await chatService.processMessage(message)

    res.json({
      success: true,
      response: result.response,
      sources: result.sources || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing chat message:', error)
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    })
  }
})

/**
 * GET /api/chat/history
 * Get chat history (if implemented)
 */
router.get('/history', async (req, res) => {
  try {
    const history = await chatService.getChatHistory()
    res.json({
      success: true,
      history
    })
  } catch (error) {
    console.error('Error getting chat history:', error)
    res.status(500).json({
      error: 'Failed to get chat history',
      message: error.message
    })
  }
})

/**
 * DELETE /api/chat/history
 * Clear chat history
 */
router.delete('/history', async (req, res) => {
  try {
    await chatService.clearChatHistory()
    res.json({
      success: true,
      message: 'Chat history cleared'
    })
  } catch (error) {
    console.error('Error clearing chat history:', error)
    res.status(500).json({
      error: 'Failed to clear chat history',
      message: error.message
    })
  }
})

export default router 