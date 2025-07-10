import fs from 'fs'
import path from 'path'
import pdfParse from 'pdf-parse'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class DocumentProcessor {
  constructor() {
    this.supportedTypes = {
      'application/pdf': this.extractFromPDF.bind(this),
      'text/plain': this.extractFromText.bind(this),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': this.extractFromDOCX.bind(this),
      'application/msword': this.extractFromDOC.bind(this),
      'application/rtf': this.extractFromRTF.bind(this)
    }
  }

  /**
   * Extract text from file based on MIME type
   * @param {string} filePath - Path to file
   * @param {string} mimeType - MIME type of file
   * @returns {Promise<string>} Extracted text
   */
  async extractText(filePath, mimeType) {
    try {
      console.log(`Extracting text from ${mimeType} file: ${filePath}`)

      if (!this.supportedTypes[mimeType]) {
        throw new Error(`Unsupported file type: ${mimeType}`)
      }

      const extractor = this.supportedTypes[mimeType]
      const text = await extractor(filePath)
      
      if (!text || text.trim().length === 0) {
        throw new Error('No text content found in document')
      }

      // Clean and normalize text
      const cleanedText = this.cleanText(text)
      
      console.log(`Extracted ${cleanedText.length} characters from document`)
      return cleanedText
    } catch (error) {
      console.error('Error extracting text:', error)
      throw error
    }
  }

  /**
   * Extract text from PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdfParse(dataBuffer)
      
      if (!data.text) {
        throw new Error('No text found in PDF document')
      }

      return data.text
    } catch (error) {
      console.error('Error extracting from PDF:', error)
      throw new Error(`PDF extraction failed: ${error.message}`)
    }
  }

  /**
   * Extract text from plain text file
   * @param {string} filePath - Path to text file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromText(filePath) {
    try {
      const text = fs.readFileSync(filePath, 'utf8')
      return text
    } catch (error) {
      console.error('Error extracting from text file:', error)
      throw new Error(`Text extraction failed: ${error.message}`)
    }
  }

  /**
   * Extract text from DOCX file
   * @param {string} filePath - Path to DOCX file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromDOCX(filePath) {
    try {
      // TODO: Implement DOCX extraction using mammoth or similar library
      // For now, return placeholder text
      console.warn('DOCX extraction not fully implemented, using placeholder')
      return `[DOCX Document - ${path.basename(filePath)}]
      
This is a placeholder for DOCX text extraction. In a full implementation, 
this would use libraries like mammoth to extract text from Word documents.

The document would contain Dutch legal case law text that would be properly 
extracted and processed for vectorization.

File: ${filePath}
Type: Microsoft Word Document
Processing timestamp: ${new Date().toISOString()}`
    } catch (error) {
      console.error('Error extracting from DOCX:', error)
      throw new Error(`DOCX extraction failed: ${error.message}`)
    }
  }

  /**
   * Extract text from DOC file
   * @param {string} filePath - Path to DOC file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromDOC(filePath) {
    try {
      // TODO: Implement DOC extraction using antiword or similar library
      // For now, return placeholder text
      console.warn('DOC extraction not fully implemented, using placeholder')
      return `[DOC Document - ${path.basename(filePath)}]
      
This is a placeholder for DOC text extraction. In a full implementation, 
this would use libraries like antiword to extract text from older Word documents.

The document would contain Dutch legal case law text that would be properly 
extracted and processed for vectorization.

File: ${filePath}
Type: Microsoft Word Document (Legacy)
Processing timestamp: ${new Date().toISOString()}`
    } catch (error) {
      console.error('Error extracting from DOC:', error)
      throw new Error(`DOC extraction failed: ${error.message}`)
    }
  }

  /**
   * Extract text from RTF file
   * @param {string} filePath - Path to RTF file
   * @returns {Promise<string>} Extracted text
   */
  async extractFromRTF(filePath) {
    try {
      // TODO: Implement RTF extraction using rtf-parser or similar library
      // For now, return placeholder text
      console.warn('RTF extraction not fully implemented, using placeholder')
      return `[RTF Document - ${path.basename(filePath)}]
      
This is a placeholder for RTF text extraction. In a full implementation, 
this would use libraries like rtf-parser to extract text from RTF documents.

The document would contain Dutch legal case law text that would be properly 
extracted and processed for vectorization.

File: ${filePath}
Type: Rich Text Format
Processing timestamp: ${new Date().toISOString()}`
    } catch (error) {
      console.error('Error extracting from RTF:', error)
      throw new Error(`RTF extraction failed: ${error.message}`)
    }
  }

  /**
   * Clean and normalize extracted text
   * @param {string} text - Raw extracted text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    try {
      // Remove excessive whitespace
      let cleaned = text.replace(/\s+/g, ' ')
      
      // Remove control characters
      cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      
      // Normalize line breaks
      cleaned = cleaned.replace(/\r\n/g, '\n')
      cleaned = cleaned.replace(/\r/g, '\n')
      
      // Remove excessive line breaks
      cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n')
      
      // Trim whitespace
      cleaned = cleaned.trim()
      
      return cleaned
    } catch (error) {
      console.error('Error cleaning text:', error)
      return text // Return original text if cleaning fails
    }
  }

  /**
   * Chunk text into smaller segments for processing
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Size of each chunk in characters
   * @param {number} overlap - Overlap between chunks in characters
   * @returns {Array<Object>} Array of text chunks
   */
  chunkText(text, chunkSize = 1000, overlap = 100) {
    try {
      const chunks = []
      let chunkIndex = 0
      
      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        const chunk = text.substring(i, i + chunkSize)
        
        if (chunk.trim().length > 0) {
          chunks.push({
            id: `chunk_${chunkIndex}`,
            text: chunk.trim(),
            startIndex: i,
            endIndex: Math.min(i + chunkSize, text.length),
            length: chunk.trim().length
          })
          chunkIndex++
        }
      }
      
      console.log(`Created ${chunks.length} chunks from ${text.length} characters`)
      return chunks
    } catch (error) {
      console.error('Error chunking text:', error)
      throw error
    }
  }

  /**
   * Extract metadata from document
   * @param {string} text - Document text
   * @returns {Object} Document metadata
   */
  extractMetadata(text) {
    try {
      const metadata = {
        characterCount: text.length,
        wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
        lineCount: text.split('\n').length,
        paragraphCount: text.split('\n\n').filter(p => p.trim().length > 0).length,
        language: this.detectLanguage(text),
        extractedAt: new Date().toISOString()
      }
      
      return metadata
    } catch (error) {
      console.error('Error extracting metadata:', error)
      return {
        characterCount: text.length,
        extractedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Simple language detection for Dutch legal documents
   * @param {string} text - Document text
   * @returns {string} Detected language
   */
  detectLanguage(text) {
    // Simple Dutch language detection based on common Dutch legal terms
    const dutchLegalTerms = [
      'rechtspraak', 'uitspraak', 'arrest', 'vonnis', 'beschikking',
      'hoge raad', 'gerechtshof', 'rechtbank', 'kantonrechter',
      'wet', 'artikel', 'lid', 'onder', 'wetboek', 'burgerlijk',
      'strafrecht', 'bestuursrecht', 'procesrecht'
    ]
    
    const lowerText = text.toLowerCase()
    const dutchTermCount = dutchLegalTerms.filter(term => lowerText.includes(term)).length
    
    if (dutchTermCount >= 3) {
      return 'nl' // Dutch
    }
    
    return 'unknown'
  }
} 