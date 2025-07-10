import OpenAI from 'openai'

export class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // AI configuration
    this.config = {
      model: 'gpt-4o-mini', // Cost-effective model for chat
      temperature: 0.3, // Lower temperature for more consistent legal advice
      maxTokens: 1000,
      topP: 0.9
    }
    
    // System prompt for Dutch legal context
    this.systemPrompt = `Je bent een Nederlandse juridische assistent die specialiseert in het analyseren van rechtspraak en juridische documenten. Je taak is om gebruikers te helpen bij het begrijpen van Nederlandse wet- en regelgeving op basis van de beschikbare rechtspraak.

Belangrijke richtlijnen:
- Geef altijd antwoorden in het Nederlands
- Baseer je antwoorden op de verstrekte context uit de rechtspraak
- Verwijs naar specifieke uitspraken wanneer mogelijk
- Maak duidelijk wanneer informatie beperkt is of je geen definitief antwoord kunt geven
- Gebruik juridische terminologie correct en leg complexe concepten uit
- Bied praktische inzichten maar geef geen specifiek juridisch advies
- Verwijs gebruikers naar een advocaat voor specifieke juridische kwesties

Formatteer je antwoorden professioneel en gestructureerd met:
- Duidelijke hoofdpunten
- Citaten uit relevante uitspraken
- Bronverwijzingen naar documentnamen
- Praktische context waar relevant`
  }

  /**
   * Generate AI response based on user query and vector search results
   * @param {string} userQuery - User's question
   * @param {Array} searchResults - Vector search results
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} AI response
   */
  async generateResponse(userQuery, searchResults, options = {}) {
    try {
      if (!this.openai.apiKey) {
        return this.mockGenerateResponse(userQuery, searchResults)
      }

      console.log(`Generating AI response for query: "${userQuery}"`)
      console.log(`Using ${searchResults.length} search results as context`)

      // Prepare context from search results
      const context = this.prepareContext(searchResults)
      
      // Create user message with context
      const userMessage = this.createUserMessage(userQuery, context)
      
      // Generate response using OpenAI
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        top_p: this.config.topP
      })

      const aiResponse = response.choices[0].message.content
      
      // Prepare citations
      const citations = this.prepareCitations(searchResults)
      
      return {
        success: true,
        response: aiResponse,
        citations: citations,
        searchResultsCount: searchResults.length,
        model: this.config.model,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      throw new Error(`AI response generation failed: ${error.message}`)
    }
  }

  /**
   * Prepare context string from search results
   * @param {Array} searchResults - Vector search results
   * @returns {string} Formatted context
   */
  prepareContext(searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return "Geen relevante rechtspraak gevonden in de database."
    }

    const contextParts = searchResults.map((result, index) => {
      const documentName = result.documentName || 'Onbekend document'
      const relevanceScore = Math.round(result.score * 100)
      
      return `
BRON ${index + 1} (Relevantie: ${relevanceScore}%):
Document: ${documentName}
Uitspraak: ${result.text}
      `.trim()
    })

    return `
BESCHIKBARE RECHTSPRAAK:
${contextParts.join('\n\n')}

Gebruik deze uitspraken als basis voor je antwoord en verwijs naar de specifieke bronnen.
    `.trim()
  }

  /**
   * Create user message with query and context
   * @param {string} userQuery - User's question
   * @param {string} context - Prepared context
   * @returns {string} Complete user message
   */
  createUserMessage(userQuery, context) {
    return `
${context}

VRAAG VAN DE GEBRUIKER:
${userQuery}

Geef een uitgebreid en goed onderbouwd antwoord op basis van de beschikbare rechtspraak hierboven.
    `.trim()
  }

  /**
   * Prepare citations from search results
   * @param {Array} searchResults - Vector search results
   * @returns {Array} Formatted citations
   */
  prepareCitations(searchResults) {
    return searchResults.map((result, index) => ({
      id: index + 1,
      documentId: result.documentId,
      documentName: result.documentName || 'Onbekend document',
      relevanceScore: Math.round(result.score * 100),
      excerpt: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
      chunkId: result.chunkId,
      chunkIndex: result.chunkIndex
    }))
  }

  /**
   * Mock AI response for development without OpenAI API
   * @param {string} userQuery - User's question
   * @param {Array} searchResults - Vector search results
   * @returns {Object} Mock response
   */
  mockGenerateResponse(userQuery, searchResults) {
    console.log(`MOCK: Generating AI response for "${userQuery}"`)
    
    const hasResults = searchResults && searchResults.length > 0
    const citations = hasResults ? this.prepareCitations(searchResults) : []
    
    let mockResponse = `**Juridische Analyse: ${userQuery}**

Op basis van de beschikbare rechtspraak in onze database kunnen we het volgende opmerken:

${hasResults ? `
**Relevante Uitspraken:**
${searchResults.slice(0, 3).map((result, index) => `
${index + 1}. ${result.documentName || 'Rechtspraak'}
   - Relevantie: ${Math.round(result.score * 100)}%
   - Kernpunt: ${result.text.substring(0, 150)}...
`).join('')}

**Juridische Context:**
De gevonden rechtspraak toont aan dat Nederlandse rechters consistent oordelen over soortgelijke gevallen. De uitspraken bieden belangrijke inzichten in de interpretatie van relevante wetsartikelen.

**Praktische Implicaties:**
- Rechtspraak biedt precedent voor vergelijkbare situaties
- Verschillende instanties hebben coherente standpunten ingenomen
- Belangrijk om specifieke feiten en omstandigheden te overwegen

` : `
**Opmerking:**
Er werd geen specifieke rechtspraak gevonden die direct betrekking heeft op uw vraag. Dit kan betekenen dat:
- Het onderwerp nog niet vaak voor de rechter is gekomen
- De zoektermen mogelijk aangepast moeten worden
- Het een nieuw of zeer specifiek juridisch gebied betreft

`}

**Disclaimer:**
Deze informatie is gebaseerd op beschikbare rechtspraak en dient alleen ter informatie. Voor specifiek juridisch advies dient u contact op te nemen met een advocaat.

---
*Gebaseerd op ${searchResults.length} zoekresultaten | Gegenereerd op ${new Date().toLocaleString('nl-NL')}*`

    return {
      success: true,
      response: mockResponse,
      citations: citations,
      searchResultsCount: searchResults.length,
      model: 'mock-model',
      generatedAt: new Date().toISOString(),
      note: 'Mock response - OpenAI API not configured'
    }
  }

  /**
   * Generate follow-up questions based on the context
   * @param {string} userQuery - Original user query
   * @param {Array} searchResults - Vector search results
   * @returns {Promise<Array>} Suggested follow-up questions
   */
  async generateFollowUpQuestions(userQuery, searchResults) {
    try {
      if (!this.openai.apiKey) {
        return this.mockFollowUpQuestions(userQuery)
      }

      const context = this.prepareContext(searchResults)
      const prompt = `
Gebaseerd op de volgende vraag en rechtspraak context, genereer 3 relevante vervolgvragen die de gebruiker zou kunnen stellen:

Oorspronkelijke vraag: "${userQuery}"

${context}

Genereer 3 korte, specifieke vervolgvragen die logisch voortvloeien uit de context. Geef alleen de vragen terug, genummerd 1-3.
      `.trim()

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      })

      const followUpText = response.choices[0].message.content
      const questions = followUpText.split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())

      return questions
    } catch (error) {
      console.error('Error generating follow-up questions:', error)
      return this.mockFollowUpQuestions(userQuery)
    }
  }

  /**
   * Mock follow-up questions for development
   * @param {string} userQuery - Original user query
   * @returns {Array} Mock follow-up questions
   */
  mockFollowUpQuestions(userQuery) {
    const genericQuestions = [
      "Zijn er recente ontwikkelingen in de rechtspraak over dit onderwerp?",
      "Welke wetsartikelen zijn het meest relevant voor deze kwestie?",
      "Hoe oordeelt de Hoge Raad over soortgelijke gevallen?"
    ]

    return genericQuestions
  }
} 