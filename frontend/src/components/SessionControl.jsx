import { useState } from 'react'

function SessionControl({ sessionId, onNewSession, onClearHistory }) {
  const [isClearing, setIsClearing] = useState(false)

  const handleClearHistory = async () => {
    if (!confirm('Weet u zeker dat u de chatgeschiedenis wilt wissen?')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onClearHistory()
      } else {
        console.error('Failed to clear chat history')
      }
    } catch (error) {
      console.error('Error clearing chat history:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleNewSession = () => {
    if (confirm('Weet u zeker dat u een nieuwe chat sessie wilt starten?')) {
      onNewSession()
    }
  }

  return (
    <div className="session-control">
      <div className="session-info">
        <span className="session-id">Sessie: {sessionId ? sessionId.substring(8, 16) : 'Laden...'}</span>
        <span className="session-status">🟢 Actief</span>
      </div>
      <div className="session-actions">
        <button 
          className="btn btn-secondary btn-small"
          onClick={handleNewSession}
          disabled={!sessionId}
        >
          🔄 Nieuwe Sessie
        </button>
        <button 
          className="btn btn-danger btn-small"
          onClick={handleClearHistory}
          disabled={isClearing || !sessionId}
        >
          {isClearing ? '⏳ Wissen...' : '🗑️ Wis Geschiedenis'}
        </button>
      </div>
    </div>
  )
}

export default SessionControl 