import { supabase } from '../lib/supabase';

interface AIResponse {
  message: string;
  error?: string;
}

class AIService {
  private apiKey: string = '';
  private selectedModel: string = 'openrouter/sonoma-dusk-alpha';
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private useLocalStorage: boolean = true;

  constructor() {
    this.loadApiConfig();
  }

  private async loadApiConfig() {
    // Always use localStorage for fast local API access
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('vaaniai-api-config');
      if (saved) {
        const config = JSON.parse(saved);
        this.apiKey = config.openRouterKey || '';
        this.selectedModel = config.selectedModel || 'openrouter/sonoma-dusk-alpha';
        console.log('Loaded API config from localStorage:', { 
          hasApiKey: !!this.apiKey, 
          model: this.selectedModel 
        });
      } else {
        console.log('No API config found in localStorage - using default demo key');
        this.apiKey = '';
        this.selectedModel = 'openrouter/sonoma-dusk-alpha';
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.apiKey = '';
      this.selectedModel = 'openrouter/sonoma-dusk-alpha';
    }
  }

  private saveToLocalStorage() {
    try {
      const config = {
        openRouterKey: this.apiKey,
        selectedModel: this.selectedModel,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('vaaniai-api-config', JSON.stringify(config));
      console.log('Saved API config to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Method to update API key dynamically
  public updateApiKey(newApiKey: string) {
    this.apiKey = newApiKey;
    this.saveToLocalStorage();
  }

  // Method to update selected model
  public updateSelectedModel(newModel: string) {
    this.selectedModel = newModel;
    this.saveToLocalStorage();
  }

  // Method to get current API configuration from localStorage
  public getApiConfig() {
    return {
      openrouter_key: this.apiKey,
      selected_model: this.selectedModel,
      max_tokens: 500,
      temperature: 0.7
    };
  }

  async generateResponse(message: string, isGuest: boolean = false): Promise<AIResponse> {
    // Load API config from localStorage for fast access
    this.loadFromLocalStorage();
    
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
      const apiConfig = this.getApiConfig();
      const maxTokens = apiConfig.max_tokens || 500;
      const temperature = apiConfig.temperature || 0.7;

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

  // New method for image analysis
  async analyzeImage(imageBase64: string, userMessage: string = ''): Promise<AIResponse> {
    // Load API config from localStorage for fast access
    this.loadFromLocalStorage();
    
    // Check if API key is available
    if (!this.apiKey) {
      console.error('No OpenRouter API key configured');
      return {
        message: "🔑 API कॉन्फ़िगरेशन की समस्या है। कृपया एडमिन से संपर्क करें। 🛠️",
        error: 'No API key configured'
      };
    }
    
    try {
      const systemPrompt = `You are VaaniAI, a helpful AI assistant that can analyze images and respond in Hindi (Devanagari script). When analyzing images, provide detailed descriptions in Hindi.

CRITICAL RULES for Image Analysis:
1. ALWAYS respond in Hindi (Devanagari script)
2. Describe what you see in the image in detail
3. If user asks specific questions about the image, answer in Hindi
4. Be descriptive and helpful
5. Use appropriate emojis to enhance responses
6. If you can identify objects, people, text, or scenes, mention them in Hindi
7. If there's text in the image, try to read and translate it to Hindi if needed
8. Be respectful and appropriate in descriptions

Examples:
- "इस तस्वीर में मुझे एक सुंदर बगीचा दिख रहा है जिसमें रंग-बिरंगे फूल हैं। 🌸"
- "यह एक बिल्ली की तस्वीर है जो सो रही है। बहुत प्यारी लग रही है! 😺"
- "इस इमेज में कुछ टेक्स्ट लिखा है जो कहता है..."`;

      // Use a vision-capable model for image analysis
      const visionModel = 'openai/gpt-4o-mini'; // This model supports vision
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage || 'इस इमेज में क्या है? कृपया विस्तार से बताएं।'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ];

      console.log('Making vision API request with model:', visionModel);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'VaaniAI Hindi Chatbot - Image Analysis'
        },
        body: JSON.stringify({
          model: visionModel,
          messages: messages,
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vision API request failed:', response.status, errorText);
        throw new Error(`Vision API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return {
          message: data.choices[0].message.content.trim()
        };
      } else {
        throw new Error('Invalid response format from Vision API');
      }
    } catch (error) {
      console.error('Image Analysis Error:', error);
      
      return {
        message: "🖼️ क्षमा करें, इमेज का विश्लेषण करने में समस्या हुई। कृपया पुनः प्रयास करें। 🔄",
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