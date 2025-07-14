// src/services/aiService.js - Complete file with Gemini 3 retries + Groq 2 retries

class OptimizedAIService {
  constructor() {
    this.providers = [
      {
        name: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        apiKey: process.env.REACT_APP_GEMINI_API_KEY,
        enabled: !!process.env.REACT_APP_GEMINI_API_KEY,
        free: true,
        limits: '60/min, 1500/day',
        priority: 1
      },
      {
        name: 'groq',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        apiKey: process.env.REACT_APP_GROQ_API_KEY,
        enabled: !!process.env.REACT_APP_GROQ_API_KEY,
        free: true,
        limits: '30/min, 14,400/day',
        priority: 2
      },
      {
        name: 'together',
        endpoint: 'https://api.together.xyz/v1/chat/completions',
        apiKey: process.env.REACT_APP_TOGETHER_API_KEY,
        enabled: !!process.env.REACT_APP_TOGETHER_API_KEY,
        free: '$5 credit',
        limits: '~5000 analyses',
        priority: 3
      },
      {
        name: 'perplexity',
        endpoint: 'https://api.perplexity.ai/chat/completions',
        apiKey: process.env.REACT_APP_PERPLEXITY_API_KEY,
        enabled: !!process.env.REACT_APP_PERPLEXITY_API_KEY,
        free: '$5/month',
        limits: 'Monthly credit',
        priority: 4
      }
    ];
    
    this.maxRetries = 3; // For Gemini
    this.groqMaxRetries = 2; // For Groq
    this.retryDelay = 1000; // Start with 1 second
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isRetryableError(error) {
    const retryableMessages = [
      'temporary error',
      'rate limit',
      'timeout',
      'network',
      'fetch',
      '503', '429', '500', '502', '504'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  // GEMINI - Primary provider with 3 retries
  async analyzeWithGemini(text, retryCount = 0) {
    const provider = this.providers.find(p => p.name === 'gemini');
    
    if (!provider.enabled) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `You are a relationship counselor AI. Analyze this relationship journal entry and determine if it contains green flags (positive, healthy behaviors) or red flags (concerning, unhealthy behaviors).

Text: "${text}"

Respond with a JSON object in this exact format:
{
  "flag": "green" | "red" | "neutral",
  "color": "green" | "red" | "neutral", 
  "icon": "✅" | "🚩" | "⚪",
  "title": "Brief title describing the analysis",
  "message": "Explanation of why this is flagged this way",
  "suggestions": ["Array of 2-3 helpful suggestions"],
  "confidence": 0.8
}

CRITICAL SAFETY RULES:
- ANY mention of physical violence, threats, or abuse = RED FLAG
- Look for: hitting, slapping, pushing, choking, throwing things, threats, controlling behavior
- Physical violence is NEVER acceptable and should always be flagged as red
- Be very careful about false positives - don't mark healthy love expressions as red flags`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    try {
      console.log(`🤖 Gemini attempt ${retryCount + 1}/${this.maxRetries + 1} (Primary Provider)`);
      
      const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Gemini API Error (${response.status}):`, errorText);
        
        // Check if it's a rate limit or temporary error
        if (response.status === 429 || response.status === 503 || response.status >= 500) {
          throw new Error(`Temporary error: ${response.status}`);
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini');
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log('🤖 Raw Gemini response:', responseText);

      // Try to extract JSON from the response
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!result.flag || !result.title || !result.message) {
        throw new Error('Invalid response structure');
      }

      console.log('✅ Gemini analysis successful (Primary)');
      return {
        ...result,
        provider: 'gemini',
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error(`❌ Gemini attempt ${retryCount + 1} failed:`, error.message);
      
      // If we haven't exceeded max retries and it's a retryable error, try again
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`⏳ Retrying Gemini in ${delay}ms... (${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return this.analyzeWithGemini(text, retryCount + 1);
      }
      
      console.warn(`💥 Gemini failed after ${this.maxRetries + 1} attempts, switching to Groq...`);
      throw error;
    }
  }

  // GROQ - Fast backup provider with 2 retries
  async analyzeWithGroq(text, retryCount = 0) {
    const provider = this.providers.find(p => p.name === 'groq');
    
    if (!provider.enabled) {
      throw new Error('Groq API key not configured');
    }

    const requestBody = {
      model: "llama3-8b-8192", // Fast Llama model
      messages: [{
        role: "system",
        content: "You are a relationship counselor AI. Analyze journal entries for relationship red flags (concerning behaviors) or green flags (healthy behaviors). Respond with valid JSON only. Physical violence, threats, controlling behavior = RED FLAG."
      }, {
        role: "user",
        content: `Analyze this relationship entry: "${text}"

Respond with JSON in this exact format:
{
  "flag": "green" | "red" | "neutral",
  "color": "green" | "red" | "neutral",
  "icon": "✅" | "🚩" | "⚪",
  "title": "Brief analysis title",
  "message": "Explanation of the analysis",
  "suggestions": ["helpful suggestion 1", "helpful suggestion 2"],
  "confidence": 0.8
}`
      }],
      temperature: 0.3,
      max_tokens: 500
    };

    try {
      console.log(`🚀 Groq attempt ${retryCount + 1}/${this.groqMaxRetries + 1} (Fast Backup)`);
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Groq API Error (${response.status}):`, errorText);
        
        // Check if it's a rate limit or temporary error
        if (response.status === 429 || response.status === 503 || response.status >= 500) {
          throw new Error(`Temporary error: ${response.status}`);
        }
        
        throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Invalid Groq response');
      }

      const result = JSON.parse(content);
      console.log('✅ Groq analysis successful (Fast Backup!)');
      
      return {
        ...result,
        provider: 'groq',
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error(`❌ Groq attempt ${retryCount + 1} failed:`, error.message);
      
      // If we haven't exceeded max retries (2) and it's a retryable error, try again
      if (retryCount < this.groqMaxRetries && this.isRetryableError(error)) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff: 1s, 2s
        console.log(`⏳ Retrying Groq in ${delay}ms... (${retryCount + 1}/${this.groqMaxRetries})`);
        await this.sleep(delay);
        return this.analyzeWithGroq(text, retryCount + 1);
      }
      
      console.warn(`💥 Groq failed after ${this.groqMaxRetries + 1} attempts, continuing to fallback chain...`);
      throw error;
    }
  }

  // Together AI - Additional fallback
  async analyzeWithTogether(text) {
    const provider = this.providers.find(p => p.name === 'together');
    
    if (!provider.enabled) {
      throw new Error('Together API key not configured');
    }

    const requestBody = {
      model: "meta-llama/Llama-2-7b-chat-hf",
      messages: [{
        role: "system",
        content: "You are a relationship counselor. Analyze relationship journal entries for red flags (violence, threats, control) or green flags (love, support, respect). Return valid JSON only."
      }, {
        role: "user",
        content: `Analyze: "${text}"

JSON format:
{
  "flag": "red"|"green"|"neutral",
  "color": "red"|"green"|"neutral", 
  "icon": "🚩"|"✅"|"⚪",
  "title": "Analysis title",
  "message": "Explanation",
  "suggestions": ["suggestion1", "suggestion2"],
  "confidence": 0.8
}`
      }],
      temperature: 0.3,
      max_tokens: 400
    };

    try {
      console.log('🤝 Trying Together AI (Additional Backup)...');
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Together API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Invalid Together response');
      }

      // Clean up the response to extract JSON
      let jsonText = content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const result = JSON.parse(jsonText);
      console.log('✅ Together AI analysis successful');
      
      return {
        ...result,
        provider: 'together',
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('❌ Together AI failed:', error.message);
      throw error;
    }
  }

  // Perplexity - Final AI fallback
  async analyzeWithPerplexity(text) {
    const provider = this.providers.find(p => p.name === 'perplexity');
    
    if (!provider.enabled) {
      throw new Error('Perplexity API key not configured');
    }

    const requestBody = {
      model: "llama-3.1-sonar-small-128k-chat",
      messages: [{
        role: "system",
        content: "You are a relationship counselor AI. Analyze relationship interactions for concerning behaviors (red flags) or healthy behaviors (green flags). Always respond with valid JSON only."
      }, {
        role: "user",
        content: `Please analyze this relationship journal entry for red or green flags:

"${text}"

Return your analysis as JSON:
{
  "flag": "red" | "green" | "neutral",
  "color": "red" | "green" | "neutral",
  "icon": "🚩" | "✅" | "⚪", 
  "title": "Brief analysis title",
  "message": "Your professional assessment",
  "suggestions": ["practical suggestion 1", "practical suggestion 2"],
  "confidence": 0.8
}

CRITICAL: Physical violence, threats, controlling behavior must be red flags.`
      }],
      temperature: 0.2,
      max_tokens: 500
    };

    try {
      console.log('🧠 Trying Perplexity AI (Final AI Backup)...');
      
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Perplexity API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Invalid Perplexity response');
      }

      const result = JSON.parse(content);
      console.log('✅ Perplexity analysis successful');
      
      return {
        ...result,
        provider: 'perplexity', 
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('❌ Perplexity failed:', error.message);
      throw error;
    }
  }

  // MAIN ANALYSIS FUNCTION - Optimized for Gemini → Groq flow
  async analyzeRelationshipEntry(text) {
    console.log('🎯 Starting Gemini (3 retries) → Groq (2 retries) analysis chain...');
    
    // Step 1: Try Gemini with 3 retries (Primary)
    try {
      const result = await this.analyzeWithGemini(text);
      console.log('🎉 Success with Gemini (Primary Provider)');
      return result;
    } catch (geminiError) {
      console.warn('⚠️ Gemini failed after 4 attempts, switching to Groq...');
    }

    // Step 2: Try Groq with 2 retries (Fast Backup)
    try {
      const result = await this.analyzeWithGroq(text);
      console.log('🎉 Success with Groq (Fast Backup)');
      return result;
    } catch (groqError) {
      console.warn('⚠️ Both Gemini and Groq failed, trying additional providers...');
    }

    // Step 3: Try additional providers if available
    const additionalProviders = this.providers
      .filter(p => p.enabled && !['gemini', 'groq'].includes(p.name))
      .sort((a, b) => a.priority - b.priority);

    for (const provider of additionalProviders) {
      try {
        let result;
        
        switch (provider.name) {
          case 'together':
            result = await this.analyzeWithTogether(text);
            break;
          case 'perplexity':
            result = await this.analyzeWithPerplexity(text);
            break;
          default:
            continue;
        }
        
        console.log(`🎉 Success with ${provider.name} (Additional Backup)`);
        return result;
        
      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error.message);
        continue;
      }
    }
    
    // If we get here, all AI providers failed
    console.error('💥 All AI providers failed');
    throw new Error('All AI providers failed - will fall back to local analysis');
  }

  // Utility methods
  getAvailableProviders() {
    return this.providers
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(p => ({ 
        name: p.name, 
        limits: p.limits, 
        priority: p.priority,
        free: p.free 
      }));
  }

  getProviderStatus() {
    return {
      primary: this.providers.find(p => p.name === 'gemini')?.enabled ? 'gemini' : 'none',
      backup: this.providers.find(p => p.name === 'groq')?.enabled ? 'groq' : 'none',
      totalEnabled: this.providers.filter(p => p.enabled).length,
      recommended: this.providers.filter(p => ['gemini', 'groq'].includes(p.name) && p.enabled).length
    };
  }

  async testProvider(providerName) {
    const testText = "My partner said they love me for the first time today";
    
    try {
      const startTime = Date.now();
      
      switch (providerName) {
        case 'gemini':
          await this.analyzeWithGemini(testText);
          break;
        case 'groq':
          await this.analyzeWithGroq(testText);
          break;
        case 'together':
          await this.analyzeWithTogether(testText);
          break;
        case 'perplexity':
          await this.analyzeWithPerplexity(testText);
          break;
        default:
          throw new Error(`Unknown provider: ${providerName}`);
      }
      
      const responseTime = Date.now() - startTime;
      return { 
        success: true, 
        provider: providerName, 
        responseTime,
        status: providerName === 'gemini' ? 'Primary' : providerName === 'groq' ? 'Fast Backup' : 'Additional Backup'
      };
    } catch (error) {
      return { 
        success: false, 
        provider: providerName, 
        error: error.message,
        status: 'Failed'
      };
    }
  }
}

// Create and export the service instance
const optimizedAiService = new OptimizedAIService();

// Export the main function for backward compatibility
export const analyzeRelationshipEntry = (text) => {
  return optimizedAiService.analyzeRelationshipEntry(text);
};

// Export the service instance for advanced usage
export { optimizedAiService };

// Export utility functions
export const getAvailableProviders = () => optimizedAiService.getAvailableProviders();
export const getProviderStatus = () => optimizedAiService.getProviderStatus();
export const testProvider = (providerName) => optimizedAiService.testProvider(providerName);
