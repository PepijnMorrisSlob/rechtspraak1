import axios from 'axios'

export class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY
    this.apiUrl = 'https://api.openai.com/v1'
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Generate AI response with legal context
   * @param {string} userMessage - User's question
   * @param {string} context - Context from vector search
   * @returns {Promise<string>} AI response
   */
  async generateResponse(userMessage, context) {
    try {
      if (!this.apiKey) {
        console.warn('OPENAI_API_KEY not configured, using mock response')
        return this.mockGenerateResponse(userMessage, context)
      }

      const systemPrompt = this.getLegalSystemPrompt()
      const userPrompt = this.buildUserPrompt(userMessage, context)

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      const aiResponse = response.data.choices[0].message.content
      return aiResponse
    } catch (error) {
      console.error('Error generating AI response:', error)
      throw error
    }
  }

  /**
   * Get system prompt for legal context
   * @returns {string} System prompt
   */
  getLegalSystemPrompt() {
    return `You are a knowledgeable legal assistant specializing in Dutch law and jurisprudence (RechtSpraak). 

Your expertise includes:
- Dutch legal terminology and concepts
- Legal case analysis and precedents
- Court decisions and their implications
- Legal document interpretation
- Dutch legal system structure

Guidelines for responses:
- Always provide accurate, contextual legal information
- Use appropriate Dutch legal terminology when relevant
- Cite specific document references when available
- Be precise and professional in your language
- If uncertain about specific legal details, acknowledge limitations
- Focus on helping users understand legal concepts and case law
- Maintain objectivity and avoid giving specific legal advice

When answering questions:
1. Analyze the provided context carefully
2. Extract relevant legal information
3. Provide clear, structured explanations
4. Reference specific documents or cases when possible
5. Use Dutch legal terms appropriately`
  }

  /**
   * Build user prompt with context
   * @param {string} userMessage - User's question
   * @param {string} context - Context from documents
   * @returns {string} Complete user prompt
   */
  buildUserPrompt(userMessage, context) {
    return `Based on the following legal documents and context, please answer the user's question:

CONTEXT FROM LEGAL DOCUMENTS:
${context}

USER QUESTION:
${userMessage}

Please provide a comprehensive answer based on the legal documents provided. If the documents don't contain enough information to fully answer the question, please indicate what information is available and what might be missing.`
  }

  /**
   * Mock implementation for development without OpenAI API
   */
  mockGenerateResponse(userMessage, context) {
    console.log(`MOCK: Generating response for "${userMessage}"`)
    
    const hasContext = context && context.length > 50
    
    if (hasContext) {
      return `Based on the legal documents in your knowledge base, I can provide the following information regarding your question: "${userMessage}"

The relevant legal documents suggest that this topic involves important aspects of Dutch jurisprudence. While I cannot provide specific legal advice, I can share that the context indicates relevant precedents and legal principles that may apply to your inquiry.

Key points from the documents:
- This appears to be related to established legal principles in Dutch law
- The case law suggests specific procedural or substantive considerations
- There are relevant precedents that may inform understanding of this topic

Please note: This is a mock response as the AI service is not fully configured. In a real implementation, this would provide detailed legal analysis based on your specific documents.

Would you like me to elaborate on any particular aspect of this topic?`
    } else {
      return `I understand you're asking about: "${userMessage}"

However, I don't currently have relevant legal documents in the knowledge base to provide a comprehensive answer. To help you better, I would need access to relevant Dutch legal case law and documents related to your question.

This is a mock response as the AI service is not fully configured. In a real implementation, I would:
1. Search through your vectorized legal documents
2. Find relevant case law and precedents
3. Provide detailed analysis based on Dutch legal principles
4. Cite specific sources from your document collection

Please add relevant legal documents to your knowledge base and try your question again.`
    }
  }
} 