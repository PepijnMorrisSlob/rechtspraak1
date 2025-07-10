import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="page">
      <h1 className="page-title">Welcome to RechtSpraak Archives</h1>
      <p className="page-subtitle">
        Your intelligent assistant for Dutch legal case law documents
      </p>
      
      <div className="grid grid-2">
        <div className="card">
          <h3>📄 Document Management</h3>
          <p>
            Add legal documents to your knowledge base by pasting Google Drive links. 
            Our system will automatically process and vectorize your documents for 
            intelligent search and retrieval.
          </p>
          <Link to="/documents" className="btn btn-primary">
            Manage Documents
          </Link>
        </div>
        
        <div className="card">
          <h3>💬 Legal Assistant</h3>
          <p>
            Chat with your legal documents using our AI-powered assistant. 
            Ask questions about case law, legal precedents, and get contextually 
            relevant answers from your document collection.
          </p>
          <Link to="/chat" className="btn btn-primary">
            Start Chat
          </Link>
        </div>
      </div>
      
      <div className="card">
        <h3>🚀 Getting Started</h3>
        <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
          <li>Go to the <Link to="/documents">Documents</Link> page</li>
          <li>Paste a Google Drive link to your legal documents</li>
          <li>Wait for the documents to be processed and vectorized</li>
          <li>Start chatting with your legal assistant on the <Link to="/chat">Chat</Link> page</li>
        </ol>
      </div>
      
      <div className="card">
        <h3>ℹ️ About</h3>
        <p>
          RechtSpraak Archives is a RAG (Retrieval-Augmented Generation) system 
          designed specifically for Dutch legal case law. It uses advanced vector 
          search technology to help you find relevant information quickly and 
          accurately from your legal document collection.
        </p>
      </div>
    </div>
  )
}

export default Home 