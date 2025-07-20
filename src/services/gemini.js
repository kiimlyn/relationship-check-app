const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

export const analyzeRelationshipEntry = async (text) => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  
  // Check if API key exists
  if (!apiKey || apiKey === 'your-api-key-here') {
    console.error('❌ API key not found or not set properly');
    throw new Error('API key not found. Please check your .env file has REACT_APP_GEMINI_API_KEY=your_actual_key');
  }
  
  // Level 3 Decision Tree Prompt - Crystal Clear Instructions
  const prompt = `You are a relationship safety analyzer. Your job is to help people recognize healthy vs unhealthy relationship patterns.

CLASSIFICATION SYSTEM:

🟢 GREEN FLAG = Loving, supportive, healthy behavior
🔴 RED FLAG = Harmful, controlling, dangerous behavior  
⚪ NEUTRAL = Normal, everyday relationship interactions

DECISION TREE:

1. Does the entry mention:
   - "Love you" / "Loved me" / "I love" → GREEN FLAG
   - Hugs, kisses, physical affection → GREEN FLAG
   - Listening, supporting, helping → GREEN FLAG
   
2. Does the entry mention:
   - Hitting, slapping, physical harm → RED FLAG
   - Name-calling, insults, cruel words → RED FLAG  
   - "Won't let me" / "Forbids" / "Controls" → RED FLAG
   - Threats, intimidation → RED FLAG
   
3. If neither above:
   - Normal activities, conversations → NEUTRAL

EXAMPLES TO LEARN FROM:

✅ "He told me he loved me" = GREEN (loving expression)
✅ "She said I love you for the first time" = GREEN (loving expression)
✅ "She listened to my problems" = GREEN (emotional support)  
✅ "We hugged goodbye" = GREEN (physical affection)
❌ "He hit me when angry" = RED (physical violence)
❌ "She called me stupid" = RED (verbal abuse)
❌ "Won't let me see friends" = RED (isolation/control)
⚪ "We had dinner together" = NEUTRAL (normal activity)
⚪ "Watched TV and talked" = NEUTRAL (regular interaction)

REQUIRED OUTPUT FORMAT:
{
  "flag": "green|red|neutral",
  "color": "green|red|neutral",
  "icon": "✅|🚩|⚪",
  "title": "Green Flag|Red Flag Detected|Neutral Interaction",
  "message": "Brief explanation of why this behavior fits this category",
  "suggestions": ["2-3 helpful suggestions based on the classification"]
}

SAFETY REMINDER: 
- When someone says "I love you" → This is GREEN (unless clearly manipulative context)
- When someone shows physical affection → This is GREEN
- When someone provides emotional support → This is GREEN
- Physical violence is ALWAYS RED
- Controlling behavior is ALWAYS RED

ANALYZE THIS JOURNAL ENTRY: "${text}"

Be accurate - people rely on this for their wellbeing and safety.`;

  try {
    console.log('🔍 Calling Gemini API with enhanced prompt...');
    console.log('🔑 API Key exists:', !!apiKey);
    console.log('📝 Text to analyze:', text.substring(0, 50) + '...');
    
   const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
body: JSON.stringify({
  contents: [{
    parts: [{
      text: prompt
    }]
  }],
  generationConfig: {
    temperature: 0.2
  }
})
});

    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      
      if (response.status === 404) {
        throw new Error('API endpoint not found. Please check your API key and endpoint URL.');
      } else if (response.status === 401) {
        throw new Error('Unauthorized. Please check your API key is valid.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('📦 Raw API Response:', data);
    
    // Validate response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid API response structure:', data);
      throw new Error('Invalid API response structure - no content found');
    }
    
    const aiText = data.candidates[0].content.parts[0].text;
    console.log('🤖 AI Response Text:', aiText);
    
    // Extract JSON from response (AI sometimes adds extra text)
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ No JSON found in AI response:', aiText);
      throw new Error('No valid JSON found in AI response');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    console.log('✅ Parsed AI Result:', result);
    
    // Validate the result has required fields
    if (!result.flag || !result.message || !result.suggestions) {
      console.error('❌ Invalid result structure:', result);
      throw new Error('AI response missing required fields');
    }
    
    console.log('🎉 Gemini API analysis successful!');
    return result;
    
  } catch (error) {
    console.error('💥 Gemini API Error:', error.message);
    console.error('🔍 Full error details:', error);
    
    // Re-throw the error so the calling function can handle it
    throw error;
  }
};

// Export additional utility functions if needed
export const validateApiKey = () => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  return apiKey && apiKey !== 'your-api-key-here' && apiKey.length > 10;
};

export const getApiStatus = async () => {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!validateApiKey()) {
      return { status: 'error', message: 'API key not configured' };
    }
    
    // Test with a simple request
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  contents: [{
    parts: [{
      text: prompt
    }]
  }],
  generationConfig: {
    temperature: 0.2
  }
})
    });

    if (response.ok) {
      return { status: 'success', message: 'API is working' };
    } else {
      return { status: 'error', message: `API Error: ${response.status}` };
    }
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};
