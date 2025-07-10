import express from 'express'
import { DocumentService } from '../services/DocumentService.js'

const router = express.Router()
const documentService = new DocumentService()

/**
 * POST /api/documents
 * Add a new document from Google Drive link
 */
router.post('/', async (req, res) => {
  try {
    const { googleDriveLink } = req.body

    if (!googleDriveLink) {
      return res.status(400).json({
        error: 'Google Drive link is required'
      })
    }

    // Validate Google Drive link format
    if (!googleDriveLink.includes('drive.google.com')) {
      return res.status(400).json({
        error: 'Invalid Google Drive link format'
      })
    }

    console.log('Processing Google Drive link:', googleDriveLink)

    // TODO: Implement document processing
    const result = await documentService.processGoogleDriveLink(googleDriveLink)

    res.json({
      success: true,
      message: 'Document processing started',
      documentId: result.documentId,
      status: 'processing',
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing document:', error)
    res.status(500).json({
      error: 'Failed to process document',
      message: error.message
    })
  }
})

/**
 * GET /api/documents
 * List all documents
 */
router.get('/', async (req, res) => {
  try {
    const documents = await documentService.listDocuments()
    res.json({
      success: true,
      documents
    })
  } catch (error) {
    console.error('Error listing documents:', error)
    res.status(500).json({
      error: 'Failed to list documents',
      message: error.message
    })
  }
})

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const document = await documentService.getDocument(id)
    
    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      })
    }

    res.json({
      success: true,
      document
    })
  } catch (error) {
    console.error('Error getting document:', error)
    res.status(500).json({
      error: 'Failed to get document',
      message: error.message
    })
  }
})

/**
 * DELETE /api/documents/:id
 * Delete document by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await documentService.deleteDocument(id)
    
    if (!result) {
      return res.status(404).json({
        error: 'Document not found'
      })
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting document:', error)
    res.status(500).json({
      error: 'Failed to delete document',
      message: error.message
    })
  }
})

export default router 