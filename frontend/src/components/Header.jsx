import { Link, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            RechtSpraak Archives
          </div>
          <nav className="nav">
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={location.pathname === '/' ? 'active' : ''}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/documents" 
                  className={location.pathname === '/documents' ? 'active' : ''}
                >
                  Documents
                </Link>
              </li>
              <li>
                <Link 
                  to="/chat" 
                  className={location.pathname === '/chat' ? 'active' : ''}
                >
                  Chat
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header 