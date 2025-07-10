import { VectorService } from './VectorService.js'
import { AIService } from './AIService.js'

export class ChatService {
  constructor() {
    this.vectorService = new VectorService()
    this.aiService = new AIService()
    this.chatHistory = [] // In-memory storage for chat history
  }

  /**
   * Process a chat message using RAG
   * @param {string} message - User message
   * @returns {Promise<Object>} Response with answer and sources
   */
  async processMessage(message) {
    try {
      console.log('Processing chat message:', message)

      // Step 1: Vector search for relevant documents
      const searchResults = await this.vectorService.searchDocuments(message)
      console.log(`Found ${searchResults.length} relevant document chunks`)

      // Step 2: Prepare context from search results
      const context = this.prepareContext(searchResults)

      // Step 3: Generate AI response with legal context
      const response = await this.aiService.generateResponse(message, context)

      // Step 4: Extract sources from search results
      const sources = this.extractSources(searchResults)

      // Step 5: Store in chat history
      const chatEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userMessage: message,
        aiResponse: response,
        sources,
        context: context.substring(0, 500) // Store first 500 chars for reference
      }
      this.chatHistory.push(chatEntry)

      return {
        response,
        sources,
        contextUsed: searchResults.length > 0
      }
    } catch (error) {
      console.error('Error processing message:', error)
      throw error
    }
  }

  /**
   * Prepare context string from search results
   * @param {Array} searchResults - Search results from vector database
   * @returns {string} Formatted context string
   */
  prepareContext(searchResults) {
    try {
      if (!searchResults || searchResults.length === 0) {
        return 'No relevant documents found in the knowledge base.'
      }

      let context = 'Relevant legal document excerpts:\n\n'
      
      searchResults.forEach((result, index) => {
        context += `Document ${index + 1}:\n`
        context += `${result.text}\n`
        context += `(Relevance: ${result.score?.toFixed(2) || 'N/A'})\n\n`
      })

      return context
    } catch (error) {
      console.error('Error preparing context:', error)
      return 'Error preparing context from documents.'
    }
  }

  /**
   * Extract source information from search results
   * @param {Array} searchResults - Search results from vector database
   * @returns {Array} Array of source references
   */
  extractSources(searchResults) {
    try {
      if (!searchResults || searchResults.length === 0) {
        return []
      }

      return searchResults.map(result => ({
        documentId: result.documentId,
        chunkId: result.chunkId,
        score: result.score,
        documentName: result.documentName || `Document ${result.documentId?.substring(0, 8)}`
      }))
    } catch (error) {
      console.error('Error extracting sources:', error)
      return []
    }
  }

  /**
   * Get chat history
   * @returns {Promise<Array>} Array of chat entries
   */
  async getChatHistory() {
    try {
      return this.chatHistory
    } catch (error) {
      console.error('Error getting chat history:', error)
      throw error
    }
  }

  /**
   * Clear chat history
   * @returns {Promise<void>}
   */
  async clearChatHistory() {
    try {
      this.chatHistory = []
      console.log('Chat history cleared')
    } catch (error) {
      console.error('Error clearing chat history:', error)
      throw error
    }
  }

  /**
   * Get conversation context for follow-up questions
   * @param {number} lastNMessages - Number of last messages to include
   * @returns {string} Conversation context
   */
  getConversationContext(lastNMessages = 3) {
    try {
      if (this.chatHistory.length === 0) {
        return ''
      }

      const recentHistory = this.chatHistory.slice(-lastNMessages)
      let context = 'Previous conversation:\n\n'
      
      recentHistory.forEach((entry, index) => {
        context += `User: ${entry.userMessage}\n`
        context += `Assistant: ${entry.aiResponse}\n\n`
      })

      return context
    } catch (error) {
      console.error('Error getting conversation context:', error)
      return ''
    }
  }
} 