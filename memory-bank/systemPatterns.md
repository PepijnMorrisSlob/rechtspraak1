# System Patterns

## Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API    │    │  vectorize.io   │
│                 │◄──►│                  │◄──►│   Vector DB     │
│  - Chat UI      │    │  - Document      │    │  - Embeddings   │
│  - Drive Links  │    │    Processing    │    │  - Search API   │
│  - File Status  │    │  - Batch Jobs    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Google Drive   │
                       │      API         │
                       │  - File Download │
                       │  - Document      │
                       │    Extraction    │
                       └──────────────────┘
```

### Core Components

#### 1. Frontend (React)
- **Chat Interface**: Real-time conversation UI with legal context awareness
- **Document Manager**: Google Drive link input and processing status
- **Knowledge Base Viewer**: Overview of processed documents and system status

#### 2. Backend (Node.js)
- **API Gateway**: RESTful endpoints for frontend communication
- **Document Processor**: Google Drive integration and file extraction
- **Batch Manager**: Queue system for document vectorization
- **Chat Orchestrator**: RAG query processing and response generation

#### 3. External Services
- **vectorize.io**: Vector database for embeddings and semantic search
- **Google Drive API**: Document access and extraction
- **AI Service**: Context-aware response generation

## Key Design Patterns

### 1. RAG (Retrieval-Augmented Generation) Pattern
```
User Query → Vector Search → Document Retrieval → Context Injection → AI Response
```

**Implementation**:
- Query vectorization using vectorize.io default embeddings
- Semantic search across legal document corpus
- Context window management for legal terminology
- Response generation with legal domain awareness

### 2. Batch Processing Pattern
```
Drive Link → Document Queue → Batch Processor → Vector Storage → Status Update
```

**Implementation**:
- Asynchronous document processing to handle large legal files
- Queue management for multiple document batches
- Progress tracking and error handling
- Efficient vectorization to minimize API costs

### 3. Service Layer Pattern
```
Controllers → Services → External APIs
```

**Services**:
- **DocumentService**: Google Drive integration and file processing
- **VectorService**: vectorize.io API interactions
- **ChatService**: RAG query processing and response generation
- **BatchService**: Queue management and job processing

### 4. Repository Pattern
```
Services → Repositories → External Storage
```

**Repositories**:
- **VectorRepository**: vectorize.io vector operations
- **DocumentRepository**: File metadata and processing status
- **ChatRepository**: Conversation history and context management

## Component Relationships

### Data Flow
1. **Document Ingestion**:
   - Frontend → API → Google Drive → Document Parser → Batch Queue
   - Batch Queue → vectorize.io → Vector Storage → Status Update

2. **Chat Interaction**:
   - Frontend → API → Vector Search → Context Retrieval → AI Generation → Response

3. **Knowledge Base Management**:
   - Frontend → API → Vector DB → Document Metadata → Status Display

### Error Handling Patterns
- **Graceful Degradation**: System continues operating with partial functionality
- **Retry Logic**: Automatic retries for external API failures
- **User Feedback**: Clear error messages for document processing issues
- **Logging**: Comprehensive logging for debugging and monitoring

### Security Patterns
- **Input Validation**: Sanitize Google Drive links and user queries
- **Rate Limiting**: Prevent abuse of external APIs
- **Error Sanitization**: Don't expose internal system details
- **API Key Management**: Secure storage of vectorize.io credentials

## Scalability Considerations

### Performance Patterns
- **Lazy Loading**: Load documents and embeddings on demand
- **Caching**: Cache frequently accessed vector search results
- **Pagination**: Handle large document sets efficiently
- **Batch Optimization**: Process multiple documents in single API calls

### Maintainability Patterns
- **Modular Architecture**: Clear separation of concerns
- **Configuration Management**: Environment-based settings
- **Testing Strategy**: Unit tests for services, integration tests for APIs
- **Documentation**: Inline code documentation and API specifications 