import { v4 as uuidv4 } from 'uuid'
import { VectorService } from './VectorService.js'
import { GoogleDriveService } from './GoogleDriveService.js'

export class DocumentService {
  constructor() {
    this.vectorService = new VectorService()
    this.googleDriveService = new GoogleDriveService()
    this.documents = new Map() // In-memory storage for now
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

      // Update status
      document.status = 'extracting'
      console.log(`Extracting text from document ${documentId}`)

      // Extract text content
      const textContent = await this.extractTextContent(fileData)
      document.content = textContent

      // Update status
      document.status = 'vectorizing'
      console.log(`Vectorizing document ${documentId}`)

      // Chunk and vectorize content
      const chunks = this.chunkText(textContent)
      document.chunks = chunks

      // Send to vector database
      await this.vectorService.addDocument(documentId, chunks)

      // Update status
      document.status = 'completed'
      document.completedAt = new Date().toISOString()
      console.log(`Document ${documentId} processing completed`)

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error)
      const document = this.documents.get(documentId)
      if (document) {
        document.status = 'error'
        document.error = error.message
        document.errorAt = new Date().toISOString()
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
   * Extract text content from file data
   * @param {Object} fileData - File data from Google Drive
   * @returns {Promise<string>} Extracted text
   */
  async extractTextContent(fileData) {
    try {
      // TODO: Implement text extraction based on file type
      // For now, return placeholder text
      return `This is placeholder text for document: ${fileData.name}. 
      In a real implementation, this would extract text from PDF, DOCX, or other formats.
      
      This document contains Dutch legal case law and should be processed with legal context awareness.
      
      File type: ${fileData.mimeType}
      File size: ${fileData.size} bytes
      Processing timestamp: ${new Date().toISOString()}`
    } catch (error) {
      console.error('Error extracting text content:', error)
      throw error
    }
  }

  /**
   * Chunk text into smaller segments for vectorization
   * @param {string} text - Text to chunk
   * @returns {Array<Object>} Array of text chunks
   */
  chunkText(text) {
    try {
      const chunkSize = 1000 // characters
      const overlap = 100 // characters
      const chunks = []

      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        const chunk = text.substring(i, i + chunkSize)
        chunks.push({
          id: uuidv4(),
          text: chunk,
          startIndex: i,
          endIndex: Math.min(i + chunkSize, text.length)
        })
      }

      return chunks
    } catch (error) {
      console.error('Error chunking text:', error)
      throw error
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