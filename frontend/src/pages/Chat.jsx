import { useState } from 'react'

function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Hello! I\'m your RechtSpraak legal assistant. I can help you find information in your legal documents. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // TODO: Implement API call to backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage }),
      })

      if (response.ok) {
        const result = await response.json()
        const assistantMessage = {
          id: messages.length + 2,
          type: 'assistant',
          content: result.response,
          timestamp: new Date(),
          sources: result.sources || []
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: messages.length + 2,
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Legal Assistant Chat</h1>
      <p className="page-subtitle">
        Ask questions about your legal documents and get contextual answers
      </p>
      
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources">
                    <small>Sources: {message.sources.join(', ')}</small>
                  </div>
                )}
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="message-text">
                  <span className="loading"></span>
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input">
          <input
            type="text"
            placeholder="Ask a question about your legal documents..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
      
      <div className="card">
        <h3>💡 Tips for Better Results</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Be specific about the legal topic or case you're interested in</li>
          <li>Ask about specific legal concepts, precedents, or rulings</li>
          <li>Use Dutch legal terminology when appropriate</li>
          <li>You can ask follow-up questions to dive deeper into topics</li>
        </ul>
      </div>
    </div>
  )
}

export default Chat 