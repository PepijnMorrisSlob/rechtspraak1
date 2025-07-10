# Technical Context

## Technology Stack

### Frontend
- **Framework**: React 18+ with functional components and hooks
- **State Management**: React Context API for global state
- **Styling**: CSS Modules or Tailwind CSS for component styling
- **HTTP Client**: Axios for API communication
- **UI Components**: Custom components with modern, clean design
- **Build Tool**: Vite for fast development and building

### Backend
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js for API server
- **Language**: JavaScript (ES6+) with async/await patterns
- **File Processing**: Multer for file handling, PDF parsing libraries
- **HTTP Client**: Axios for external API calls
- **Process Management**: PM2 for production deployment

### External Services
- **Vector Database**: vectorize.io API
  - Default embedding model
  - Batch processing capabilities
  - REST API integration
- **Google Drive API**: v3 for file access and download
- **AI Service**: OpenAI GPT or similar for chat responses

### Database & Storage
- **Vector Storage**: vectorize.io cloud service
- **Metadata Storage**: Local JSON files or SQLite for document metadata
- **File Storage**: Temporary local storage for document processing
- **Session Storage**: In-memory for single-user application

## Development Setup

### Prerequisites
- Node.js 18+ LTS
- npm or yarn package manager
- Google Drive API credentials
- vectorize.io API key
- Git for version control

### Environment Configuration
```env
# vectorize.io Configuration
VECTORIZE_API_KEY=your_vectorize_api_key
VECTORIZE_API_URL=https://api.vectorize.io/v1

# Google Drive API
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/callback

# Application Configuration
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key

# Legal Context Configuration
LEGAL_CONTEXT_PROMPT="You are an assistant for Dutch legal case law..."
```

### Project Structure
```
rechtspraak1/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service calls
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   ├── public/
│   └── package.json
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration files
│   └── package.json
├── docs/                     # Project documentation
├── scripts/                  # Build and deployment scripts
└── README.md
```

## Technical Constraints

### API Limitations
- **vectorize.io**: Rate limits and batch processing requirements
- **Google Drive**: File size limits and API quotas
- **OpenAI**: Token limits and rate limiting
- **CORS**: Cross-origin resource sharing configuration

### Performance Constraints
- **Document Size**: Large PDF files may require chunking
- **Embedding Generation**: Batch processing to manage costs
- **Memory Usage**: Efficient handling of large document sets
- **Response Time**: Acceptable latency for chat interactions

### Security Requirements
- **API Keys**: Secure storage and rotation
- **Input Validation**: Sanitize all user inputs
- **Error Handling**: Don't expose internal system details
- **File Validation**: Verify document types and sizes

## Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "react-router-dom": "^6.8.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.4.0",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "googleapis": "^126.0.0",
    "dotenv": "^16.3.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.5.0",
    "supertest": "^6.3.0"
  }
}
```

## Development Workflow

### Local Development
1. **Environment Setup**: Configure .env files with API keys
2. **Frontend Development**: React dev server with hot reload
3. **Backend Development**: Nodemon for automatic server restart
4. **API Testing**: Postman or Thunder Client for endpoint testing
5. **Integration Testing**: Full stack testing with real APIs

### Code Quality
- **Linting**: ESLint for code quality and consistency
- **Formatting**: Prettier for consistent code formatting
- **Testing**: Jest for unit tests, integration tests for APIs
- **Documentation**: JSDoc comments for complex functions

### Deployment Considerations
- **Environment Variables**: Secure management of API keys
- **Build Process**: Optimized production builds
- **Server Configuration**: Express.js production settings
- **Monitoring**: Basic logging and error tracking
- **Backup**: Regular backup of document metadata

## Integration Points

### vectorize.io API
- **Authentication**: API key-based authentication
- **Endpoints**: Document upload, vector search, batch operations
- **Error Handling**: Retry logic for network failures
- **Cost Management**: Batch processing to minimize API calls

### Google Drive API
- **Authentication**: OAuth 2.0 or service account
- **File Access**: Download files from shared links
- **File Types**: PDF, DOCX, TXT support
- **Error Handling**: Handle access denied and quota exceeded

### Legal Context Integration
- **Prompt Engineering**: Dutch legal terminology awareness
- **Document Structure**: Understanding legal document formats
- **Citation Handling**: Proper handling of legal citations
- **Terminology**: Legal vocabulary and concepts 