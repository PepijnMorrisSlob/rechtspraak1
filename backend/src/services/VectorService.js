import axios from 'axios'
import OpenAI from 'openai'

export class VectorService {
  constructor() {
    this.apiKey = process.env.VECTORIZE_API_KEY
    this.apiUrl = process.env.VECTORIZE_API_URL || 'https://api.vectorize.io/v1'
    this.indexName = process.env.VECTORIZE_INDEX_NAME || 'rechtspraak-legal-docs'
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 10
    
    // Initialize vector database client
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000, // 60 seconds for embedding operations
      maxRetries: 3
    })
    
    // Initialize OpenAI for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Embedding configuration
    this.embeddingConfig = {
      model: 'text-embedding-3-small', // Cost-effective embedding model
      dimensions: 1536, // Standard dimension for text-embedding-3-small
      encoding_format: 'float'
    }
    
    // Vector database configuration
    this.vectorConfig = {
      dimension: 1536,
      metric: 'cosine',
      podType: 'p1.x1'
    }
  }

  /**
   * Add document chunks to vector database
   * @param {string} documentId - Document ID
   * @param {Array} chunks - Array of text chunks
   * @returns {Promise<Object>} Upload result
   */
  async addDocument(documentId, chunks) {
    try {
      if (!this.apiKey || !this.openai) {
        console.warn('VECTORIZE_API_KEY or OPENAI_API_KEY not configured, using mock response')
        return this.mockAddDocument(documentId, chunks)
      }

      console.log(`Adding ${chunks.length} chunks to vector database for document ${documentId}`)

      // Generate embeddings for all chunks
      const embeddedChunks = await this.generateEmbeddings(chunks, documentId)
      
      // Prepare vectors for database insertion
      const vectors = embeddedChunks.map((chunk, index) => ({
        id: `${documentId}_${chunk.id}`,
        values: chunk.embedding,
        metadata: {
          documentId,
          chunkId: chunk.id,
          chunkIndex: index,
          text: chunk.text,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          length: chunk.length,
          processedAt: new Date().toISOString()
        }
      }))

      // Send to vector database in batches
      const results = []
      const batchSize = this.batchSize

      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize)
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`)

        const batchResult = await this.upsertVectors(batch)
        results.push(batchResult)
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < vectors.length) {
          await this.delay(100)
        }
      }

      return {
        success: true,
        documentId,
        chunksProcessed: chunks.length,
        vectorsCreated: vectors.length,
        batchResults: results,
        embeddingModel: this.embeddingConfig.model,
        processedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error adding document to vector database:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for text chunks
   * @param {Array} chunks - Array of text chunks
   * @param {string} documentId - Document ID for logging
   * @returns {Promise<Array>} Chunks with embeddings
   */
  async generateEmbeddings(chunks, documentId) {
    try {
      console.log(`Generating embeddings for ${chunks.length} chunks from document ${documentId}`)
      
      // Process in batches to avoid API limits
      const embeddingBatchSize = 100 // OpenAI limit
      const embeddedChunks = []
      
      for (let i = 0; i < chunks.length; i += embeddingBatchSize) {
        const batch = chunks.slice(i, i + embeddingBatchSize)
        const texts = batch.map(chunk => chunk.text)
        
        console.log(`Generating embeddings for batch ${Math.floor(i / embeddingBatchSize) + 1}/${Math.ceil(chunks.length / embeddingBatchSize)}`)
        
        const response = await this.openai.embeddings.create({
          model: this.embeddingConfig.model,
          input: texts,
          encoding_format: this.embeddingConfig.encoding_format
        })
        
        // Combine chunks with their embeddings
        for (let j = 0; j < batch.length; j++) {
          embeddedChunks.push({
            ...batch[j],
            embedding: response.data[j].embedding
          })
        }
        
        // Delay between batches to respect rate limits
        if (i + embeddingBatchSize < chunks.length) {
          await this.delay(200)
        }
      }
      
      console.log(`Generated ${embeddedChunks.length} embeddings`)
      return embeddedChunks
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error(`Embedding generation failed: ${error.message}`)
    }
  }

  /**
   * Upsert vectors to vector database
   * @param {Array} vectors - Array of vectors to upsert
   * @returns {Promise<Object>} Upsert result
   */
  async upsertVectors(vectors) {
    try {
      const response = await this.client.post(`/indexes/${this.indexName}/upsert`, {
        vectors: vectors
      })
      
      return {
        success: true,
        upsertedCount: vectors.length,
        response: response.data
      }
    } catch (error) {
      console.error('Error upserting vectors:', error)
      
      // Retry logic for common issues
      if (error.response?.status === 429) {
        console.log('Rate limit hit, retrying after delay...')
        await this.delay(1000)
        return this.upsertVectors(vectors)
      }
      
      throw error
    }
  }

  /**
   * Search documents in vector database
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchDocuments(query, limit = 5, options = {}) {
    try {
      if (!this.apiKey || !this.openai) {
        console.warn('VECTORIZE_API_KEY or OPENAI_API_KEY not configured, using mock response')
        return this.mockSearchDocuments(query, limit)
      }

      console.log(`Searching vector database for: "${query}"`)

      // Generate embedding for the search query
      const queryEmbedding = await this.generateQueryEmbedding(query)
      
      // Prepare search request
      const searchRequest = {
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        includeValues: false,
        ...options
      }

      // Add namespace if specified
      if (options.namespace) {
        searchRequest.namespace = options.namespace
      }

      // Add filter if specified (for metadata filtering)
      if (options.filter) {
        searchRequest.filter = options.filter
      }

      const response = await this.client.post(`/indexes/${this.indexName}/query`, searchRequest)

      // Transform response to our format
      const results = response.data.matches?.map(match => ({
        id: match.id,
        text: match.metadata?.text || '',
        score: match.score,
        documentId: match.metadata?.documentId,
        chunkId: match.metadata?.chunkId,
        chunkIndex: match.metadata?.chunkIndex,
        documentName: this.getDocumentName(match.metadata?.documentId),
        startIndex: match.metadata?.startIndex,
        endIndex: match.metadata?.endIndex,
        processedAt: match.metadata?.processedAt
      })) || []

      console.log(`Found ${results.length} results for query: "${query}"`)
      return results
    } catch (error) {
      console.error('Error searching vector database:', error)
      throw error
    }
  }

  /**
   * Generate embedding for search query
   * @param {string} query - Search query text
   * @returns {Promise<Array>} Query embedding vector
   */
  async generateQueryEmbedding(query) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingConfig.model,
        input: query,
        encoding_format: this.embeddingConfig.encoding_format
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating query embedding:', error)
      throw new Error(`Query embedding generation failed: ${error.message}`)
    }
  }

  /**
   * Get document name from document ID (for display purposes)
   * @param {string} documentId - Document ID
   * @returns {string} Display name
   */
  getDocumentName(documentId) {
    if (!documentId) return 'Unknown Document'
    
    // Extract meaningful name from document ID
    const parts = documentId.split('_')
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/([a-z])([A-Z])/g, '$1 $2')
    }
    
    return documentId
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

      // Get all vectors for this document first
      const vectors = await this.getDocumentVectors(documentId)
      
      if (vectors.length === 0) {
        console.log(`No vectors found for document ${documentId}`)
        return {
          success: true,
          documentId,
          deletedCount: 0,
          deletedAt: new Date().toISOString()
        }
      }

      // Delete vectors by IDs
      const vectorIds = vectors.map(v => v.id)
      const deleteResponse = await this.deleteVectors(vectorIds)

      return {
        success: true,
        documentId,
        deletedCount: vectorIds.length,
        deletedAt: new Date().toISOString(),
        deleteResponse
      }
    } catch (error) {
      console.error('Error deleting document from vector database:', error)
      throw error
    }
  }

  /**
   * Get all vectors for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Document vectors
   */
  async getDocumentVectors(documentId) {
    try {
      // Query vectors by document ID using metadata filter
      const response = await this.client.post(`/indexes/${this.indexName}/query`, {
        vector: new Array(this.vectorConfig.dimension).fill(0), // Dummy vector
        topK: 10000, // Large number to get all
        includeMetadata: true,
        includeValues: false,
        filter: {
          documentId: { $eq: documentId }
        }
      })

      return response.data.matches || []
    } catch (error) {
      console.error('Error getting document vectors:', error)
      return []
    }
  }

  /**
   * Delete vectors by IDs
   * @param {Array} vectorIds - Array of vector IDs to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteVectors(vectorIds) {
    try {
      const response = await this.client.post(`/indexes/${this.indexName}/delete`, {
        ids: vectorIds
      })

      return {
        success: true,
        deletedIds: vectorIds,
        response: response.data
      }
    } catch (error) {
      console.error('Error deleting vectors:', error)
      throw error
    }
  }

  /**
   * Initialize or create vector database index
   * @returns {Promise<Object>} Index creation result
   */
  async initializeIndex() {
    try {
      if (!this.apiKey) {
        console.warn('VECTORIZE_API_KEY not configured, skipping index initialization')
        return { success: false, reason: 'API key not configured' }
      }

      console.log(`Initializing vector database index: ${this.indexName}`)

      // Check if index exists
      try {
        const response = await this.client.get(`/indexes/${this.indexName}`)
        console.log(`Index ${this.indexName} already exists`)
        return { success: true, existed: true, index: response.data }
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error
        }
      }

      // Create index if it doesn't exist
      const createResponse = await this.client.post('/indexes', {
        name: this.indexName,
        dimension: this.vectorConfig.dimension,
        metric: this.vectorConfig.metric,
        pod_type: this.vectorConfig.podType
      })

      console.log(`Created vector database index: ${this.indexName}`)
      return { 
        success: true, 
        created: true, 
        index: createResponse.data 
      }
    } catch (error) {
      console.error('Error initializing vector database index:', error)
      throw error
    }
  }

  /**
   * Get index statistics
   * @returns {Promise<Object>} Index stats
   */
  async getIndexStats() {
    try {
      if (!this.apiKey) {
        return { success: false, reason: 'API key not configured' }
      }

      const response = await this.client.get(`/indexes/${this.indexName}/stats`)
      return {
        success: true,
        stats: response.data
      }
    } catch (error) {
      console.error('Error getting index stats:', error)
      throw error
    }
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
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
    
    // Generate more relevant mock results based on query content
    const mockResults = []
    
    // Generate contextual results based on query
    if (query.toLowerCase().includes('rechtspraak') || query.toLowerCase().includes('legal')) {
      mockResults.push({
        id: 'mock_rechtspraak_1',
        text: `Uitspraak van de Hoge Raad betreffende "${query}". Deze uitspraak behandelt de rechtspraak omtrent belangrijke aspecten van Nederlands recht. De zaak betreft een fundamentele interpretatie van wettelijke bepalingen en jurisprudentie. In dit geval wordt specifiek ingegaan op de toepassing van relevante artikelen uit het Burgerlijk Wetboek en de procedurele aspecten van de rechtspraak.`,
        score: 0.92,
        documentId: 'mock_doc_rechtspraak_1',
        chunkId: 'mock_chunk_1',
        documentName: 'Hoge Raad Uitspraak 2023-001'
      })
    }
    
    if (query.toLowerCase().includes('contract') || query.toLowerCase().includes('overeenkomst')) {
      mockResults.push({
        id: 'mock_contract_1',
        text: `Rechtbank uitspraak betreffende contractrecht en "${query}". Deze zaak behandelt de juridische aspecten van overeenkomsten en de gevolgen van contractuele verplichtingen. Het gaat om een geschil waarbij partijen verschillende interpretaties hadden van contractuele bepalingen. De rechtbank oordeelt over de geldigheid en uitvoerbaarheid van de overeenkomst.`,
        score: 0.88,
        documentId: 'mock_doc_contract_1',
        chunkId: 'mock_chunk_2',
        documentName: 'Rechtbank Uitspraak Contractrecht 2023-045'
      })
    }
    
    // Add generic legal results
    mockResults.push({
      id: 'mock_general_1',
      text: `Gerechtshof arrest aangaande "${query}". In deze zaak wordt uitgebreid ingegaan op de juridische aspecten en de toepassing van Nederlands recht. Het hof overweegt de verschillende rechtsargumenten en komt tot een gemotiveerde beslissing. De uitspraak vormt een belangrijke bijdrage aan de Nederlandse jurisprudentie.`,
      score: 0.75,
      documentId: 'mock_doc_general_1',
      chunkId: 'mock_chunk_3',
      documentName: 'Gerechtshof Arrest 2023-078'
    })
    
    mockResults.push({
      id: 'mock_general_2',
      text: `Kantonrechter vonnis betreffende "${query}". Deze uitspraak behandelt een civielrechtelijke geschil waarin relevante aspecten van Nederlands recht aan de orde komen. De kantonrechter weegt de belangen van partijen af en past de relevante wetgeving toe. Het vonnis bevat belangrijke overwegingen voor soortgelijke gevallen.`,
      score: 0.68,
      documentId: 'mock_doc_general_2',
      chunkId: 'mock_chunk_4',
      documentName: 'Kantonrechter Vonnis 2023-112'
    })

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