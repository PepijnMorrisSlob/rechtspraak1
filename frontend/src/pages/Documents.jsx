import { useState, useEffect } from 'react'

function Documents() {
  const [googleDriveLink, setGoogleDriveLink] = useState('')
  const [documents, setDocuments] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [processingStats, setProcessingStats] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!googleDriveLink.trim()) {
      setStatus('Please enter a Google Drive link')
      return
    }
    
    setIsProcessing(true)
    setStatus('Processing document...')
    
    try {
      // TODO: Implement API call to backend
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ googleDriveLink }),
      })
      
      if (response.ok) {
        const result = await response.json()
        setDocuments(prev => [...prev, result])
        setGoogleDriveLink('')
        setStatus('Document added successfully!')
      } else {
        setStatus('Error processing document')
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('Error processing document')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Document Management</h1>
      <p className="page-subtitle">
        Add legal documents to your knowledge base using Google Drive links
      </p>
      
      <div className="grid grid-2">
        <div className="card">
          <h3>Add New Document</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="googleDriveLink">Google Drive Link</label>
              <input
                type="url"
                id="googleDriveLink"
                placeholder="https://drive.google.com/file/d/..."
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading"></span>
                  Processing...
                </>
              ) : (
                'Add Document'
              )}
            </button>
          </form>
          {status && (
            <div className={`status ${status.includes('Error') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}
        </div>
        
        <div className="card">
          <h3>Instructions</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Make sure your Google Drive file is publicly accessible</li>
            <li>Supported formats: PDF, DOCX, TXT</li>
            <li>Documents will be processed in batches for efficiency</li>
            <li>Processing time depends on document size and complexity</li>
          </ul>
        </div>
      </div>
      
      <div className="card">
        <h3>Document Library</h3>
        {documents.length === 0 ? (
          <p>No documents added yet. Add your first document using the form above.</p>
        ) : (
          <div className="document-list">
            {documents.map((doc, index) => (
              <div key={index} className="document-item">
                <h4>{doc.name || `Document ${index + 1}`}</h4>
                <p>Status: {doc.status || 'Processing'}</p>
                <p>Added: {new Date(doc.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Documents 