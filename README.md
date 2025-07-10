# RechtSpraak Archives RAG Assistant

A web-based RAG (Retrieval-Augmented Generation) application that creates an intelligent chatbot assistant for Dutch legal case law documents.

## Features

- **Document Management**: Add legal documents via Google Drive links
- **Intelligent Processing**: Automatic document vectorization using vectorize.io
- **Legal Assistant**: AI-powered chatbot with Dutch legal context awareness
- **Batch Processing**: Efficient document processing for cost optimization
- **Modern UI**: Clean, responsive interface built with React

## Tech Stack

### Frontend
- React 18+ with functional components
- Vite for development and building
- Axios for API communication
- React Router for navigation

### Backend
- Node.js 18+ with Express.js
- Google Drive API integration
- vectorize.io for vector database
- OpenAI for AI responses

## Project Structure

```
rechtspraak1/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # Express routes
│   │   └── utils/           # Utility functions
│   └── package.json
├── memory-bank/             # Project documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ LTS
- npm or yarn
- Google Drive API credentials
- vectorize.io API key
- OpenAI API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rechtspraak1
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Environment Configuration**
   
   Create `backend/.env` file with:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # vectorize.io Configuration
   VECTORIZE_API_KEY=your_vectorize_api_key_here
   VECTORIZE_API_URL=https://api.vectorize.io/v1

   # Google Drive API Configuration
   GOOGLE_DRIVE_API_KEY=your_google_drive_api_key_here
   GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id_here
   GOOGLE_DRIVE_CLIENT_SECRET=your_google_drive_client_secret_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-3.5-turbo
   ```

### Development

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Documents
- `POST /api/documents` - Add document from Google Drive link
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/chat` - Process chat message
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### Health Check
- `GET /health` - Server health status

## Usage

1. **Add Documents**: Navigate to the Documents page and paste Google Drive links
2. **Wait for Processing**: Documents will be automatically processed and vectorized
3. **Start Chatting**: Use the Chat page to ask questions about your legal documents
4. **Get Answers**: Receive contextually relevant answers based on your document collection

## Development Status

### Phase 1: Foundation Setup ✅
- [x] Project structure created
- [x] React frontend with routing
- [x] Express.js backend with API routes
- [x] Basic UI components and styling
- [x] Environment configuration

### Phase 2: Core Features (Next)
- [ ] Google Drive integration
- [ ] vectorize.io integration
- [ ] Document processing pipeline
- [ ] PDF text extraction

### Phase 3: RAG Implementation
- [ ] Vector search functionality
- [ ] AI response generation
- [ ] Legal context integration
- [ ] Chat interface completion

### Phase 4: Polish & Testing
- [ ] Error handling improvement
- [ ] Performance optimization
- [ ] Testing implementation
- [ ] Documentation completion

## API Configuration

### Google Drive API
1. Create a project in Google Cloud Console
2. Enable Google Drive API
3. Create credentials (API key or OAuth 2.0)
4. Add credentials to environment variables

### vectorize.io
1. Sign up for vectorize.io account
2. Get API key from dashboard
3. Add API key to environment variables

### OpenAI (Optional)
1. Sign up for OpenAI account
2. Get API key from dashboard
3. Add API key to environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please refer to the memory-bank documentation or create an issue in the repository. 