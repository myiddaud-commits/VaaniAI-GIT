import { supabase } from '../lib/supabase';

interface AIResponse {
  message: string;
  error?: string;
}

class AIService {
  private apiKey: string = '';
  private selectedModel: string = 'openrouter/sonoma-dusk-alpha';
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  constructor() {
    this.loadApiConfig();
  }

  private async loadApiConfig() {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('api_configs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const config = data[0];
        this.apiKey = config.openrouter_key || '';
        this.selectedModel = config.selected_model || 'openrouter/sonoma-dusk-alpha';
        console.log('Loaded API config from Supabase:', { 
          hasApiKey: !!this.apiKey, 
          model: this.selectedModel 
        });
      } else {
        console.log('No API config found in Supabase, using fallback');
        // Use fallback API key if no config in database
        this.apiKey = '';
        this.selectedModel = 'openrouter/sonoma-dusk-alpha';
      }
    } catch (error) {
      console.error('Error loading API config from Supabase:', error);
      this.apiKey = '';
      this.selectedModel = 'openrouter/sonoma-dusk-alpha';
    }
  }

  // Method to update API key dynamically
  public updateApiKey(newApiKey: string) {
    this.apiKey = newApiKey;
  }

  // Method to update selected model
  public updateSelectedModel(newModel: string) {
    this.selectedModel = newModel;
  }

  // Method to get current API configuration from Supabase
  public async getApiConfig() {
    try {
      const { data, error } = await supabase
        .from('api_configs')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error getting API config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting API config:', error);
      return null;
    }
  }

  async generateResponse(message: string, isGuest: boolean = false): Promise<AIResponse> {
    // Reload API config before each request to ensure we have the latest settings
    await this.loadApiConfig();
    
    // Check if API key is available
    if (!this.apiKey) {
      console.error('No OpenRouter API key configured');
      return {
        message: "🔑 API कॉन्फ़िगरेशन की समस्या है। कृपया एडमिन से संपर्क करें। 🛠️",
        error: 'No API key configured'
      };
    }
    
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
      const apiConfig = await this.getApiConfig();
      const maxTokens = apiConfig?.max_tokens || 500;
      const temperature = apiConfig?.temperature || 0.7;

      console.log('Making API request with:', {
        model: this.selectedModel,
        hasApiKey: !!this.apiKey,
        maxTokens,
        temperature
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VaaniAI Hindi Chatbot'
        },
        body: JSON.stringify({
          model: this.selectedModel,
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
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
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
        "🙏 क्षमा करें, AI सेवा में समस्या है। एडमिन पैनल में API कॉन्फ़िगरेशन चेक करें। 🔧",
        "⚠️ OpenRouter API key सेट नहीं है। कृपया एडमिन से संपर्क करें। 🔑",
        "🤖 API कनेक्शन की समस्या है। कृपया बाद में पुनः प्रयास करें। 🔄"
      ] : [
        "🙏 क्षमा करें, AI सेवा में समस्या है। एडमिन पैनल में API कॉन्फ़िगरेशन चेक करें। 🔧",
        "⚠️ OpenRouter API key सेट नहीं है। कृपया एडमिन से संपर्क करें। 🔑",
        "🤖 API कनेक्शन की समस्या है। कृपया बाद में पुनः प्रयास करें. 🔄"
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