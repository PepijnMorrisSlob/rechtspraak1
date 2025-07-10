import { useState, useEffect } from 'react'

function Documents() {
  const [googleDriveLink, setGoogleDriveLink] = useState('')
  const [documents, setDocuments] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [processingStats, setProcessingStats] = useState(null)

  // Load documents on component mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const result = await response.json()
        setDocuments(result.documents || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!googleDriveLink.trim()) {
      setStatus('Voer een Google Drive link in')
      return
    }
    
    setIsProcessing(true)
    setStatus('Document wordt verwerkt...')
    setProcessingStats(null)
    
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          googleDriveLink,
          options: {
            batchSize: 10
          }
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        setDocuments(prev => [...prev, result.document])
        setGoogleDriveLink('')
        setStatus('Document succesvol toegevoegd!')
        setProcessingStats(result.processingStats)
        
        // Reload documents to get updated status
        setTimeout(() => loadDocuments(), 1000)
      } else {
        const errorData = await response.json()
        setStatus(`Fout bij verwerken document: ${errorData.message || 'Onbekende fout'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setStatus('Fout bij verwerken document')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Weet u zeker dat u dit document wilt verwijderen?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        setStatus('Document succesvol verwijderd')
      } else {
        setStatus('Fout bij verwijderen document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      setStatus('Fout bij verwijderen document')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Documentbeheer</h1>
      <p className="page-subtitle">
        Voeg juridische documenten toe aan uw kennisbank met behulp van Google Drive links
      </p>
      
      <div className="grid grid-2">
        <div className="card">
          <h3>Nieuw Document Toevoegen</h3>
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
              disabled={isProcessing || !googleDriveLink.trim()}
            >
              {isProcessing ? (
                <>
                  <span className="loading"></span>
                  Verwerken...
                </>
              ) : (
                'Document Toevoegen'
              )}
            </button>
          </form>
          {status && (
            <div className={`status ${status.includes('Fout') ? 'error' : 'success'}`}>
              {status}
            </div>
          )}
          
          {processingStats && (
            <div className="processing-stats">
              <h4>📊 Verwerkingsstatistieken</h4>
              <p>Verwerkte chunks: {processingStats.chunksProcessed}</p>
              <p>Vector embeddings: {processingStats.vectorsCreated}</p>
              <p>Verwerkingstijd: {processingStats.processingTime}ms</p>
            </div>
          )}
        </div>
        
        <div className="card">
          <h3>Instructies</h3>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Zorg ervoor dat uw Google Drive bestand publiek toegankelijk is</li>
            <li>Ondersteunde formaten: PDF, DOCX, TXT</li>
            <li>Documenten worden in batches verwerkt voor efficiëntie</li>
            <li>Verwerkingstijd hangt af van documentgrootte en complexiteit</li>
            <li>Nederlandse juridische documenten worden het beste ondersteund</li>
          </ul>
        </div>
      </div>
      
      <div className="card">
        <h3>Documentbibliotheek</h3>
        {documents.length === 0 ? (
          <p>Nog geen documenten toegevoegd. Voeg uw eerste document toe met het formulier hierboven.</p>
        ) : (
          <div className="document-list">
            {documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <div className="document-header">
                  <h4>{doc.name || doc.fileName || 'Onbekend Document'}</h4>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="Document verwijderen"
                  >
                    🗑️
                  </button>
                </div>
                <div className="document-details">
                  <p><strong>Status:</strong> <span className={`status-badge ${doc.status}`}>{doc.status || 'Verwerking'}</span></p>
                  <p><strong>Type:</strong> {doc.documentType || 'Juridisch Document'}</p>
                  <p><strong>Toegevoegd:</strong> {new Date(doc.createdAt || Date.now()).toLocaleString('nl-NL')}</p>
                  {doc.processingStats && (
                    <p><strong>Chunks:</strong> {doc.processingStats.chunksProcessed} • <strong>Embeddings:</strong> {doc.processingStats.vectorsCreated}</p>
                  )}
                  {doc.metadata && (
                    <div className="document-metadata">
                      {doc.metadata.court && <span className="metadata-tag">📍 {doc.metadata.court}</span>}
                      {doc.metadata.caseNumber && <span className="metadata-tag">📄 {doc.metadata.caseNumber}</span>}
                      {doc.metadata.date && <span className="metadata-tag">📅 {doc.metadata.date}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Documents 