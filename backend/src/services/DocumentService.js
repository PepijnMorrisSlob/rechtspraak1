import { v4 as uuidv4 } from 'uuid'
import { VectorService } from './VectorService.js'
import { GoogleDriveService } from './GoogleDriveService.js'
import { DocumentProcessor } from './DocumentProcessor.js'

export class DocumentService {
  constructor() {
    this.vectorService = new VectorService()
    this.googleDriveService = new GoogleDriveService()
    this.documentProcessor = new DocumentProcessor()
    this.documents = new Map() // In-memory storage for now
    
    // Start cleanup interval for old temp files
    this.startCleanupInterval()
  }

  /**
   * Start periodic cleanup of old temporary files
   */
  startCleanupInterval() {
    // Clean up old temp files every 30 minutes
    setInterval(() => {
      this.googleDriveService.cleanupOldTempFiles()
    }, 30 * 60 * 1000)
  }

  /**
   * Process a Google Drive link and add document to knowledge base
   * @param {string} googleDriveLink - The Google Drive link
   * @returns {Promise<Object>} Processing result
   */
  async processGoogleDriveLink(googleDriveLink) {
    try {
      const documentId = uuidv4()
      console.log(`Processing document ${documentId} from ${googleDriveLink}`)

      // Extract file ID from Google Drive link
      const fileId = this.extractFileIdFromLink(googleDriveLink)
      if (!fileId) {
        throw new Error('Invalid Google Drive link format')
      }

      // Create document record
      const document = {
        id: documentId,
        fileId,
        googleDriveLink,
        status: 'processing',
        createdAt: new Date().toISOString(),
        name: `Document ${documentId.substring(0, 8)}`,
        type: 'unknown',
        size: 0,
        chunks: []
      }

      this.documents.set(documentId, document)

      // Start background processing
      this.processDocumentBackground(documentId)

      return {
        documentId,
        status: 'processing'
      }
    } catch (error) {
      console.error('Error in processGoogleDriveLink:', error)
      throw error
    }
  }

  /**
   * Background processing of document
   * @param {string} documentId - Document ID
   */
  async processDocumentBackground(documentId) {
    let tempFilePath = null
    
    try {
      const document = this.documents.get(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Update status
      document.status = 'downloading'
      console.log(`Downloading document ${documentId}`)

      // Download file from Google Drive
      const fileData = await this.googleDriveService.downloadFile(document.fileId)
      document.name = fileData.name
      document.type = fileData.mimeType
      document.size = fileData.size
      document.webViewLink = fileData.webViewLink
      tempFilePath = fileData.filePath

      // Update status
      document.status = 'extracting'
      console.log(`Extracting text from document ${documentId}`)

      // Extract text content using DocumentProcessor
      const textContent = await this.documentProcessor.extractText(fileData.filePath, fileData.mimeType)
      document.content = textContent

      // Extract metadata
      const metadata = this.documentProcessor.extractMetadata(textContent)
      document.metadata = metadata

      // Update status
      document.status = 'chunking'
      console.log(`Chunking document ${documentId}`)

      // Chunk text content
      const chunks = this.documentProcessor.chunkText(textContent)
      document.chunks = chunks
      document.chunkCount = chunks.length

      // Update status
      document.status = 'vectorizing'
      console.log(`Vectorizing document ${documentId}`)

      // Send to vector database
      const vectorResult = await this.vectorService.addDocument(documentId, chunks)
      document.vectorResult = vectorResult

      // Update status
      document.status = 'completed'
      document.completedAt = new Date().toISOString()
      console.log(`Document ${documentId} processing completed: ${chunks.length} chunks, ${textContent.length} characters`)

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error)
      const document = this.documents.get(documentId)
      if (document) {
        document.status = 'error'
        document.error = error.message
        document.errorAt = new Date().toISOString()
      }
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        await this.googleDriveService.cleanupTempFile(tempFilePath)
      }
    }
  }

  /**
   * Extract file ID from Google Drive link
   * @param {string} link - Google Drive link
   * @returns {string|null} File ID or null if invalid
   */
  extractFileIdFromLink(link) {
    try {
      // Handle different Google Drive link formats
      const patterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
      ]

      for (const pattern of patterns) {
        const match = link.match(pattern)
        if (match) {
          return match[1]
        }
      }

      return null
    } catch (error) {
      console.error('Error extracting file ID:', error)
      return null
    }
  }



  /**
   * List all documents
   * @returns {Promise<Array>} Array of documents
   */
  async listDocuments() {
    try {
      return Array.from(this.documents.values())
    } catch (error) {
      console.error('Error listing documents:', error)
      throw error
    }
  }

  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async getDocument(id) {
    try {
      return this.documents.get(id) || null
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  }

  /**
   * Delete document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteDocument(id) {
    try {
      const document = this.documents.get(id)
      if (!document) {
        return false
      }

      // Remove from vector database
      await this.vectorService.deleteDocument(id)

      // Remove from local storage
      this.documents.delete(id)

      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
} 