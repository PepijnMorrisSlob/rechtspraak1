import axios from 'axios'

export class VectorService {
  constructor() {
    this.apiKey = process.env.VECTORIZE_API_KEY
    this.apiUrl = process.env.VECTORIZE_API_URL || 'https://api.vectorize.io/v1'
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Add document chunks to vector database
   * @param {string} documentId - Document ID
   * @param {Array} chunks - Array of text chunks
   * @returns {Promise<Object>} Upload result
   */
  async addDocument(documentId, chunks) {
    try {
      if (!this.apiKey) {
        console.warn('VECTORIZE_API_KEY not configured, using mock response')
        return this.mockAddDocument(documentId, chunks)
      }

      console.log(`Adding ${chunks.length} chunks to vector database for document ${documentId}`)

      // Prepare chunks for vectorization
      const vectorizeChunks = chunks.map(chunk => ({
        id: `${documentId}_${chunk.id}`,
        text: chunk.text,
        metadata: {
          documentId,
          chunkId: chunk.id,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex
        }
      }))

      // Send to vectorize.io in batches
      const batchSize = 100
      const results = []

      for (let i = 0; i < vectorizeChunks.length; i += batchSize) {
        const batch = vectorizeChunks.slice(i, i + batchSize)
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectorizeChunks.length / batchSize)}`)

        const response = await this.client.post('/documents', {
          documents: batch
        })

        results.push(response.data)
      }

      return {
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        batchResults: results
      }
    } catch (error) {
      console.error('Error adding document to vector database:', error)
      throw error
    }
  }

  /**
   * Search documents in vector database
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Search results
   */
  async searchDocuments(query, limit = 5) {
    try {
      if (!this.apiKey) {
        console.warn('VECTORIZE_API_KEY not configured, using mock response')
        return this.mockSearchDocuments(query, limit)
      }

      console.log(`Searching vector database for: "${query}"`)

      const response = await this.client.post('/search', {
        query: query,
        limit: limit,
        include_metadata: true
      })

      // Transform response to our format
      const results = response.data.results.map(result => ({
        id: result.id,
        text: result.text,
        score: result.score,
        documentId: result.metadata?.documentId,
        chunkId: result.metadata?.chunkId,
        documentName: result.metadata?.documentName
      }))

      return results
    } catch (error) {
      console.error('Error searching vector database:', error)
      throw error
    }
  }

  /**
   * Delete document from vector database
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteDocument(documentId) {
    try {
      if (!this.apiKey) {
        console.warn('VECTORIZE_API_KEY not configured, using mock response')
        return this.mockDeleteDocument(documentId)
      }

      console.log(`Deleting document ${documentId} from vector database`)

      const response = await this.client.delete(`/documents/${documentId}`)

      return {
        success: true,
        documentId,
        deletedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error deleting document from vector database:', error)
      throw error
    }
  }

  /**
   * Mock implementation for development without vectorize.io API
   */
  mockAddDocument(documentId, chunks) {
    console.log(`MOCK: Adding ${chunks.length} chunks for document ${documentId}`)
    return {
      success: true,
      documentId,
      chunksProcessed: chunks.length,
      note: 'Mock response - vectorize.io API not configured'
    }
  }

  mockSearchDocuments(query, limit) {
    console.log(`MOCK: Searching for "${query}" with limit ${limit}`)
    
    // Return mock results based on query
    const mockResults = [
      {
        id: 'mock_1',
        text: `This is a mock search result for query: "${query}". In a real implementation, this would contain relevant Dutch legal case law text that matches your search query about legal precedents and jurisprudence.`,
        score: 0.85,
        documentId: 'mock_doc_1',
        chunkId: 'mock_chunk_1',
        documentName: 'Mock Legal Document 1'
      },
      {
        id: 'mock_2',
        text: `Another mock result discussing legal concepts related to "${query}". This would contain actual legal text from Dutch court decisions and case law that provide context for your question.`,
        score: 0.72,
        documentId: 'mock_doc_2',
        chunkId: 'mock_chunk_2',
        documentName: 'Mock Legal Document 2'
      }
    ]

    return mockResults.slice(0, limit)
  }

  mockDeleteDocument(documentId) {
    console.log(`MOCK: Deleting document ${documentId}`)
    return {
      success: true,
      documentId,
      deletedAt: new Date().toISOString(),
      note: 'Mock response - vectorize.io API not configured'
    }
  }
} 