import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Documents from './pages/Documents'
import './App.css'

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/documents" element={<Documents />} />
        </Routes>
      </main>
    </div>
  )
}

export default App 