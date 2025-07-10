import express from 'express'
import { ChatService } from '../services/ChatService.js'

const router = express.Router()
const chatService = new ChatService()

/**
 * POST /api/chat
 * Process a chat message and return AI response with RAG
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, options } = req.body

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required'
      })
    }

    // Generate session ID if not provided
    const activeSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`Processing chat message for session ${activeSessionId}:`, message)

    // Process message with RAG functionality
    const result = await chatService.processMessage(activeSessionId, message, options)

    res.json({
      success: true,
      sessionId: activeSessionId,
      response: result.aiResponse,
      citations: result.citations || [],
      followUpQuestions: result.followUpQuestions || [],
      searchStats: {
        totalResults: result.searchResultsCount,
        relevantResults: result.relevantResultsCount
      },
      metadata: {
        model: result.model,
        conversationTurn: result.conversationTurn,
        timestamp: result.timestamp
      }
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
 * GET /api/chat/history/:sessionId
 * Get conversation history for a specific session
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const history = await chatService.getConversationHistory(sessionId)
    res.json({
      success: true,
      history
    })
  } catch (error) {
    console.error('Error getting conversation history:', error)
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error.message
    })
  }
})

/**
 * DELETE /api/chat/history/:sessionId
 * Clear conversation history for a specific session
 */
router.delete('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const result = await chatService.clearConversation(sessionId)
    res.json(result)
  } catch (error) {
    console.error('Error clearing conversation history:', error)
    res.status(500).json({
      error: 'Failed to clear conversation history',
      message: error.message
    })
  }
})

/**
 * GET /api/chat/stats
 * Get chat statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await chatService.getChatStats()
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error getting chat stats:', error)
    res.status(500).json({
      error: 'Failed to get chat stats',
      message: error.message
    })
  }
})

/**
 * POST /api/chat/search
 * Search documents directly
 */
router.post('/search', async (req, res) => {
  try {
    const { query, options } = req.body

    if (!query || !query.trim()) {
      return res.status(400).json({
        error: 'Query is required'
      })
    }

    console.log('Searching documents for:', query)

    const results = await chatService.searchDocuments(query, options)

    res.json({
      success: true,
      query,
      results,
      resultsCount: results.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error searching documents:', error)
    res.status(500).json({
      error: 'Failed to search documents',
      message: error.message
    })
  }
})

export default router 