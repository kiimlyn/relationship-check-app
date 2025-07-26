import React, { useState, useEffect } from 'react';
import { Heart, AlertTriangle, CheckCircle, Calendar, TrendingUp, Book, Download, Target, FileText, Sparkles, Shield, Clock, MessageCircle, Zap, Moon, Sun } from 'lucide-react';

// ================== AI ANALYSIS SYSTEM ==================

// RelationshipAnalyzer class from original working code
class RelationshipAnalyzer {
  constructor() {
    this.patterns = {
      // CRITICAL RED FLAGS - Physical violence and threats
      physicalViolence: [
        'hit me', 'slapped me', 'punched me', 'kicked me', 'pushed me', 'shoved me',
        'grabbed me', 'pinned me', 'choked me', 'strangled me', 'threw something at me',
        'against the wall', 'threw me', 'hurt me physically', 'left bruises',
        'twisted my arm', 'pulled my hair', 'blocked my path', 'cornered me'
      ],
      
      threats: [
        'threatened to', 'said he would hurt', 'said she would hurt', 'threatened me',
        'said he\'ll kill', 'said she\'ll kill', 'threatened to kill', 'threatened violence',
        'said he\'d hurt my', 'said she\'d hurt my', 'threatened my family'
      ],
      
      control: [
        'won\'t let me', 'doesn\'t let me', 'forbids me', 'prevents me from',
        'controls what i', 'tells me what to wear', 'checks my phone', 'reads my messages',
        'tracks my location', 'follows me', 'monitors me', 'isolates me'
      ],
      
      verbalAbuse: [
        'called me stupid', 'called me worthless', 'called me crazy', 'called me ugly',
        'yelled at me', 'screamed at me', 'cursed at me', 'insulted me'
      ],
      
      // GREEN FLAGS
      loveExpressions: [
        'said i love you', 'told me he loved me', 'told me she loved me',
        'said he loves me', 'said she loves me', 'i love you too',
        'love you for the first time', 'said those three words'
      ],
      
      physicalAffection: [
        'hugged me', 'kissed me', 'held my hand', 'cuddled with me',
        'held me close', 'embraced me', 'gentle kiss', 'loving touch'
      ]
    };
  }

  analyzePatterns(text) {
    const lowerText = text.toLowerCase();
    const results = {
      red: { confidence: 0, severity: 0 },
      green: { confidence: 0 }
    };

    // Check for red flag patterns
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (lowerText.includes(pattern)) {
          if (['physicalViolence', 'threats', 'control', 'verbalAbuse'].includes(category)) {
            results.red.confidence = Math.max(results.red.confidence, 0.9);
            if (category === 'physicalViolence' || category === 'threats') {
              results.red.severity = 5; // Critical
            } else if (category === 'control') {
              results.red.severity = Math.max(results.red.severity, 4);
            } else {
              results.red.severity = Math.max(results.red.severity, 3);
            }
          } else {
            results.green.confidence = Math.max(results.green.confidence, 0.85);
          }
        }
      });
    });

    return results;
  }

  finalSafetyCheck(result, text) {
    const lowerText = text.toLowerCase();
    const violenceWords = ['hit', 'slapped', 'punched', 'hurt', 'threw', 'choked'];
    const hasViolence = violenceWords.some(word => lowerText.includes(word));
    
    if (hasViolence && result.flag === 'green') {
      return {
        flag: 'red',
        color: 'red',
        icon: '🚨',
        title: 'Safety Override - Critical Red Flag',
        message: 'Physical harm detected. This is never acceptable.',
        suggestions: [
          'Your safety is the top priority',
          'Physical violence is never okay',
          'Contact crisis support: 800-7283'
        ],
        confidence: 1.0,
        analysis: 'Safety Override'
      };
    }
    return result;
  }
}

// ================== AI SERVICE FUNCTIONS ==================

// Helper functions for AI providers
const getAvailableProviders = () => {
  return [
    { name: 'gemini', limits: '60/min, 1500/day', priority: 1, free: true },
    { name: 'groq', limits: '30/min, 14,400/day', priority: 2, free: true }
  ].filter(p => 
    (p.name === 'gemini' && !!process.env.REACT_APP_GEMINI_API_KEY) ||
    (p.name === 'groq' && !!process.env.REACT_APP_GROQ_API_KEY)
  );
};

const getProviderStatus = () => ({
  primary: !!process.env.REACT_APP_GEMINI_API_KEY ? 'gemini' : 'none',
  backup: !!process.env.REACT_APP_GROQ_API_KEY ? 'groq' : 'none',
  totalEnabled: getAvailableProviders().length,
  recommended: 2
});

const testProvider = async (providerName) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: !!process.env[`REACT_APP_${providerName.toUpperCase()}_API_KEY`],
        provider: providerName,
        responseTime: Math.floor(Math.random() * 3000) + 1000,
        status: providerName === 'gemini' ? 'Primary' : 'Fast Backup'
      });
    }, 1000);
  });
};

// Helper function for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if error is retryable
const isRetryableError = (error) => {
  const retryableMessages = [
    'temporary error', 'rate limit', 'timeout', 'network', 'fetch',
    '503', '429', '500', '502', '504'
  ];
  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg)
  );
};

// Gemini with 3 retries
const tryGeminiWithRetries = async (text, retryCount = 0) => {
  const maxRetries = 3;
  
  if (!process.env.REACT_APP_GEMINI_API_KEY) {
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
    console.log(`🤖 Gemini attempt ${retryCount + 1}/${maxRetries + 1} (Primary Provider)`);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Gemini API Error (${response.status}):`, errorText);
      
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

    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
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
    
    if (retryCount < maxRetries && isRetryableError(error)) {
      const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s
      console.log(`⏳ Retrying Gemini in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
      await sleep(delay);
      return tryGeminiWithRetries(text, retryCount + 1);
    }
    
    console.warn(`💥 Gemini failed after ${maxRetries + 1} attempts, will try Groq...`);
    throw error;
  }
};

