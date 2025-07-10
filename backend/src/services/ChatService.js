import { VectorService } from './VectorService.js'
import { AIService } from './AIService.js'

export class ChatService {
  constructor() {
    this.vectorService = new VectorService()
    this.aiService = new AIService()
    
    // Chat configuration
    this.config = {
      maxSearchResults: 5,
      minRelevanceScore: 0.3,
      maxContextLength: 8000,
      conversationHistory: 10
    }
    
    // In-memory conversation storage (in production, use a database)
    this.conversations = new Map()
  }

  /**
   * Process a chat message with RAG functionality
   * @param {string} sessionId - Chat session ID
   * @param {string} userMessage - User's message
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Chat response
   */
  async processMessage(sessionId, userMessage, options = {}) {
    try {
      console.log(`Processing chat message for session ${sessionId}: "${userMessage}"`)
      
      // Get conversation history
      const conversation = this.getConversation(sessionId)
      
      // Perform vector search
      const searchResults = await this.vectorService.searchDocuments(
        userMessage,
        options.maxResults || this.config.maxSearchResults,
        {
          filter: options.filter,
          namespace: options.namespace
        }
      )
      
      // Filter results by relevance score
      const relevantResults = this.filterRelevantResults(searchResults)
      
      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        userMessage,
        relevantResults,
        options.aiOptions || {}
      )
      
      // Generate follow-up questions
      const followUpQuestions = await this.aiService.generateFollowUpQuestions(
        userMessage,
        relevantResults
      )
      
      // Create chat response
      const chatResponse = {
        sessionId,
        userMessage,
        aiResponse: aiResponse.response,
        citations: aiResponse.citations,
        followUpQuestions,
        searchResultsCount: searchResults.length,
        relevantResultsCount: relevantResults.length,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
        conversationTurn: conversation.messages.length / 2 + 1
      }
      
      // Update conversation history
      this.updateConversation(sessionId, userMessage, aiResponse.response)
      
      return {
        success: true,
        ...chatResponse
      }
    } catch (error) {
      console.error('Error processing chat message:', error)
      throw new Error(`Chat processing failed: ${error.message}`)
    }
  }

  /**
   * Filter search results by relevance score
   * @param {Array} searchResults - Raw search results
   * @returns {Array} Filtered results
   */
  filterRelevantResults(searchResults) {
    return searchResults
      .filter(result => result.score >= this.config.minRelevanceScore)
      .slice(0, this.config.maxSearchResults)
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Conversation object
   */
  getConversation(sessionId) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        messages: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      })
    }
    
    return this.conversations.get(sessionId)
  }

  /**
   * Update conversation history
   * @param {string} sessionId - Session ID
   * @param {string} userMessage - User's message
   * @param {string} aiResponse - AI response
   */
  updateConversation(sessionId, userMessage, aiResponse) {
    const conversation = this.getConversation(sessionId)
    
    // Add user message
    conversation.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    })
    
    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    })
    
    // Keep only recent messages
    if (conversation.messages.length > this.config.conversationHistory * 2) {
      conversation.messages = conversation.messages.slice(-this.config.conversationHistory * 2)
    }
    
    conversation.lastActivity = new Date().toISOString()
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Conversation history
   */
  getConversationHistory(sessionId) {
    const conversation = this.getConversation(sessionId)
    return {
      sessionId,
      messages: conversation.messages,
      messageCount: conversation.messages.length,
      createdAt: conversation.createdAt,
      lastActivity: conversation.lastActivity
    }
  }

  /**
   * Clear conversation history for a session
   * @param {string} sessionId - Session ID
   * @returns {Object} Clear result
   */
  clearConversation(sessionId) {
    if (this.conversations.has(sessionId)) {
      this.conversations.delete(sessionId)
      return {
        success: true,
        sessionId,
        clearedAt: new Date().toISOString()
      }
    }
    
    return {
      success: false,
      sessionId,
      error: 'Session not found'
    }
  }

  /**
   * Search documents with enhanced context
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Enhanced search results
   */
  async searchDocuments(query, options = {}) {
    try {
      const searchResults = await this.vectorService.searchDocuments(
        query,
        options.limit || this.config.maxSearchResults,
        options
      )
      
      // Enhance results with additional context
      const enhancedResults = searchResults.map(result => ({
        ...result,
        relevanceCategory: this.categorizeRelevance(result.score),
        contextSnippet: this.extractContextSnippet(result.text),
        documentType: this.inferDocumentType(result.documentName)
      }))
      
      return enhancedResults
    } catch (error) {
      console.error('Error searching documents:', error)
      throw error
    }
  }

  /**
   * Categorize relevance score
   * @param {number} score - Relevance score
   * @returns {string} Relevance category
   */
  categorizeRelevance(score) {
    if (score >= 0.8) return 'zeer relevant'
    if (score >= 0.6) return 'relevant'
    if (score >= 0.4) return 'mogelijk relevant'
    return 'minder relevant'
  }

  /**
   * Extract context snippet from text
   * @param {string} text - Full text
   * @returns {string} Context snippet
   */
  extractContextSnippet(text) {
    if (!text || text.length <= 200) return text
    
    // Find sentence boundaries near the middle
    const midPoint = Math.floor(text.length / 2)
    const start = Math.max(0, text.lastIndexOf('.', midPoint - 50))
    const end = Math.min(text.length, text.indexOf('.', midPoint + 50))
    
    if (start > 0 && end > start) {
      return text.substring(start + 1, end + 1).trim()
    }
    
    return text.substring(0, 200) + '...'
  }

  /**
   * Infer document type from document name
   * @param {string} documentName - Document name
   * @returns {string} Document type
   */
  inferDocumentType(documentName) {
    if (!documentName) return 'onbekend'
    
    const name = documentName.toLowerCase()
    
    if (name.includes('hoge raad')) return 'hoge raad'
    if (name.includes('gerechtshof')) return 'gerechtshof'
    if (name.includes('rechtbank')) return 'rechtbank'
    if (name.includes('kantonrechter')) return 'kantonrechter'
    if (name.includes('uitspraak')) return 'uitspraak'
    if (name.includes('vonnis')) return 'vonnis'
    if (name.includes('arrest')) return 'arrest'
    
    return 'juridisch document'
  }

  /**
   * Get chat statistics
   * @returns {Object} Chat statistics
   */
  getChatStats() {
    const sessions = Array.from(this.conversations.values())
    const totalMessages = sessions.reduce((sum, conv) => sum + conv.messages.length, 0)
    const activeSessions = sessions.filter(conv => {
      const lastActivity = new Date(conv.lastActivity)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return lastActivity > oneHourAgo
    }).length
    
    return {
      totalSessions: sessions.length,
      activeSessions,
      totalMessages,
      averageMessagesPerSession: sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0,
      oldestSession: sessions.length > 0 ? Math.min(...sessions.map(s => new Date(s.createdAt))) : null,
      newestSession: sessions.length > 0 ? Math.max(...sessions.map(s => new Date(s.createdAt))) : null
    }
  }

  /**
   * Process batch queries (for testing or bulk operations)
   * @param {Array} queries - Array of queries
   * @param {Object} options - Batch options
   * @returns {Promise<Array>} Batch results
   */
  async processBatchQueries(queries, options = {}) {
    try {
      const results = []
      
      for (const query of queries) {
        const sessionId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        try {
          const result = await this.processMessage(sessionId, query, options)
          results.push({
            query,
            result,
            success: true
          })
        } catch (error) {
          results.push({
            query,
            error: error.message,
            success: false
          })
        }
        
        // Small delay between batch queries
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      return results
    } catch (error) {
      console.error('Error processing batch queries:', error)
      throw error
    }
  }
} 