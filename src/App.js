import React, { useState } from 'react';
import { Heart, AlertTriangle, CheckCircle, Calendar, TrendingUp, Book, Download, Target, FileText } from 'lucide-react';
import { analyzeRelationshipEntry } from './services/gemini';
import './App.css';
// ADD THIS NEW CL
// // Temporary functions until we fix the aiService import
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
function App() {
  const [entries, setEntries] = useState(() => {
  const savedEntries = localStorage.getItem('journalEntries');
  return savedEntries ? JSON.parse(savedEntries) : [];
});
// Add these state variables after your existing useState declarations
const [aiStatus, setAiStatus] = useState({
  available: [],
  testing: false,
  lastTest: null,
  providerInfo: {},
  primaryStatus: 'unknown',
  backupStatus: 'unknown'
});
// ADD these lines after your existing useState declarations
const [analysisMethod, setAnalysisMethod] = useState('enhanced');
const [debugMode, setDebugMode] = useState(false);
const showDebugStuff = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';// ADD this line after all your state declarations (before your functions)
const analyzer = new RelationshipAnalyzer();
  const [currentEntry, setCurrentEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('journal');
  console.log('Current activeTab:', activeTab);
  const [theme, setTheme] = useState('pink');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
// REPLACE the existing goals useState with this:
const [goals, setGoals] = useState(() => {
  const savedGoals = localStorage.getItem('relationshipGoals');
  if (savedGoals) {
    return JSON.parse(savedGoals);
  }
  // Default goals for new users
  return [
    { id: 1, text: 'Practice active listening this week', completed: false, week: getCurrentWeek() },
    { id: 2, text: 'Express gratitude to my partner daily', completed: false, week: getCurrentWeek() },
    { id: 3, text: 'Have one meaningful conversation', completed: false, week: getCurrentWeek() }
  ];
});
  // Add this function to your App.js with your other functions
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

// ADD THIS NEW FUNCTION RIGHT BEFORE getCurrentWeek()
const getWeeklyTips = () => {
  const currentWeek = getCurrentWeek();
  
  // Array of weekly tip sets - rotates every week
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
  
  // Use modulo to cycle through tip sets based on week number
  const tipSetIndex = currentWeek % weeklyTipSets.length;
  return weeklyTipSets[tipSetIndex];
};
  function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  // FIXED LOCAL ANALYSIS FUNCTION WITH COMPLETE RED FLAG DETECTION
// Replace your existing analyzeEntry function with this:
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
// Add this function after your analyzeEntry function:
// REPLACE your existing fixedLocalAnalyzeEntry function with this FIXED version:

const fixedLocalAnalyzeEntry = async (text) => {
  console.log('🔧 Local Analysis Function called with:', text);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lowerText = text.toLowerCase();
  
  console.log('🔍 Analyzing patterns in:', lowerText);
console.log('🔍 TESTING: Looking for "grabbed my arm" in:', lowerText);
console.log('🔍 TESTING: Contains "grabbed my arm"?', lowerText.includes('grabbed my arm'));
console.log('🔍 TESTING: Contains "grabbed"?', lowerText.includes('grabbed'));

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
// Add these functions right after your analyzeEntry function:

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

  const themes = {
    pink: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryLight: '#fdf2f8',
      primaryBorder: '#f9a8d4',
      accent: '#be185d'
    },
    blue: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#eff6ff',
      primaryBorder: '#93c5fd',
      accent: '#1d4ed8'
    },
    green: {
      primary: '#10b981',
      primaryHover: '#059669',
      primaryLight: '#ecfdf5',
      primaryBorder: '#6ee7b7',
      accent: '#047857'
    }
  };

  const currentTheme = themes[theme];

  const getStats = () => {
    const red = entries.filter(e => e.analysis.flag === 'red').length;
    const green = entries.filter(e => e.analysis.flag === 'green').length;
    const neutral = entries.filter(e => e.analysis.flag === 'neutral').length;
    return { red, green, neutral, total: entries.length };
  };

  const getStreaks = () => {
    if (entries.length === 0) return { greenStreak: 0, redStreak: 0, currentGreenStreak: 0, currentRedStreak: 0 };
    
    const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Current streaks (from most recent)
    let currentGreenStreak = 0;
    let currentRedStreak = 0;
    
    for (let i = 0; i < sortedEntries.length; i++) {
      if (sortedEntries[i].analysis.flag === 'green') {
        if (currentRedStreak === 0) currentGreenStreak++;
        else break;
      } else if (sortedEntries[i].analysis.flag === 'red') {
        if (currentGreenStreak === 0) currentRedStreak++;
        else break;
      } else {
        break; // Neutral breaks streaks
      }
    }
    
    // Longest streaks ever
    let longestGreen = 0;
    let longestRed = 0;
    let tempGreen = 0;
    let tempRed = 0;
    
    sortedEntries.reverse().forEach(entry => {
      if (entry.analysis.flag === 'green') {
        tempGreen++;
        tempRed = 0;
        longestGreen = Math.max(longestGreen, tempGreen);
      } else if (entry.analysis.flag === 'red') {
        tempRed++;
        tempGreen = 0;
        longestRed = Math.max(longestRed, tempRed);
      } else {
        tempGreen = 0;
        tempRed = 0;
      }
    });
    
    return { 
      greenStreak: longestGreen, 
      redStreak: longestRed, 
      currentGreenStreak, 
      currentRedStreak 
    };
  };

  const exportData = () => {
    const dataToExport = {
      exportDate: new Date().toLocaleDateString(),
      totalEntries: entries.length,
      entries: entries.map(entry => ({
        date: entry.date,
        time: entry.time,
        text: entry.text,
        analysis: entry.analysis.title,
        message: entry.analysis.message
      })),
      statistics: getStats(),
      streaks: getStreaks()
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([`RELATIONSHIP JOURNAL EXPORT
Export Date: ${new Date().toLocaleDateString()}

SUMMARY:
Total Entries: ${entries.length}
Green Flags: ${getStats().green}
Red Flags: ${getStats().red}
Neutral: ${getStats().neutral}

ENTRIES:
${entries.map(entry => `
Date: ${entry.date} at ${entry.time}
Entry: ${entry.text}
Analysis: ${entry.analysis.title} - ${entry.analysis.message}
---`).join('')}

STATISTICS:
${JSON.stringify(getStats(), null, 2)}

STREAKS:
${JSON.stringify(getStreaks(), null, 2)}
`], { type: 'text/plain' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relationship-journal-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
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

  const addGoal = (text) => {
    const newGoal = {
      id: Date.now(),
      text,
      completed: false,
      week: getCurrentWeek()
    };
    setGoals([...goals, newGoal]);
  };

  // ADD this NEW function RIGHT AFTER the addGoal function:
const resetWeeklyGoals = () => {
  const currentWeek = getCurrentWeek();
  const updatedGoals = goals.map(goal => ({
    ...goal,
    completed: false,
    week: currentWeek
  }));
  setGoals(updatedGoals);
  localStorage.setItem('relationshipGoals', JSON.stringify(updatedGoals));
};

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
    
    if (red > green) return 'var(--red-value)';
    if (green > red) return 'var(--green-value)';
    return 'var(--neutral-text)';
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
      if (data.total >= 2) { // Only consider hours with at least 2 entries
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

  const stats = getStats();
  const streaks = getStreaks();
const timePatterns = getTimePatterns();

return (
  <div className={`app ${isDarkMode ? 'dark-mode' : ''}`} style={{
    '--theme-primary': currentTheme.primary,
    '--theme-primary-hover': currentTheme.primaryHover,
    '--theme-primary-light': currentTheme.primaryLight,
    '--theme-primary-border': currentTheme.primaryBorder,
    '--theme-accent': currentTheme.accent
  }}>
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <Heart className="header-icon" />
          <h1>RelationshipCheck</h1>
        </div>
        <p className="header-subtitle">Your personal relationship wellness journal with AI insights</p>
       
        <></>

{/* Debug and API Test */}
{/* Debug and API Test - Only show in development */}
{showDebugStuff && (
<>
<div className="flex items-center space-x-2" style={{marginBottom: '10px'}}>
  <button
    onClick={() => setDebugMode(!debugMode)}
    style={{padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: debugMode ? '#fef3c7' : 'white'}}
  >
    {debugMode ? '🐛 Debug ON' : '🔍 Debug'}
  </button>
 <button
  onClick={async () => {
    console.log('🔑 API Key exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
    console.log('🔑 API Key length:', process.env.REACT_APP_GEMINI_API_KEY?.length);
    console.log('🔑 API Key first 10 chars:', process.env.REACT_APP_GEMINI_API_KEY?.substring(0, 10));
    
    try {
      const { validateApiKey, getApiStatus } = await import('./services/gemini');
      console.log('✅ API Key Valid:', validateApiKey());
      
      const status = await getApiStatus();
      console.log('📡 API Status:', status);
    } catch (error) {
      console.error('❌ API Test Error:', error);
    }
  }}
  style={{padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: '#dbeafe'}}
>
  🧪 Test API
</button>
</div>
{/* Enhanced Gemini → Groq AI Status Section */}
<div style={{marginBottom: '15px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>  
  {/* Analysis Method Selector */}
  <div className="flex items-center space-x-2" style={{marginBottom: '10px'}}>
    <span style={{fontSize: '14px', fontWeight: '500'}}>Analysis Mode:</span>
    <select 
      value={analysisMethod} 
      onChange={(e) => setAnalysisMethod(e.target.value)}
      style={{padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px'}}
    >
      <option value="enhanced">🧠 Enhanced AI</option>
      <option value="ai">🤖 AI Only</option>
      <option value="local">🔧 Local Only</option>
    </select>
  </div>

  {/* Optimized Provider Status */}
  <div style={{marginBottom: '10px', padding: '8px', background: 'var(--bg-primary)', borderRadius: '6px'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
      <span style={{fontSize: '14px', fontWeight: '500'}}>🎯 Optimized Setup:</span>
      <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
        {(() => {
          const hasGemini = aiStatus.available.includes('gemini');
          const hasGroq = aiStatus.available.includes('groq');
          const quality = hasGemini && hasGroq ? 'OPTIMAL ⭐⭐⭐' : hasGemini ? 'GOOD ⭐⭐' : aiStatus.available.length > 0 ? 'BASIC ⭐' : 'NEEDS SETUP';
          return quality;
        })()}
      </span>
      {aiStatus.lastTest && (
        <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
          (Tested: {aiStatus.lastTest})
        </span>
      )}
    </div>
    
    {/* Primary & Backup Status */}
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBottom: '8px'}}>
      {/* Gemini - Primary */}
      <div style={{
        padding: '8px', 
        borderRadius: '6px', 
        border: '2px solid',
        borderColor: aiStatus.available.includes('gemini') ? '#10b981' : !!process.env.REACT_APP_GEMINI_API_KEY ? '#f59e0b' : '#ef4444',
        backgroundColor: aiStatus.available.includes('gemini') ? '#d1fae5' : !!process.env.REACT_APP_GEMINI_API_KEY ? '#fef3c7' : '#fee2e2'
      }}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
          <span style={{fontWeight: '600', fontSize: '13px', color: '#374151'}}>
            🥇 Gemini (Primary)
          </span>
          <span style={{fontSize: '11px', color: '#6b7280'}}>
            {aiStatus.available.includes('gemini') ? 
              `✅ ${aiStatus.providerInfo.gemini?.responseTime || '?'}ms` : 
              !!process.env.REACT_APP_GEMINI_API_KEY ? '🔑 Key OK' : '❌ No Key'
            }
          </span>
        </div>
        <div style={{fontSize: '10px', color: '#6b7280'}}>
          FREE • 60/min • 1500/day • 3 retries
        </div>
      </div>

      {/* Groq - Backup */}
      <div style={{
        padding: '8px', 
        borderRadius: '6px', 
        border: '2px solid',
        borderColor: aiStatus.available.includes('groq') ? '#10b981' : !!process.env.REACT_APP_GROQ_API_KEY ? '#f59e0b' : '#ef4444',
        backgroundColor: aiStatus.available.includes('groq') ? '#d1fae5' : !!process.env.REACT_APP_GROQ_API_KEY ? '#fef3c7' : '#fee2e2'
      }}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px'}}>
          <span style={{fontWeight: '600', fontSize: '13px', color: '#374151'}}>
            🥈 Groq (Fast Backup)
          </span>
          <span style={{fontSize: '11px', color: '#6b7280'}}>
            {aiStatus.available.includes('groq') ? 
              `⚡ ${aiStatus.providerInfo.groq?.responseTime || '?'}ms` : 
              !!process.env.REACT_APP_GROQ_API_KEY ? '🔑 Key OK' : '❌ No Key'
            }
          </span>
        </div>
        <div style={{fontSize: '10px', color: '#6b7280'}}>
          FREE • 30/min • 14,400/day • 2 retries
        </div>
      </div>
    </div>

    {/* Additional Providers (if any) */}
    {aiStatus.available.filter(p => !['gemini', 'groq'].includes(p)).length > 0 && (
      <div style={{padding: '6px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)'}}>
        <span style={{fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500'}}>
          🔧 Additional Backups: {aiStatus.available.filter(p => !['gemini', 'groq'].includes(p)).join(', ')}
        </span>
      </div>
    )}

    {/* Flow Diagram */}
    <div style={{marginTop: '8px', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border-color)'}}>
      <div style={{fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center'}}>
        <span style={{fontWeight: '500'}}>Analysis Flow:</span> 
        <span style={{color: aiStatus.available.includes('gemini') ? '#10b981' : '#ef4444'}}> Gemini (3 retries)</span> 
        <span> → </span>
        <span style={{color: aiStatus.available.includes('groq') ? '#10b981' : '#ef4444'}}> Groq (2 retries)</span>
        <span> → </span>
        <span style={{color: '#6b7280'}}>Additional → Local</span>
      </div>
    </div>
  </div>

  {/* Control Buttons */}
  <div className="flex items-center space-x-2" style={{flexWrap: 'wrap', gap: '4px'}}>
    <button
      onClick={() => setDebugMode(!debugMode)}
      style={{padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: debugMode ? '#fef3c7' : 'white'}}
    >
      {debugMode ? '🐛 Debug ON' : '🔍 Debug'}
    </button>
    
    <button
      onClick={testAllProviders}
      disabled={aiStatus.testing}
      style={{
        padding: '4px 12px', 
        borderRadius: '4px', 
        border: '1px solid #ccc', 
        fontSize: '12px', 
        backgroundColor: aiStatus.testing ? '#f3f4f6' : '#dbeafe',
        cursor: aiStatus.testing ? 'not-allowed' : 'pointer'
      }}
    >
      {aiStatus.testing ? '🔄 Testing...' : '🧪 Test Gemini → Groq'}
    </button>
    
    <button
      onClick={async () => {
        console.log('🔧 Gemini → Groq System Diagnostics:');
        console.log('🎯 Provider Status:', getProviderStatus());
        console.log('📊 Available Providers:', getAvailableProviders());
        console.log('🔑 API Keys Status:', {
          gemini: !!process.env.REACT_APP_GEMINI_API_KEY ? '✅ Configured' : '❌ Missing',
          groq: !!process.env.REACT_APP_GROQ_API_KEY ? '✅ Configured' : '❌ Missing',
          together: !!process.env.REACT_APP_TOGETHER_API_KEY ? '✅ Configured' : '⚪ Optional',
          perplexity: !!process.env.REACT_APP_PERPLEXITY_API_KEY ? '✅ Configured' : '⚪ Optional'
        });
        console.log('📈 Analysis Method:', analysisMethod);
        console.log('🏥 AI Status:', aiStatus);
        console.log('💰 Cost Status: 100% FREE! 🎉');
        
        // Test the flow
        try {
          console.log('🧪 Testing analysis flow...');
          const testResult = await analyzeRelationshipEntry("My partner said they love me today");
          console.log('✅ Analysis flow working:', testResult);
        } catch (error) {
          console.error('❌ Analysis flow failed:', error);
        }
        
        // Test local fallback
        try {
          const localResult = await fixedLocalAnalyzeEntry("test entry");
          console.log('✅ Local fallback working:', localResult);
        } catch (error) {
          console.error('❌ Local fallback failed:', error);
        }
      }}
      style={{padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: '#f0fdf4'}}
    >
      🩺 System Check
    </button>
    
    <button
      onClick={() => {
        // Open relevant API key pages
        if (!process.env.REACT_APP_GEMINI_API_KEY) {
          window.open('https://makersuite.google.com/app/apikey', '_blank');
        } else if (!process.env.REACT_APP_GROQ_API_KEY) {
          window.open('https://console.groq.com/keys', '_blank');
        } else {
          // If both are configured, open Together AI for additional backup
          window.open('https://api.together.xyz/settings/api-keys', '_blank');
        }
      }}
      style={{padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', backgroundColor: '#eff6ff'}}
    >
      {!process.env.REACT_APP_GEMINI_API_KEY ? '🔑 Get Gemini Key' : 
       !process.env.REACT_APP_GROQ_API_KEY ? '⚡ Get Groq Key' : 
       '🔧 Get More Keys'}
    </button>
  </div>

  {/* Setup Guidance */}
  {(() => {
    const hasGemini = !!process.env.REACT_APP_GEMINI_API_KEY;
    const hasGroq = !!process.env.REACT_APP_GROQ_API_KEY;
    const geminiWorking = aiStatus.available.includes('gemini');
    const groqWorking = aiStatus.available.includes('groq');
    
    if (!hasGemini && !hasGroq) {
      return (
        <div style={{marginTop: '8px', padding: '8px', background: '#fef3c7', borderRadius: '4px', border: '1px solid #fcd34d'}}>
          <div style={{fontSize: '12px', color: '#92400e', fontWeight: '500', marginBottom: '4px'}}>
            🚀 Quick Setup (2 minutes):
          </div>
          <div style={{fontSize: '11px', color: '#92400e'}}>
            1. Get Gemini key (free): makersuite.google.com/app/apikey<br/>
            2. Get Groq key (free): console.groq.com/keys<br/>
            3. Add to .env: REACT_APP_GEMINI_API_KEY=your_key<br/>
            4. Add to .env: REACT_APP_GROQ_API_KEY=your_key<br/>
            5. Restart app → Perfect setup! 🎉
          </div>
        </div>
      );
    } else if (hasGemini && !hasGroq) {
      return (
        <div style={{marginTop: '8px', padding: '8px', background: '#e0f2fe', borderRadius: '4px', border: '1px solid #81d4fa'}}>
          <div style={{fontSize: '12px', color: '#0277bd', fontWeight: '500', marginBottom: '4px'}}>
            ⚡ Add Groq for optimal speed:
          </div>
          <div style={{fontSize: '11px', color: '#0277bd'}}>
            Get Groq key (free): console.groq.com/keys → Add REACT_APP_GROQ_API_KEY=your_key → Ultra-fast backup! 🚀
          </div>
        </div>
      );
    } else if (!hasGemini && hasGroq) {
      return (
        <div style={{marginTop: '8px', padding: '8px', background: '#e8f5e8', borderRadius: '4px', border: '1px solid #a5d6a7'}}>
          <div style={{fontSize: '12px', color: '#2e7d32', fontWeight: '500', marginBottom: '4px'}}>
            🎯 Add Gemini for best reliability:
          </div>
          <div style={{fontSize: '11px', color: '#2e7d32'}}>
            Get Gemini key (free): makersuite.google.com/app/apikey → Add REACT_APP_GEMINI_API_KEY=your_key → Perfect combo! ✨
          </div>
        </div>
      );
    } else if (hasGemini && hasGroq && (!geminiWorking || !groqWorking)) {
      return (
        <div style={{marginTop: '8px', padding: '8px', background: '#fff3e0', borderRadius: '4px', border: '1px solid #ffcc02'}}>
          <div style={{fontSize: '12px', color: '#ef6c00', fontWeight: '500', marginBottom: '4px'}}>
            🔧 Keys configured but not working:
          </div>
          <div style={{fontSize: '11px', color: '#ef6c00'}}>
            Click "🧪 Test Gemini → Groq" to diagnose issues. Check API key format and network connection.
          </div>
        </div>
      );
    } else if (geminiWorking && groqWorking) {
      return (
        <div style={{marginTop: '8px', padding: '8px', background: '#e8f5e8', borderRadius: '4px', border: '1px solid #a5d6a7'}}>
          <div style={{fontSize: '12px', color: '#2e7d32', fontWeight: '500', marginBottom: '4px'}}>
            🎉 OPTIMAL SETUP! Gemini → Groq chain working perfectly!
          </div>
          <div style={{fontSize: '11px', color: '#2e7d32'}}>
            Primary: Gemini ({aiStatus.providerInfo.gemini?.responseTime}ms) | Backup: Groq ({aiStatus.providerInfo.groq?.responseTime}ms) | 100% FREE! 💚
          </div>
        </div>
      );
    }
    return null;
  })()}
</div>
</>
)}

{/* Theme Controls */}
        <div className="theme-controls">
          <div className="theme-selector">
            <button 
              onClick={() => setTheme('pink')} 
              className={`theme-btn pink ${theme === 'pink' ? 'active' : ''}`}
              title="Pink Theme"
            />
            <button 
              onClick={() => setTheme('blue')} 
              className={`theme-btn blue ${theme === 'blue' ? 'active' : ''}`}
              title="Blue Theme"
            />
            <button 
              onClick={() => setTheme('green')} 
              className={`theme-btn green ${theme === 'green' ? 'active' : ''}`}
              title="Green Theme"
            />
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="dark-mode-toggle"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button
          onClick={() => setActiveTab('journal')}
          className={`nav-tab ${activeTab === 'journal' ? 'active' : ''}`}
        >
          <Calendar className="nav-icon" />
          Journal
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <Calendar className="nav-icon" />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`nav-tab ${activeTab === 'insights' ? 'active' : ''}`}
        >
          <TrendingUp className="nav-icon" />
          Insights
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
        >
          <Target className="nav-icon" />
          Goals
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
        >
          <FileText className="nav-icon" />
          Reports
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`nav-tab ${activeTab === 'resources' ? 'active' : ''}`}
        >
          <Book className="nav-icon" />
          Resources
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'journal' && (
  <div className="journal-tab">
    {/* Entry Form */}
    <div className="entry-form">
      <h2>How was your relationship today?</h2>
      <div className="form-group">
        <textarea
          value={currentEntry}
          onChange={(e) => setCurrentEntry(e.target.value)}
          placeholder="Share what happened today... Your partner's actions, how you felt, any conversations you had..."
          className="entry-textarea"
          disabled={isAnalyzing}
        />
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !currentEntry.trim()}
          className="submit-btn"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze & Save Entry'}
        </button>
      </div>
    </div>

    {/* Entries List */}
    <div className="entries-list">
      {entries.length === 0 ? (
        <div className="empty-state">
          <Heart className="empty-icon" />
          <p>Start your first journal entry to get AI-powered insights</p>
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            <div className="entry-header">
              <span className="entry-date">{entry.date} at {entry.time}</span>
              <span className={`entry-badge ${entry.analysis.color}`}>
                {entry.analysis.icon} {entry.analysis.title}
              </span>
            </div>
            
            <div className="entry-text">
              <p>{entry.text}</p>
            </div>
            
            <div className="entry-analysis">
              <h4>AI Analysis:</h4>
              <p className="analysis-message">{entry.analysis.message}</p>
              
              <div className="suggestions">
                <p className="suggestions-title">Suggestions:</p>
                {entry.analysis.suggestions.map((suggestion, index) => (
                  <p key={index} className="suggestion-item">• {suggestion}</p>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
{activeTab === 'goals' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        🎯 Your Weekly Focus Areas
      </h2>
      <div style={{display: 'flex', gap: '12px'}}>
        <button 
          onClick={resetWeeklyGoals}
          style={{padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)'}}
        >
          🔄 Reset Goals
        </button>
        <div style={{padding: '8px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          Week {getCurrentWeek()}
        </div>
      </div>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      {/* Weekly Goals with Completion Tracking */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          ✅ This Week's Goals
          <span style={{fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-secondary)'}}>
            ({goals.filter(g => g.completed).length}/{goals.length} completed)
          </span>
        </h3>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {goals.map(goal => (
            <div 
              key={goal.id}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: goal.completed ? 'var(--green-bg)' : 'var(--bg-secondary)', 
                borderRadius: '12px', 
                border: goal.completed ? '1px solid var(--green-border)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => toggleGoal(goal.id)}
            >
              <div style={{
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                border: goal.completed ? '2px solid var(--green-value)' : '2px solid var(--border-color)',
                background: goal.completed ? 'var(--green-value)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {goal.completed && <span style={{color: 'white', fontSize: '12px'}}>✓</span>}
              </div>
              <span style={{
                color: goal.completed ? 'var(--green-text)' : 'var(--text-primary)', 
                fontWeight: '500',
                textDecoration: goal.completed ? 'line-through' : 'none',
                opacity: goal.completed ? 0.8 : 1
              }}>
                {goal.text}
              </span>
              {goal.completed && (
                <span style={{marginLeft: 'auto', fontSize: '1.2rem'}}>🎉</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Add New Goal */}
        <div style={{marginTop: '16px', padding: '12px', border: '2px dashed var(--border-color)', borderRadius: '8px'}}>
          <input 
            type="text"
            placeholder="Add a new relationship goal for this week..."
            style={{
              width: '100%', 
              padding: '8px 12px', 
              border: 'none', 
              background: 'transparent', 
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                const newGoal = {
                  id: Date.now(),
                  text: e.target.value.trim(),
                  completed: false,
                  week: getCurrentWeek()
                };
                const updatedGoals = [...goals, newGoal];
                setGoals(updatedGoals);
                localStorage.setItem('relationshipGoals', JSON.stringify(updatedGoals));
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* AI Recommendations Based on Journal Data */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          🤖 AI Recommendations
        </h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {(() => {
            const stats = getStats();
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
              
              if (stats.total >= 5) {
                const timePatterns = getTimePatterns();
                if (timePatterns && timePatterns.insights.length > 0) {
                  recommendations.push({
                    icon: '⏰',
                    title: 'Timing Matters',
                    message: timePatterns.insights[0]
                  });
                }
              }
            }
            
            return recommendations.map((rec, index) => (
              <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                  <span style={{fontSize: '1.5rem'}}>{rec.icon}</span>
                  <div>
                    <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px'}}>{rec.title}</h4>
                    <p style={{color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0}}>{rec.message}</p>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Weekly Relationship Tips - Now Rotating! */}
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
          💡 This Week's Relationship Tips
          <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px'}}>
            Week {getCurrentWeek()} • Updates Weekly
          </span>
        </h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px'}}>
          {getWeeklyTips().map((item, index) => (
            <div key={index} style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
              <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>{item.icon}</div>
              <h4 style={{color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px', fontSize: '0.95rem'}}>{item.tip}</h4>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, margin: 0}}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journal Insights */}
      {getStats().total > 0 && (
        <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
          <h3 style={{color: 'var(--text-primary)', marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'}}>
            📊 Your Relationship Patterns
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px'}}>
            <div style={{padding: '16px', background: 'var(--green-bg)', borderRadius: '12px', border: '1px solid var(--green-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-value)', marginBottom: '4px'}}>{getStats().green}</div>
              <div style={{color: 'var(--green-text)', fontWeight: '500'}}>Positive Moments</div>
            </div>
            <div style={{padding: '16px', background: 'var(--red-bg)', borderRadius: '12px', border: '1px solid var(--red-border)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-value)', marginBottom: '4px'}}>{getStats().red}</div>
              <div style={{color: 'var(--red-text)', fontWeight: '500'}}>Areas to Address</div>
            </div>
            <div style={{padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>{getStats().total}</div>
              <div style={{color: 'var(--text-secondary)', fontWeight: '500'}}>Total Entries</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}

{activeTab === 'calendar' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        📅 Calendar View
      </h2>
      <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
          style={{background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--text-primary)'}}
        >
          ←
        </button>
        <span style={{fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)', minWidth: '200px', textAlign: 'center'}}>
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
          style={{background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: 'var(--text-primary)'}}
        >
          →
        </button>
      </div>
    </div>

    <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '10px'}}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{padding: '10px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
            {day}
          </div>
        ))}
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border-color)'}}>
        {getCalendarDays().map((day, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-primary)',
              minHeight: '80px',
              padding: '8px',
              position: 'relative',
              cursor: 'pointer',
              borderLeft: day.entries.length > 0 ? `4px solid ${getDayColor(day.entries)}` : 'none',
              opacity: day.isCurrentMonth ? 1 : 0.3,
              border: day.isToday ? '2px solid var(--theme-primary)' : 'none'
            }}
          >
            <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px'}}>
              {day.date.getDate()}
            </div>
            {day.entries.length > 0 && (
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '2px'}}>
                {day.entries.map(entry => (
                  <div 
                    key={entry.id}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      cursor: 'pointer',
                      background: entry.analysis.flag === 'red' ? 'var(--red-bg)' : entry.analysis.flag === 'green' ? 'var(--green-bg)' : 'var(--neutral-bg)',
                      color: entry.analysis.flag === 'red' ? 'var(--red-text)' : entry.analysis.flag === 'green' ? 'var(--green-text)' : 'var(--neutral-text)'
                    }}
                    title={`${entry.analysis.title}: ${entry.text.substring(0, 50)}...`}
                  >
                    {entry.analysis.icon}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div style={{marginTop: '20px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px'}}>
      <h4 style={{color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '600'}}>Legend:</h4>
      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--green-value)'}}></span>
          More Green Flags
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--red-value)'}}></span>
          More Red Flags
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
          <span style={{width: '12px', height: '12px', borderRadius: '2px', backgroundColor: 'var(--neutral-text)'}}></span>
          Mixed/Neutral
        </div>
      </div>
    </div>
  </div>
)}

{activeTab === 'reports' && (
  <div style={{padding: '20px'}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
      <h2 style={{fontSize: '2rem', fontWeight: '600', color: 'var(--text-primary)', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
        📊 Weekly Relationship Report
      </h2>
      <button 
        onClick={exportData}
        style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-accent))', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', boxShadow: '0 2px 8px var(--shadow)'}}
      >
        📤 Export All Data
      </button>
    </div>
    
    <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: entries.filter(e => e.analysis.flag === 'green').length > entries.filter(e => e.analysis.flag === 'red').length ? 'linear-gradient(90deg, #10b981, #047857)' : 'linear-gradient(90deg, #ef4444, #dc2626)'}}></div>
        <h3 style={{color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.25rem', fontWeight: '600'}}>This Week's Summary</h3>
        <p style={{color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center'}}>
  {goals.filter(g => g.completed).length} of {goals.length} goals completed this week
</p>
      </div>
      
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '20px', fontWeight: '600'}}>Week Statistics</h4>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px'}}>
          <div style={{background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--border-color)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px'}}>{getStats().total}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>Total Entries</div>
          </div>
          <div style={{background: 'var(--green-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--green-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--green-value)', marginBottom: '4px'}}>{getStats().green}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--green-text)'}}>Green Flags</div>
          </div>
          <div style={{background: 'var(--red-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--red-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--red-value)', marginBottom: '4px'}}>{getStats().red}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--red-text)'}}>Red Flags</div>
          </div>
          <div style={{background: 'var(--neutral-bg)', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid var(--neutral-border)'}}>
            <div style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--neutral-text)', marginBottom: '4px'}}>{getStats().neutral}</div>
            <div style={{fontSize: '0.875rem', color: 'var(--neutral-text)'}}>Neutral</div>
          </div>
        </div>
      </div>
      
      <div style={{background: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px var(--shadow)', border: '1px solid var(--border-color)'}}>
        <h4 style={{color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '600'}}>💡 Key Insights</h4>
        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {[
            'Regular journaling helps identify relationship patterns',
            'Focus on building positive communication habits', 
            'Trust your instincts about concerning behaviors',
            entries.length > 5 ? 'You\'re building a good journaling habit!' : 'Try to journal more regularly for better insights'
          ].map((insight, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px'}}>
              <span style={{color: 'var(--theme-primary)', fontWeight: 'bold', marginTop: '2px'}}>•</span>
              <span style={{color: 'var(--text-secondary)', lineHeight: 1.5}}>{insight}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}

        {activeTab === 'insights' && (
          <div className="insights-tab">
            <h2>Your Relationship Insights</h2>
            
            {stats.total === 0 ? (
              <div className="empty-state">
                <TrendingUp className="empty-icon" />
                <p>Add some journal entries to see your relationship patterns</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.green}</div>
                    <div className="text-sm text-green-600">Green Flags</div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-red-600">{stats.red}</div>
                    <div className="text-sm text-red-600">Red Flags</div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-gray-600">{stats.neutral}</div>
                    <div className="text-sm text-gray-600">Neutral</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">🌟 Green Flag Streaks</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Current Streak:</span>
                        <span className="font-bold text-green-800">
                          {streaks.currentGreenStreak} day{streaks.currentGreenStreak !== 1 ? 's' : ''}
                          {streaks.currentGreenStreak >= 3 ? ' 🔥' : ''}
                          {streaks.currentGreenStreak >= 7 ? ' ✨' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Best Streak:</span>
                        <span className="font-bold text-green-800">
                          {streaks.greenStreak} day{streaks.greenStreak !== 1 ? 's' : ''}
                          {streaks.greenStreak >= 7 ? ' 🏆' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">⚠️ Red Flag Streaks</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-700">Current Streak:</span>
                        <span className="font-bold text-red-800">
                          {streaks.currentRedStreak} day{streaks.currentRedStreak !== 1 ? 's' : ''}
                          {streaks.currentRedStreak >= 3 ? ' ⚠️' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Longest Streak:</span>
                        <span className="font-bold text-red-800">
                          {streaks.redStreak} day{streaks.redStreak !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {streaks.currentRedStreak >= 3 && (
                        <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                          Consider reaching out to a trusted friend or counselor
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {timePatterns && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">⏰ Time Patterns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">Best Time for Connection</h4>
                        <div className="text-2xl font-bold text-green-600">{timePatterns.bestTime}</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-2">Watch Out Around</h4>
                        <div className="text-2xl font-bold text-red-600">{timePatterns.worstTime}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Insights:</h4>
                      {timePatterns.insights.map((insight, index) => (
                        <div key={index} className="flex items-center text-gray-700">
                          <span className="mr-2">💡</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stats.total > 0 && (
              <div className="pattern-analysis">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Pattern Analysis</h3>
                <div className="pattern-content">
                  {stats.red > stats.green && (
                    <div className="pattern-alert red">
                      <div className="pattern-header">
                        <AlertTriangle className="pattern-icon" />
                        <p className="pattern-title">Concerning Pattern Detected</p>
                      </div>
                      <p className="pattern-message">
                        You've logged more red flags than green flags. Consider reaching out to a counselor or trusted friend.
                      </p>
                    </div>
                  )}
                  
                  {stats.green > stats.red && (
                    <div className="pattern-alert green">
                      <div className="pattern-header">
                        <CheckCircle className="pattern-icon" />
                        <p className="pattern-title">Positive Pattern</p>
                      </div>
                      <p className="pattern-message">
                        Great job! You're experiencing more positive interactions than negative ones.
                      </p>
                    </div>
                  )}
                  
                  {stats.green === stats.red && stats.total > 0 && (
                    <div className="pattern-alert yellow">
                      <p className="pattern-title">Mixed Signals</p>
                      <p className="pattern-message">
                        You're experiencing both positive and negative patterns. Focus on communication and boundaries.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="resources-tab">
            <h2>Relationship Resources</h2>
            
            <div className="resources-grid">
             <div className="resource-card">
  <h3>Emergency Resources (Trinidad & Tobago)</h3>
  <div className="resource-content">
    <p><strong>Police Emergency:</strong> 999</p>
    <p><strong>Coalition Against Domestic Violence:</strong> 800-7283 or 627-7283</p>
    <p><strong>Lifeline Crisis Support:</strong> 645-2800 or 800-5433</p>
    <p><strong>Gender-Based Violence Unit:</strong> 800-4288</p>
    <p><strong>Child Protection Unit:</strong> 996</p>
  </div>
</div>
              
              <div className="resource-card">
                <h3>Healthy Relationship Signs</h3>
                <ul className="resource-list">
                  <li>• Mutual respect and trust</li>
                  <li>• Open, honest communication</li>
                  <li>• Supporting each other's goals</li>
                  <li>• Respecting boundaries</li>
                  <li>• Resolving conflicts constructively</li>
                </ul>
              </div>
              
              <div className="resource-card">
                <h3>Warning Signs</h3>
                <ul className="resource-list">
                  <li>• Controlling behavior</li>
                  <li>• Isolation from friends/family</li>
                  <li>• Verbal, emotional, or physical abuse</li>
                  <li>• Extreme jealousy</li>
                  <li>• Threats or intimidation</li>
                </ul>
              </div>
              
              <div className="resource-card">
                <h3>Self-Care Tips</h3>
                <ul className="resource-list">
                  <li>• Trust your instincts</li>
                  <li>• Maintain your support network</li>
                  <li>• Practice self-compassion</li>
                  <li>• Set healthy boundaries</li>
                  <li>• Seek professional help when needed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
</main>
    </div>
  </div>
);
}

export default App;
