import { useState, useEffect, useRef } from 'react'
import SessionControl from '../components/SessionControl'

function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'system',
      content: 'Hallo! Ik ben uw RechtSpraak juridische assistent. Ik kan u helpen bij het vinden van informatie in uw juridische documenten. Waar kan ik u mee helpen?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [followUpQuestions, setFollowUpQuestions] = useState([])
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Generate session ID on component mount
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !sessionId) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setFollowUpQuestions([]) // Clear previous follow-up questions

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputMessage,
          sessionId: sessionId,
          options: {
            maxResults: 5
          }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: result.response,
          timestamp: new Date(),
          citations: result.citations || [],
          searchStats: result.searchStats,
          metadata: result.metadata
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Set follow-up questions if available
        if (result.followUpQuestions && result.followUpQuestions.length > 0) {
          setFollowUpQuestions(result.followUpQuestions)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'system',
        content: `Excuses, er is een fout opgetreden: ${error.message}. Probeer het opnieuw.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle follow-up question click
  const handleFollowUpQuestion = (question) => {
    setInputMessage(question)
    setFollowUpQuestions([])
  }

  // Handle new session
  const handleNewSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    setMessages([
      {
        id: 1,
        type: 'system',
        content: 'Hallo! Ik ben uw RechtSpraak juridische assistent. Ik kan u helpen bij het vinden van informatie in uw juridische documenten. Waar kan ik u mee helpen?',
        timestamp: new Date()
      }
    ])
    setFollowUpQuestions([])
  }

  // Handle clear history
  const handleClearHistory = () => {
    setMessages([
      {
        id: 1,
        type: 'system',
        content: 'Chatgeschiedenis gewist. Waar kan ik u mee helpen?',
        timestamp: new Date()
      }
    ])
    setFollowUpQuestions([])
  }

  return (
    <div className="page">
      <h1 className="page-title">Juridische Assistent Chat</h1>
      <p className="page-subtitle">
        Stel vragen over uw juridische documenten en krijg contextuele antwoorden
      </p>
      
      <SessionControl 
        sessionId={sessionId}
        onNewSession={handleNewSession}
        onClearHistory={handleClearHistory}
      />
      
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                
                {/* Display citations for assistant messages */}
                {message.citations && message.citations.length > 0 && (
                  <div className="message-citations">
                    <h4>📚 Bronnen:</h4>
                    {message.citations.map((citation) => (
                      <div key={citation.id} className="citation">
                        <div className="citation-header">
                          <span className="citation-name">{citation.documentName}</span>
                          <span className="citation-relevance">{citation.relevanceScore}% relevant</span>
                        </div>
                        <div className="citation-excerpt">"{citation.excerpt}"</div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Display search statistics for assistant messages */}
                {message.searchStats && (
                  <div className="message-stats">
                    <small>
                      💡 {message.searchStats.relevantResults} van {message.searchStats.totalResults} resultaten gebruikt
                      {message.metadata && (
                        <span> • Model: {message.metadata.model} • Turn: {message.metadata.conversationTurn}</span>
                      )}
                    </small>
                  </div>
                )}
                
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString('nl-NL')}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="message-text">
                  <span className="loading"></span>
                  Aan het analyseren van juridische documenten...
                </div>
              </div>
            </div>
          )}
          
          {/* Follow-up questions */}
          {followUpQuestions.length > 0 && (
            <div className="follow-up-questions">
              <h4>💭 Vervolgvragen:</h4>
              {followUpQuestions.map((question, index) => (
                <button
                  key={index}
                  className="follow-up-question"
                  onClick={() => handleFollowUpQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input">
          <input
            type="text"
            placeholder="Stel een vraag over uw juridische documenten..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading || !sessionId}
          />
          <button type="submit" className="btn btn-primary" disabled={isLoading || !sessionId || !inputMessage.trim()}>
            {isLoading ? 'Verwerken...' : 'Verzenden'}
          </button>
        </form>
      </div>
      
      <div className="card">
        <h3>💡 Tips voor betere resultaten</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Wees specifiek over het juridische onderwerp of de zaak waarin u geïnteresseerd bent</li>
          <li>Vraag naar specifieke juridische concepten, precedenten of uitspraken</li>
          <li>Gebruik Nederlandse juridische terminologie</li>
          <li>U kunt vervolgvragen stellen om dieper in onderwerpen te duiken</li>
          <li>Probeer concrete vragen zoals "Wat zijn de voorwaarden voor..." of "Hoe wordt... gedefinieerd?"</li>
        </ul>
      </div>
    </div>
  )
}

export default Chat 