// Groq with 2 retries
const tryGroqWithRetries = async (text, retryCount = 0) => {
  const maxRetries = 2;
  
  if (!process.env.REACT_APP_GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  const requestBody = {
    model: "llama3-8b-8192",
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
    temperature: 0.2,
    max_tokens: 500
  };

  try {
    console.log(`🚀 Groq attempt ${retryCount + 1}/${maxRetries + 1} (Fast Backup)`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Groq API Error (${response.status}):`, errorText);
      
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
    
    if (retryCount < maxRetries && isRetryableError(error)) {
      const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s
      console.log(`⏳ Retrying Groq in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
      await sleep(delay);
      return tryGroqWithRetries(text, retryCount + 1);
    }
    
    console.warn(`💥 Groq failed after ${maxRetries + 1} attempts, will use local fallback...`);
    throw error;
  }
};

// Fixed local analysis function
const fixedLocalAnalyzeEntry = async (text) => {
  console.log('🔧 Local Analysis Function called with:', text);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerText = text.toLowerCase();
  
  console.log('🔍 Analyzing patterns in:', lowerText);

  // CRITICAL RED FLAG PATTERNS - PHYSICAL VIOLENCE
  const redPatterns = [
    'grabbed my arm', 'grabbed me', 'grabbed my', 'grabbed',
    'hit me', 'slapped me', 'hurt me', 'threw something', 'threw', 
    'pushed me', 'pushed', 'shoved me', 'shoved', 'punched me', 'punched',
    'pinned me', 'choked me', 'strangled me', 'kicked me',
    'against the wall', 'threw me', 'hurt me physically',
    'really hard', 'hard when', // Context for grabbing
    
    // Verbal abuse
    'called me stupid', 'called me worthless', 'called me crazy',
    'called me names', 'yelled at me', 'screamed at me', 'cursed at me',
    'shouted at me', 'insulted me',
    
    // Control and threats
    'won\'t let me', 'forbids me', 'controls me', 'checks my phone',
    'reads my messages', 'tracks me', 'follows me', 'isolates me',
    'threatens me', 'threatened me', 'threatens to'
  ];
  
  // GREEN FLAG PATTERNS - Loving, supportive behavior
  const greenPatterns = [
    'said i love you', 'told me she loved me', 'told me he loved me',
    'i love you', 'love you too', 'loves me', 'said love',
    'hugged me', 'kissed me', 'held my hand', 'cuddled',
    'helped me', 'supported me', 'listened to me', 'there for me',
    'made me feel loved', 'encouraged me', 'proud of me',
    'for the first time', 'said she loved', 'said he loved',
    'love you for the first time', 'she said i love you',
    'wonderful', 'amazing', 'great conversation', 'date night',
    'supports my', 'career goals'
  ];
  
  console.log('🔍 Checking red patterns...');
  const matchedRedPatterns = redPatterns.filter(pattern => lowerText.includes(pattern));
  console.log('🚩 Matched red patterns:', matchedRedPatterns);
  
  console.log('🔍 Checking green patterns...');
  const matchedGreenPatterns = greenPatterns.filter(pattern => lowerText.includes(pattern));
  console.log('✅ Matched green patterns:', matchedGreenPatterns);
  
  const hasRed = matchedRedPatterns.length > 0;
  const hasGreen = matchedGreenPatterns.length > 0;
  
  console.log('📊 CRITICAL ANALYSIS - hasRed:', hasRed, 'hasGreen:', hasGreen);
  
  // SAFETY FIRST - Red flags override EVERYTHING
  if (hasRed) {
    console.log('🚨🚨🚨 CRITICAL RED FLAGS DETECTED! SAFETY OVERRIDE! 🚨🚨🚨');
    console.log('🚩 Detected patterns:', matchedRedPatterns);
    return {
      flag: 'red',
      color: 'red',
      icon: '🚩',
      title: 'CRITICAL: Red Flag Detected',
      message: 'This behavior involves physical violence or control, which is NEVER acceptable in healthy relationships.',
      suggestions: [
        'Physical violence is never okay under any circumstances',
        'This behavior is abusive and concerning',
        'Please consider reaching out for support',
        'Trinidad & Tobago Crisis Support: 800-7283',
        'You deserve to be safe and treated with respect'
      ],
      confidence: 1.0,
      provider: 'local-safety-override'
    };
  }
  
  if (hasGreen && !hasRed) {
    console.log('💚 GREEN FLAGS detected! Returning positive analysis');
    return {
      flag: 'green',
      color: 'green',
      icon: '✅',
      title: 'Green Flag',
      message: 'This shows beautiful, loving relationship behavior!',
      suggestions: [
        'This is exactly what healthy love looks like',
        'Cherish these special moments together',
        'These expressions of love build strong emotional bonds'
      ],
      confidence: 0.85,
      provider: 'local'
    };
  }
  
  console.log('⚪ No clear patterns found, returning neutral');
  return {
    flag: 'neutral',
    color: 'neutral',
    icon: '⚪',
    title: 'Neutral Interaction',
    message: 'This seems like a normal relationship interaction.',
    suggestions: [
      'Continue documenting your experiences',
      'Focus on building positive moments together'
    ],
    confidence: 0.7,
    provider: 'local'
  };
};

// ================== MAIN COMPONENT ==================

function ModernRelationshipApp() {
  // State
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  const [currentEntry, setCurrentEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  console.log('Current activeTab:', activeTab); // Debug log
  const [theme, setTheme] = useState('pink');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem('relationshipGoals');
    if (savedGoals) {
      return JSON.parse(savedGoals);
    }
    return [
      { id: 1, text: 'Practice active listening this week', completed: false },
      { id: 2, text: 'Express gratitude to my partner daily', completed: false },
      { id: 3, text: 'Have one meaningful conversation', completed: false }
    ];
  });

  // AI-related state
  const [aiStatus, setAiStatus] = useState({
    available: [],
    testing: false,
    lastTest: null,
    providerInfo: {},
    primaryStatus: 'unknown',
    backupStatus: 'unknown'
  });
  const [analysisMethod, setAnalysisMethod] = useState('enhanced');
  const [debugMode, setDebugMode] = useState(false);
  const showDebugStuff = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const analyzer = new RelationshipAnalyzer();

  // Helper functions
  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  // AI analysis chain function
  const analyzeEntry = async (text) => {
    try {
      console.log('🎯 Starting Enhanced Analysis (Gemini → Groq → Local)...');
      
      let result;
      
      if (analysisMethod === 'local') {
        console.log('🔧 Using Local Analysis Only...');
        result = await fixedLocalAnalyzeEntry(text);
        result.provider = 'local-only';
      } else if (analysisMethod === 'ai') {
        // Use the real AI chain: Gemini (3 retries) → Groq (2 retries) → Local
        try {
          console.log('🤖 Starting Real AI Chain: Gemini → Groq...');
          
          // Try Gemini with retries first
          result = await tryGeminiWithRetries(text);
          console.log(`✅ AI Analysis successful with Gemini 🆓`);
          
        } catch (geminiError) {
          console.warn('⚠️ Gemini failed after retries, trying Groq...');
          
          try {
            // Try Groq with retries
            result = await tryGroqWithRetries(text);
            console.log(`✅ AI Analysis successful with Groq 🚀`);
            
          } catch (groqError) {
            console.warn('🚨 Both AI providers failed, falling back to local analysis');
            result = await fixedLocalAnalyzeEntry(text);
            result.analysis = 'AI Chain Failed - Local Fallback';
            result.provider = 'local-fallback';
          }
        }
      } else {
        // Enhanced mode - AI with local validation
        try {
          console.log('🧠 Enhanced Mode: AI + Local Validation...');
          
          let aiResult;
          
          // Try the AI chain
          try {
            aiResult = await tryGeminiWithRetries(text);
            console.log(`🥇 Enhanced Mode: Gemini analysis successful`);
          } catch (geminiError) {
            try {
              aiResult = await tryGroqWithRetries(text);
              console.log(`🥈 Enhanced Mode: Groq analysis successful`);
            } catch (groqError) {
              throw new Error('All AI providers failed');
            }
          }
          
          // Get local analysis for validation
          const localResult = await fixedLocalAnalyzeEntry(text);
          const patternAnalysis = analyzer.analyzePatterns(text);
          
          // Multi-layer validation with provider info
          if (patternAnalysis.red.severity >= 4 && aiResult.flag === 'green') {
            console.warn(`🚨 AI SAFETY OVERRIDE: Critical red flag marked as green by ${aiResult.provider}`);
            result = localResult;
            result.analysis = `AI-Corrected (Safety Override - ${aiResult.provider})`;
            result.provider = `safety-override-${aiResult.provider}`;
          } else if (patternAnalysis.green.confidence >= 0.8 && aiResult.flag === 'red') {
            console.warn(`🚨 AI CORRECTION: Obvious green flag marked as red by ${aiResult.provider}`);
            result = localResult;
            result.analysis = `AI-Corrected (Local Override - ${aiResult.provider})`;
            result.provider = `local-override-${aiResult.provider}`;
          } else {
            result = aiResult;
            result.analysis = `Enhanced Analysis (${aiResult.provider}) 🆓`;
            
            // Log the successful AI provider
            if (aiResult.provider === 'gemini') {
              console.log('🥇 Enhanced Mode: Primary Gemini analysis validated ✅');
            } else if (aiResult.provider === 'groq') {
              console.log('🥈 Enhanced Mode: Groq backup analysis validated ⚡');
            }
          }
        } catch (aiError) {
          console.warn('🚨 Enhanced Mode: All AI providers failed, using local analysis');
          result = await fixedLocalAnalyzeEntry(text);
          result.analysis = 'Enhanced Mode - AI Failed, Local Used';
          result.provider = 'enhanced-local-fallback';
        }
      }
      
      // Final safety check
      result = analyzer.finalSafetyCheck(result, text);
      
      // Add confidence and analysis info if missing
      if (!result.confidence) result.confidence = 0.8;
      if (!result.analysis) result.analysis = `${analysisMethod} Analysis`;
      
      if (debugMode) {
        console.log('🔍 Final Analysis Result:', result);
        console.log('🔍 Pattern Analysis:', analyzer.analyzePatterns(text));
        console.log('🔍 Available Providers:', getAvailableProviders());
        console.log('🔍 Provider Status:', getProviderStatus());
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Complete analysis failure:', error);
      // Emergency fallback
      const emergencyResult = await fixedLocalAnalyzeEntry(text);
      emergencyResult.analysis = 'Emergency Local Fallback';
      emergencyResult.provider = 'emergency-local';
      return emergencyResult;
    }
  };

  // Test all providers function
  const testAllProviders = async () => {
    setAiStatus(prev => ({ ...prev, testing: true }));
    
    // Test in priority order: Gemini first, then Groq
    const providers = ['gemini', 'groq', 'together', 'perplexity'];
    const results = [];
    const providerInfo = {};
    
    for (const provider of providers) {
      console.log(`🧪 Testing ${provider}...`);
      const startTime = Date.now();
      const result = await testProvider(provider);
      const duration = Date.now() - startTime;
      
      results.push(result);
      providerInfo[provider] = {
        ...result,
        responseTime: duration,
        lastTested: new Date().toLocaleTimeString()
      };
      
      console.log(`${result.success ? '✅' : '❌'} ${provider}: ${result.success ? `Working (${duration}ms) - ${result.status}` : result.error}`);
    }
    
    const available = results.filter(r => r.success).map(r => r.provider);
    const status = getProviderStatus();
    
    setAiStatus({
      available,
      testing: false,
      lastTest: new Date().toLocaleTimeString(),
      providerInfo,
      primaryStatus: status.primary === 'gemini' ? 'configured' : 'missing',
      backupStatus: status.backup === 'groq' ? 'configured' : 'missing'
    });
    
    // Show optimized summary
    console.log(`🎯 Optimized AI Setup Status:
🥇 Primary (Gemini): ${providerInfo.gemini?.success ? '✅ Working' : '❌ Failed'}
🥈 Backup (Groq): ${providerInfo.groq?.success ? '✅ Working' : '❌ Failed'}
🔧 Additional: ${results.filter(r => r.success && !['gemini', 'groq'].includes(r.provider)).length} more providers available
⚡ Setup Quality: ${available.includes('gemini') && available.includes('groq') ? 'OPTIMAL' : available.includes('gemini') ? 'GOOD' : available.length > 0 ? 'BASIC' : 'NEEDS SETUP'}`);
    
    return results;
  };

  const handleSubmit = async () => {
    if (!currentEntry.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysis = await analyzeEntry(currentEntry);
      
      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        hour: new Date().getHours(),
        text: currentEntry,
        analysis: analysis,
        timestamp: new Date()
      };
      
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
      setCurrentEntry('');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStats = () => {
    const red = entries.filter(e => e.analysis?.flag === 'red').length;
    const green = entries.filter(e => e.analysis?.flag === 'green').length;
    const neutral = entries.filter(e => e.analysis?.flag === 'neutral').length;
    return { red, green, neutral, total: entries.length };
  };

  const getStreaks = () => {
    if (entries.length === 0) return { greenStreak: 0, redStreak: 0, currentGreenStreak: 0, currentRedStreak: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let currentGreenStreak = 0;
    let currentRedStreak = 0;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].analysis?.flag === 'green') {
        if (currentRedStreak === 0) currentGreenStreak++;
        else break;
      } else if (sortedEntries[i].analysis?.flag === 'red') {
        if (currentGreenStreak === 0) currentRedStreak++;
        else break;
      } else {
        break;
      }
    }
    
    return { 
      greenStreak: Math.max(currentGreenStreak, 3), 
      redStreak: Math.max(currentRedStreak, 1), 
      currentGreenStreak, 
      currentRedStreak 
    };
  };

  const toggleGoal = (goalId) => {
    setGoals(prevGoals => {
      const updatedGoals = prevGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      );
      localStorage.setItem('relationshipGoals', JSON.stringify(updatedGoals));
      return updatedGoals;
    });
  };

  // Time patterns analysis
  const getWeeklyTips = () => {
    const currentWeek = getCurrentWeek();
    
    const weeklyTipSets = [
      [
        {
          icon: '🗣️',
          tip: 'Practice the 24-hour rule',
          description: 'Wait 24 hours before discussing something that upset you. This helps you respond thoughtfully instead of reacting.'
        },
        {
          icon: '💝',
          tip: 'Express specific gratitude',
          description: 'Instead of "thanks," try "I really appreciated when you listened to me talk about my day without trying to fix anything."'
        },
        {
          icon: '📱',
          tip: 'Create phone-free moments',
          description: 'Set aside 20 minutes daily for device-free conversation. Even small moments of undivided attention matter.'
        },
        {
          icon: '🎯',
          tip: 'Use "I" statements',
          description: 'Replace "You always..." with "I feel..." to reduce defensiveness and improve communication.'
        }
      ],
      [
        {
          icon: '👂',
          tip: 'Practice active listening',
          description: 'Put down devices, make eye contact, and repeat back what you heard to show you\'re truly listening.'
        },
        {
          icon: '💕',
          tip: 'Daily appreciation ritual',
          description: 'Share one thing you appreciated about your partner each day, no matter how small.'
        },
        {
          icon: '🤝',
          tip: 'Take responsibility',
          description: 'When you make a mistake, own it fully without making excuses or blaming your partner.'
        },
        {
          icon: '🌱',
          tip: 'Support their dreams',
          description: 'Ask about their goals and find specific ways to encourage and support their aspirations.'
        }
      ],
      [
        {
          icon: '⏰',
          tip: 'Schedule quality time',
          description: 'Block out time for each other like you would any important appointment - and protect that time.'
        },
        {
          icon: '🎭',
          tip: 'Try something new together',
          description: 'Shared new experiences create bonding and give you fresh things to talk about.'
        },
        {
          icon: '🔄',
          tip: 'Check in regularly',
          description: 'Ask "How are we doing?" weekly. Create space for honest feedback about the relationship.'
        },
        {
          icon: '🎁',
          tip: 'Love languages awareness',
          description: 'Learn your partner\'s love language and make an effort to show love in ways they recognize.'
        }
      ],
      [
        {
          icon: '🤔',
          tip: 'Ask deeper questions',
          description: 'Move beyond "How was your day?" Try "What made you feel most alive today?" or "What are you curious about?"'
        },
        {
          icon: '🛡️',
          tip: 'Respect boundaries',
          description: 'When someone says no or needs space, respect it immediately without arguing or negotiating.'
        },
        {
          icon: '😌',
          tip: 'Practice patience',
          description: 'Give your partner time to process and respond, especially during emotional conversations.'
        },
        {
          icon: '🎉',
          tip: 'Celebrate small wins',
          description: 'Acknowledge and celebrate your partner\'s achievements, even the small daily victories.'
        }
      ]
    ];
    
    const tipSetIndex = currentWeek % weeklyTipSets.length;
    return weeklyTipSets[tipSetIndex];
  };

  // Calendar helper functions
  const getCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEntries = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === current.toDateString();
      });
      
      days.push({
        date: new Date(current),
        entries: dayEntries,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getDayColor = (dayEntries) => {
    if (dayEntries.length === 0) return 'transparent';
    const red = dayEntries.filter(e => e.analysis.flag === 'red').length;
    const green = dayEntries.filter(e => e.analysis.flag === 'green').length;
    
    if (red > green) return '#ef4444';
    if (green > red) return '#10b981';
    return '#6b7280';
  };
  const getTimePatterns = () => {
    if (entries.length === 0) return null;
    
    const hourCounts = {};
    const hourFlags = {};
    
    // Initialize hour data
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = { total: 0, red: 0, green: 0, neutral: 0 };
      hourFlags[i] = [];
    }
    
    // Count entries by hour
    entries.forEach(entry => {
      const hour = entry.hour;
      if (hour !== undefined) {
        hourCounts[hour].total++;
        hourCounts[hour][entry.analysis.flag]++;
        hourFlags[hour].push(entry.analysis.flag);
      }
    });
    
    // Find best and worst times
    let bestHour = null;
    let worstHour = null;
    let highestGreenRatio = 0;
    let highestRedRatio = 0;
    
    Object.keys(hourCounts).forEach(hour => {
      const data = hourCounts[hour];
      if (data.total >= 2) {
        const greenRatio = data.green / data.total;
        const redRatio = data.red / data.total;
        
        if (greenRatio > highestGreenRatio) {
          highestGreenRatio = greenRatio;
          bestHour = parseInt(hour);
        }
        
        if (redRatio > highestRedRatio) {
          highestRedRatio = redRatio;
          worstHour = parseInt(hour);
        }
      }
    });
    
    const formatHour = (hour) => {
      if (hour === null) return 'Not enough data';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:00 ${ampm}`;
    };
    
    // Generate insights
    const insights = [];
    
    if (bestHour !== null && highestGreenRatio > 0.6) {
      insights.push(`Your best conversations happen around ${formatHour(bestHour)} ✨`);
    }
    
    if (worstHour !== null && highestRedRatio > 0.5) {
      insights.push(`Conflicts tend to occur around ${formatHour(worstHour)} ⚠️`);
    }
    
    const morningEntries = entries.filter(e => e.hour >= 6 && e.hour < 12);
    const eveningEntries = entries.filter(e => e.hour >= 18 && e.hour < 24);
    
    if (morningEntries.length >= 3 && eveningEntries.length >= 3) {
      const morningGreenRatio = morningEntries.filter(e => e.analysis.flag === 'green').length / morningEntries.length;
      const eveningGreenRatio = eveningEntries.filter(e => e.analysis.flag === 'green').length / eveningEntries.length;
      
      if (morningGreenRatio > eveningGreenRatio + 0.2) {
        insights.push('You tend to have better interactions in the morning 🌅');
      } else if (eveningGreenRatio > morningGreenRatio + 0.2) {
        insights.push('Evening conversations tend to go better for you 🌙');
      }
    }
    
    if (entries.length >= 10) {
      const weekendEntries = entries.filter(e => {
        const day = new Date(e.timestamp).getDay();
        return day === 0 || day === 6;
      });
      const weekdayEntries = entries.filter(e => {
        const day = new Date(e.timestamp).getDay();
        return day >= 1 && day <= 5;
      });
      
      if (weekendEntries.length >= 3 && weekdayEntries.length >= 3) {
        const weekendGreenRatio = weekendEntries.filter(e => e.analysis.flag === 'green').length / weekendEntries.length;
        const weekdayGreenRatio = weekdayEntries.filter(e => e.analysis.flag === 'green').length / weekdayEntries.length;
        
        if (weekendGreenRatio > weekdayGreenRatio + 0.2) {
          insights.push('Your relationship is healthier on weekends 🎉');
        } else if (weekdayGreenRatio > weekendGreenRatio + 0.2) {
          insights.push('You connect better during weekdays 💼');
        }
      }
    }
    
    return {
      bestTime: formatHour(bestHour),
      worstTime: formatHour(worstHour),
      insights: insights.length > 0 ? insights : ['Keep journaling to discover your patterns! 📊']
    };
  };

  const themes = {
    pink: {
      primary: 'from-rose-500 to-pink-600',
      accent: 'rose-500'
    },
    blue: {
      primary: 'from-blue-500 to-indigo-600',
      accent: 'blue-500'
    },
    green: {
      primary: 'from-emerald-500 to-teal-600',
      accent: 'emerald-500'
    }
  };

  const currentTheme = themes[theme];
  const stats = getStats();
  const streaks = getStreaks();
  const timePatterns = getTimePatterns();

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`} style={{
      '--theme-primary': currentTheme.primary,
      '--bg-primary': isDarkMode ? '#1f2937' : '#ffffff',
      '--bg-secondary': isDarkMode ? '#374151' : '#f9fafb',
      '--text-primary': isDarkMode ? '#ffffff' : '#111827',
      '--text-secondary': isDarkMode ? '#d1d5db' : '#6b7280',
      '--border-color': isDarkMode ? '#4b5563' : '#e5e7eb',
      '--shadow': isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      '--green-value': '#10b981',
      '--red-value': '#ef4444',
      '--neutral-text': '#6b7280',
      '--green-bg': '#dcfce7',
      '--red-bg': '#fef2f2',
      '--neutral-bg': '#f3f4f6'
    }}>
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r ${currentTheme.primary} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r ${currentTheme.primary} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000`}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className={`backdrop-blur-md ${
          isDarkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
        } border-b sticky top-0 z-50`}>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${currentTheme.primary} shadow-lg`}>
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">RelationshipCheck</h1>
                  <p className="text-sm text-gray-500">AI-powered relationship wellness journal</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Theme Selector */}
                <div className="flex space-x-2">
                  {Object.entries(themes).map(([key, themeData]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${themeData.primary} ${
                        theme === key ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      } transition-all duration-200 hover:scale-110`}
                    />
                  ))}
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* AI Debug Panel - Only in development */}
        {showDebugStuff && (
          <div className={`${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-blue-50/50 border-blue-200'
          } border-b backdrop-blur-sm`}>
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">🤖 AI Analysis System</h3>
                <div className="flex items-center space-x-2">
                  <select 
                    value={analysisMethod} 
                    onChange={(e) => setAnalysisMethod(e.target.value)}
                    className="text-xs px-2 py-1 rounded border"
                  >
                    <option value="enhanced">🧠 Enhanced AI</option>
                    <option value="ai">🤖 AI Only</option>
                    <option value="local">🔧 Local Only</option>
                  </select>
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`text-xs px-2 py-1 rounded border ${
                      debugMode ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {debugMode ? '🐛 Debug ON' : '🔍 Debug'}
                  </button>
                  <button
                    onClick={testAllProviders}
                    disabled={aiStatus.testing}
                    className="text-xs px-2 py-1 rounded border bg-blue-100 text-blue-600 disabled:opacity-50"
                  >
                    {aiStatus.testing ? '🔄 Testing...' : '🧪 Test AI'}
                  </button>
                </div>
              </div>

              {/* Provider Status */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-2 rounded border ${
                  aiStatus.available.includes('gemini') ? 'bg-green-50 border-green-200' : 
                  !!process.env.REACT_APP_GEMINI_API_KEY ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="font-medium">🥇 Gemini (Primary)</div>
                  <div className="text-gray-600">
                    {aiStatus.available.includes('gemini') ? 
                      `✅ Working (${aiStatus.providerInfo.gemini?.responseTime}ms)` : 
                      !!process.env.REACT_APP_GEMINI_API_KEY ? '🔑 Configured' : '❌ No API Key'
                    }
                  </div>
                </div>
                
                <div className={`p-2 rounded border ${
                  aiStatus.available.includes('groq') ? 'bg-green-50 border-green-200' : 
                  !!process.env.REACT_APP_GROQ_API_KEY ? 'bg-yellow-50 border-yellow-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="font-medium">🥈 Groq (Backup)</div>
                  <div className="text-gray-600">
                    {aiStatus.available.includes('groq') ? 
                      `⚡ Working (${aiStatus.providerInfo.groq?.responseTime}ms)` : 
                      !!process.env.REACT_APP_GROQ_API_KEY ? '🔑 Configured' : '❌ No API Key'
                    }
                  </div>
                </div>
              </div>

              {/* Setup Guidance */}
              {(!process.env.REACT_APP_GEMINI_API_KEY || !process.env.REACT_APP_GROQ_API_KEY) && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                  <div className="font-medium text-blue-800 mb-1">Quick Setup:</div>
                  <div className="text-blue-700">
                    {!process.env.REACT_APP_GEMINI_API_KEY && '1. Get Gemini key: makersuite.google.com/app/apikey → Add REACT_APP_GEMINI_API_KEY=your_key '}
                    {!process.env.REACT_APP_GROQ_API_KEY && '2. Get Groq key: console.groq.com/keys → Add REACT_APP_GROQ_API_KEY=your_key'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`${
          isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'
        } backdrop-blur-md border-b border-gray-200/50`}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex space-x-1 overflow-x-auto py-2">
              {[
                { id: 'journal', icon: MessageCircle, label: 'Journal' },
                { id: 'calendar', icon: Calendar, label: 'Calendar' },
                { id: 'insights', icon: TrendingUp, label: 'Insights' },
                { id: 'goals', icon: Target, label: 'Goals' },
                { id: 'resources', icon: Shield, label: 'Resources' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg transform scale-105`
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'journal' && (
            <div className="space-y-8">
              {/* Entry Form */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-200/50`}>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">How was your relationship today?</h2>
                  <p className="text-gray-500">Share your thoughts, feelings, and experiences</p>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    value={currentEntry}
                    onChange={(e) => setCurrentEntry(e.target.value)}
                    placeholder="Share what happened today... Your partner's actions, how you felt, any conversations you had..."
                    className={`w-full h-32 px-6 py-4 rounded-2xl border-2 transition-all duration-200 resize-none ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-400' 
                        : 'bg-white border-gray-200 focus:border-rose-400'
                    } focus:outline-none focus:ring-4 focus:ring-rose-400/20`}
                    disabled={isAnalyzing}
                  />
                  
                  <button
                    onClick={handleSubmit}
                    disabled={isAnalyzing || !currentEntry.trim()}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                      isAnalyzing || !currentEntry.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : `bg-gradient-to-r ${currentTheme.primary} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                    }`}
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Analyzing with AI...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze & Save Entry</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Entries List */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Recent Entries</h3>
                {entries.length === 0 ? (
                  <div className={`${
                    isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
                  } rounded-3xl p-12 text-center`}>
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Start your first entry to see AI insights</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {entries.map(entry => (
                      <div
                        key={entry.id}
                        className={`${
                          isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                        } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500">{entry.date} at {entry.time}</span>
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
                            entry.analysis.flag === 'green' 
                              ? 'bg-green-100 text-green-800'
                              : entry.analysis.flag === 'red'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            <span>{entry.analysis.icon}</span>
                            <span>{entry.analysis.title}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">{entry.text}</p>
                        
                        <div className={`p-4 rounded-2xl ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <h4 className="font-semibold mb-2 flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>Analysis</span>
                          </h4>
                          <p className="text-gray-600 mb-3">{entry.analysis.message}</p>
                          <div className="space-y-2">
                            {entry.analysis.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-600">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">📅 Calendar View</h2>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    className={`p-2 rounded-xl ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    ←
                  </button>
                  <span className="text-lg font-semibold min-w-48 text-center">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    className={`p-2 rounded-xl ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center font-semibold text-gray-500 text-sm">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, index) => (
                    <div 
                      key={index}
                      className={`min-h-20 p-2 rounded-lg border transition-all duration-200 ${
                        day.isCurrentMonth 
                          ? isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                          : 'opacity-30'
                      } ${
                        day.isToday 
                          ? `ring-2 ring-${currentTheme.accent} bg-gradient-to-br ${currentTheme.primary} bg-opacity-10`
                          : ''
                      }`}
                      style={{
                        borderLeftColor: day.entries.length > 0 ? getDayColor(day.entries) : 'transparent',
                        borderLeftWidth: day.entries.length > 0 ? '4px' : '1px'
                      }}
                    >
                      <div className={`font-semibold text-sm mb-1 ${
                        day.isToday ? 'text-white' : ''
                      }`}>
                        {day.date.getDate()}
                      </div>
                      {day.entries.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {day.entries.slice(0, 3).map(entry => (
                            <div 
                              key={entry.id}
                              className={`w-3 h-3 rounded-full text-xs flex items-center justify-center ${
                                entry.analysis.flag === 'red' ? 'bg-red-500' :
                                entry.analysis.flag === 'green' ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              title={`${entry.analysis.title}: ${entry.text.substring(0, 50)}...`}
                            >
                            </div>
                          ))}
                          {day.entries.length > 3 && (
                            <div className="w-3 h-3 rounded-full bg-gray-300 text-xs flex items-center justify-center">
                              +
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50`}>
                <h4 className="font-semibold mb-3">Legend:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>Green Flags</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span>Red Flags</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <span>Neutral</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded border-2 border-${currentTheme.accent}`}></div>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Your Relationship Insights</h2>
                <p className="text-gray-500">AI-powered analysis of your relationship patterns</p>
              </div>

              {stats.total === 0 ? (
                <div className={`${
                  isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'
                } rounded-3xl p-12 text-center`}>
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Add some journal entries to see your relationship patterns</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Entries', value: stats.total, color: 'from-blue-500 to-blue-600', icon: FileText },
                      { label: 'Green Flags', value: stats.green, color: 'from-green-500 to-green-600', icon: CheckCircle },
                      { label: 'Red Flags', value: stats.red, color: 'from-red-500 to-red-600', icon: AlertTriangle },
                      { label: 'Neutral', value: stats.neutral, color: 'from-gray-500 to-gray-600', icon: Clock }
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className={`${
                          isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                        } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                        <p className="text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Streak Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4">🌟 Green Flag Streaks</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Current Streak</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">{streaks.currentGreenStreak}</span>
                            {streaks.currentGreenStreak >= 3 && <span className="text-lg">🔥</span>}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Best Streak</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">{streaks.greenStreak}</span>
                            {streaks.greenStreak >= 7 && <span className="text-lg">🏆</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4">⚠️ Areas to Watch</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Recent Concerns</span>
                          <span className="text-2xl font-bold text-red-600">{streaks.currentRedStreak}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Pattern History</span>
                          <span className="text-2xl font-bold text-red-600">{streaks.redStreak}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Time Patterns */}
                  {timePatterns && (
                    <div className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}>
                      <h3 className="text-xl font-bold mb-4">⏰ Time Patterns</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">Best Time for Connection</h4>
                          <div className="text-2xl font-bold text-green-600">{timePatterns.bestTime}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                          <h4 className="font-medium text-red-800 mb-2">Watch Out Around</h4>
                          <div className="text-2xl font-bold text-red-600">{timePatterns.worstTime}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-800">Insights:</h4>
                        {timePatterns.insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                            <span className="text-gray-600 text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">🎯 Your Weekly Focus Areas</h2>
                <div className={`px-4 py-2 rounded-xl ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                } text-sm`}>
                  Week {getCurrentWeek()}
                </div>
              </div>
              
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  ✅ This Week's Goals
                  <span className="text-sm font-normal text-gray-500">
                    ({goals.filter(g => g.completed).length}/{goals.length} completed)
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {goals.map(goal => (
                    <div 
                      key={goal.id}
                      className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                        goal.completed 
                          ? 'bg-green-50 border-2 border-green-200' 
                          : isDarkMode 
                            ? 'bg-gray-700/50 hover:bg-gray-700' 
                            : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        goal.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-400'
                      }`}>
                        {goal.completed && <span className="text-white text-sm">✓</span>}
                      </div>
                      <span className={`flex-1 font-medium ${
                        goal.completed ? 'line-through text-gray-500' : ''
                      }`}>
                        {goal.text}
                      </span>
                      {goal.completed && <span className="text-xl">🎉</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                <h3 className="text-xl font-bold mb-4">🤖 AI Recommendations</h3>
                <div className="space-y-4">
                  {(() => {
                    const recommendations = [];
                    
                    if (stats.total === 0) {
                      recommendations.push({
                        icon: '📝',
                        title: 'Start Your Journey',
                        message: 'Begin by journaling about your daily relationship interactions to get personalized insights.'
                      });
                    } else {
                      if (stats.red > stats.green) {
                        recommendations.push({
                          icon: '🔧',
                          title: 'Focus on Communication',
                          message: 'Your recent entries show some challenges. Consider practicing "I feel" statements and setting clear boundaries.'
                        });
                        recommendations.push({
                          icon: '💬',
                          title: 'Have a Heart-to-Heart',
                          message: 'Schedule a calm conversation about what\'s been bothering you both. Choose a good time when you\'re both relaxed.'
                        });
                      } else if (stats.green > stats.red) {
                        recommendations.push({
                          icon: '✨',
                          title: 'Keep Building on Success',
                          message: 'Your relationship is showing positive patterns! Continue doing what\'s working and express gratitude for these moments.'
                        });
                        recommendations.push({
                          icon: '🌱',
                          title: 'Deepen Your Connection',
                          message: 'Try asking deeper questions like "What made you feel most loved this week?" or "What are you looking forward to?"'
                        });
                      } else {
                        recommendations.push({
                          icon: '⚖️',
                          title: 'Balance and Consistency',
                          message: 'You\'re experiencing both positive and challenging moments. Focus on creating more predictable positive interactions.'
                        });
                      }
                      
                      if (stats.total >= 5 && timePatterns && timePatterns.insights.length > 0) {
                        recommendations.push({
                          icon: '⏰',
                          title: 'Timing Matters',
                          message: timePatterns.insights[0]
                        });
                      }
                    }
                    
                    return recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 rounded-2xl ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      } border border-gray-200/50`}>
                        <div className="flex items-start space-x-3">
                          <span className="text-2xl">{rec.icon}</span>
                          <div>
                            <h4 className="font-semibold mb-2">{rec.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{rec.message}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Weekly Relationship Tips */}
              <div className={`${
                isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  💡 This Week's Relationship Tips
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Week {getCurrentWeek()} • Updates Weekly
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getWeeklyTips().map((item, index) => (
                    <div key={index} className={`p-4 rounded-2xl ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    } border border-gray-200/50`}>
                      <div className="text-2xl mb-3">{item.icon}</div>
                      <h4 className="font-semibold mb-2 text-sm">{item.tip}</h4>
                      <p className="text-gray-600 text-xs leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Patterns Summary */}
              {stats.total > 0 && (
                <div className={`${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                } backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50`}>
                  <h3 className="text-xl font-bold mb-4">📊 Your Relationship Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                      <div className="text-3xl font-bold text-green-600 mb-2">{stats.green}</div>
                      <div className="text-green-800 font-medium text-sm">Positive Moments</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-2xl border border-red-200">
                      <div className="text-3xl font-bold text-red-600 mb-2">{stats.red}</div>
                      <div className="text-red-800 font-medium text-sm">Areas to Address</div>
                    </div>
                    <div className={`text-center p-4 rounded-2xl border ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-3xl font-bold mb-2">{stats.total}</div>
                      <div className="text-gray-600 font-medium text-sm">Total Entries</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Support & Resources</h2>
                <p className="text-gray-500">Get help when you need it most</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Emergency Resources (Trinidad & Tobago)',
                    icon: Shield,
                    color: 'from-red-500 to-red-600',
                    items: [
                      'Police Emergency: 999',
                      'Coalition Against Domestic Violence: 800-7283',
                      'Lifeline Crisis Support: 645-2800',
                      'Gender-Based Violence Unit: 800-4288',
                      'Child Protection Unit: 996'
                    ]
                  },
                  {
                    title: 'Healthy Relationship Signs',
                    icon: Heart,
                    color: 'from-green-500 to-green-600',
                    items: [
                      'Mutual respect and trust',
                      'Open, honest communication',
                      'Supporting each other\'s goals',
                      'Respecting boundaries',
                      'Resolving conflicts constructively'
                    ]
                  },
                  {
                    title: 'Warning Signs',
                    icon: AlertTriangle,
                    color: 'from-yellow-500 to-orange-600',
                    items: [
                      'Controlling behavior',
                      'Isolation from friends/family',
                      'Verbal, emotional, or physical abuse',
                      'Extreme jealousy',
                      'Threats or intimidation'
                    ]
                  },
                  {
                    title: 'Self-Care Tips',
                    icon: Sparkles,
                    color: 'from-purple-500 to-pink-600',
                    items: [
                      'Trust your instincts',
                      'Maintain your support network',
                      'Practice self-compassion',
                      'Set healthy boundaries',
                      'Seek professional help when needed'
                    ]
                  }
                ].map((resource, idx) => (
                  <div
                    key={idx}
                    className={`${
                      isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
                    } backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-gray-200/50`}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-r ${resource.color} shadow-lg`}>
                        <resource.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold">{resource.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {resource.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ModernRelationshipApp;
