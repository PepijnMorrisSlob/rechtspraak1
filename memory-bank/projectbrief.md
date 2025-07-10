# RechtSpraak Archives RAG Assistant

## Project Overview
A web-based RAG (Retrieval-Augmented Generation) application that creates an intelligent chatbot assistant for Dutch legal case law documents (RechtSpraak Archives).

## Core Requirements

### Primary Goals
1. **Document Ingestion**: Accept Google Drive links to legal documents and process them into a vectorized knowledge base
2. **Vector Database**: Use vectorize.io API for document vectorization and retrieval
3. **Intelligent Assistant**: Provide a chatbot interface that can answer questions about the legal documents with legal context awareness
4. **Batch Processing**: Handle document vectorization in batches for efficiency

### Key Features
- **Google Drive Integration**: Users paste Google Drive links directly into the web interface
- **Document Processing**: Extract and vectorize legal case law documents
- **Legal Context Awareness**: AI assistant understands legal document structure and terminology
- **Conversational Interface**: Clean, intuitive chat interface for querying the knowledge base
- **Single User**: No authentication required - designed for personal/single-user use

### Technical Approach
- **Frontend**: React.js for modern, responsive user interface
- **Backend**: Node.js API server for document processing and chat orchestration
- **Vector Database**: vectorize.io API for embedding storage and semantic search
- **AI Integration**: Context-aware prompting for legal document understanding

### Success Criteria
- Users can successfully add documents via Google Drive links
- Documents are properly vectorized and searchable
- Chatbot provides accurate, contextually relevant answers about legal cases
- System handles batch processing efficiently
- Interface is intuitive and responsive

## Scope Boundaries
- **In Scope**: Document ingestion, vectorization, chat interface, legal context
- **Out of Scope**: Multi-user authentication, advanced access controls, real-time collaboration
- **Future Considerations**: User authentication, document permissions, advanced legal entity recognition 