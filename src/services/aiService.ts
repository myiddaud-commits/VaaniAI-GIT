interface AIResponse {
  message: string;
  error?: string;
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.loadApiConfig();
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  private loadApiConfig() {
    try {
      const savedConfig = localStorage.getItem('vaaniai-api-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.apiKey = config.openaiKey || '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';
      } else {
        // Default API key
        this.apiKey = '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';
      }
    } catch (error) {
      console.error('Error loading API config:', error);
      this.apiKey = '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';
    }
  }

  // Method to update API key dynamically
  public updateApiKey(newApiKey: string) {
    this.apiKey = newApiKey;
  }

  // Method to get current API configuration
  public getApiConfig() {
    try {
      const savedConfig = localStorage.getItem('vaaniai-api-config');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Error getting API config:', error);
    }
    return null;
  }
  async generateResponse(message: string, isGuest: boolean = false): Promise<AIResponse> {
    // Reload API config before each request to ensure we have the latest settings
    this.loadApiConfig();
    
    try {
      const systemPrompt = `You are VaaniAI, a helpful AI assistant that responds in Hindi (Devanagari script). You are designed to help users with various questions and tasks in Hindi language.

CRITICAL RULES:
1. ALWAYS respond in Hindi (Devanagari script) - Never translate user's Hindi to English
2. If user writes in Hindi/Hinglish, keep your response in Hindi
3. If user asks "kya hai" respond with "क्या है" explanation in Hindi
4. Be helpful, friendly, and conversational in Hindi
5. Use appropriate emojis to enhance responses
6. Keep responses concise but informative in Hindi
7. If asked about technical topics, explain in simple Hindi terms
8. Always maintain a respectful and professional tone
9. Do NOT translate or change the user's language - preserve their intent in Hindi

Examples:
- User: "kya hai" → You: "यह क्या है? कृपया अधिक जानकारी दें। 🤔"
- User: "hello" → You: "नमस्ते! मैं आपकी कैसे सहायता कर सकता हूँ? 😊"
- User: "AI kya hai" → You: "AI यानी आर्टिफिशियल इंटेलिजेंस एक तकनीक है जो मशीनों को इंसानों की तरह सोचने में मदद करती है। 🤖"`;

      // Get current API configuration for request parameters
      const apiConfig = this.getApiConfig();
      const maxTokens = apiConfig?.maxTokens || 500;
      const temperature = apiConfig?.temperature || 0.7;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VaaniAI Hindi Chatbot'
        },
        body: JSON.stringify({
          model: 'openrouter/sonoma-dusk-alpha',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: maxTokens,
          temperature: temperature,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          message: data.choices[0].message.content.trim()
        };
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback responses for different scenarios
      const fallbackResponses = isGuest ? [
        "🙏 क्षमा करें, अभी AI सेवा में कुछ समस्या है। कृपया बाद में पुनः प्रयास करें। 🔄",
        "⚠️ तकनीकी समस्या के कारण मैं अभी उत्तर नहीं दे सकता। जल्द ही ठीक हो जाएगा! 🛠️",
        "🤖 AI सेवा अस्थायी रूप से अनुपलब्ध है। कृपया थोड़ी देर बाद कोशिश करें। ⏰"
      ] : [
        "🙏 क्षमा करें, अभी AI सेवा में कुछ समस्या है। कृपया बाद में पुनः प्रयास करें। 🔄",
        "⚠️ तकनीकी समस्या के कारण मैं अभी उत्तर नहीं दे सकता। जल्द ही ठीक हो जाएगा! 🛠️",
        "🤖 AI सेवा अस्थायी रूप से अनुपलब्ध है। कृपया थोड़ी देर बाद कोशिश करें। ⏰"
      ];

      return {
        message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Method to test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse('नमस्ते', false);
      return !response.error;
    } catch (error) {
      return false;
    }
  }
}

export const aiService = new AIService();