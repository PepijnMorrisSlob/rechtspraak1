import { google } from 'googleapis'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class GoogleDriveService {
  constructor() {
    this.apiKey = process.env.GOOGLE_DRIVE_API_KEY
    this.clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
    this.clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET
    
    // Initialize Google Drive API client
    if (this.apiKey) {
      this.drive = google.drive({ version: 'v3', auth: this.apiKey })
    }
    
    // Supported file types for legal documents
    this.supportedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain',
      'application/rtf'
    ]
    
    // Create temp directory for file processing
    this.tempDir = path.join(__dirname, '../../../temp')
    this.ensureTempDir()
  }
  
  /**
   * Ensure temp directory exists
   */
  ensureTempDir() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true })
        console.log('Created temp directory:', this.tempDir)
      }
    } catch (error) {
      console.error('Error creating temp directory:', error)
    }
  }

  /**
   * Download file from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Object>} File data
   */
  async downloadFile(fileId) {
    try {
      if (!this.apiKey) {
        console.warn('GOOGLE_DRIVE_API_KEY not configured, using mock response')
        return this.mockDownloadFile(fileId)
      }

      console.log(`Downloading file ${fileId} from Google Drive`)

      // Get file metadata
      const metadata = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,parents,createdTime,modifiedTime'
      })

      // Download file content
      const content = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      })

      return {
        id: metadata.data.id,
        name: metadata.data.name,
        mimeType: metadata.data.mimeType,
        size: metadata.data.size,
        content: content.data,
        createdTime: metadata.data.createdTime,
        modifiedTime: metadata.data.modifiedTime
      }
    } catch (error) {
      console.error('Error downloading file from Google Drive:', error)
      
      // Handle common errors
      if (error.code === 403) {
        throw new Error('Access denied. Please make sure the file is publicly accessible or check your API credentials.')
      } else if (error.code === 404) {
        throw new Error('File not found. Please check the Google Drive link.')
      } else {
        throw new Error(`Google Drive error: ${error.message}`)
      }
    }
  }

  /**
   * Get file metadata from Google Drive
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileId) {
    try {
      if (!this.apiKey) {
        console.warn('GOOGLE_DRIVE_API_KEY not configured, using mock response')
        return this.mockGetFileMetadata(fileId)
      }

      console.log(`Getting metadata for file ${fileId}`)

      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,mimeType,size,parents,createdTime,modifiedTime,webViewLink'
      })

      return response.data
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  /**
   * Check if file is accessible
   * @param {string} fileId - Google Drive file ID
   * @returns {Promise<boolean>} True if accessible
   */
  async isFileAccessible(fileId) {
    try {
      await this.getFileMetadata(fileId)
      return true
    } catch (error) {
      console.error(`File ${fileId} is not accessible:`, error.message)
      return false
    }
  }

  /**
   * Validate Google Drive link and extract file ID
   * @param {string} link - Google Drive link
   * @returns {Promise<Object>} Validation result
   */
  async validateGoogleDriveLink(link) {
    try {
      // Extract file ID from link
      const fileId = this.extractFileIdFromLink(link)
      if (!fileId) {
        return {
          valid: false,
          error: 'Invalid Google Drive link format'
        }
      }

      // Check if file is accessible
      const isAccessible = await this.isFileAccessible(fileId)
      if (!isAccessible) {
        return {
          valid: false,
          error: 'File is not accessible. Please check permissions.'
        }
      }

      // Get file metadata
      const metadata = await this.getFileMetadata(fileId)

      return {
        valid: true,
        fileId,
        metadata
      }
    } catch (error) {
      return {
        valid: false,
        error: error.message
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
   * Mock implementation for development without Google Drive API
   */
  mockDownloadFile(fileId) {
    console.log(`MOCK: Downloading file ${fileId}`)
    
    return {
      id: fileId,
      name: `Mock Legal Document ${fileId.substring(0, 8)}.pdf`,
      mimeType: 'application/pdf',
      size: 1024000, // 1MB
      content: Buffer.from('Mock PDF content for legal document'),
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString()
    }
  }

  mockGetFileMetadata(fileId) {
    console.log(`MOCK: Getting metadata for file ${fileId}`)
    
    return {
      id: fileId,
      name: `Mock Legal Document ${fileId.substring(0, 8)}.pdf`,
      mimeType: 'application/pdf',
      size: 1024000,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      webViewLink: `https://drive.google.com/file/d/${fileId}/view`
    }
  }
} 